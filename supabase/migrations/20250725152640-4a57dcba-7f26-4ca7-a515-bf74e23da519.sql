-- Stage 1: Graduation Trigger Enhancement
-- Create graduation events table for tracking graduation milestones

CREATE TABLE IF NOT EXISTS public.agent_graduation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  graduation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  prompt_raised_at_graduation NUMERIC NOT NULL,
  graduation_status TEXT NOT NULL DEFAULT 'initiated' CHECK (graduation_status IN ('initiated', 'contract_deploying', 'contract_deployed', 'liquidity_creating', 'liquidity_created', 'completed', 'failed')),
  v2_contract_address TEXT,
  deployment_tx_hash TEXT,
  liquidity_pool_address TEXT,
  liquidity_tx_hash TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create graduation transaction logs for detailed tracking
CREATE TABLE IF NOT EXISTS public.graduation_transaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  graduation_event_id UUID NOT NULL REFERENCES public.agent_graduation_events(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('contract_deployment', 'liquidity_creation', 'lp_token_lock')),
  transaction_hash TEXT,
  block_number BIGINT,
  gas_used BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  error_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_graduation_events_agent_id ON public.agent_graduation_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_graduation_events_status ON public.agent_graduation_events(graduation_status);
CREATE INDEX IF NOT EXISTS idx_graduation_transaction_logs_event_id ON public.graduation_transaction_logs(graduation_event_id);
CREATE INDEX IF NOT EXISTS idx_graduation_transaction_logs_type ON public.graduation_transaction_logs(transaction_type);

-- Add triggers for updated_at columns
CREATE TRIGGER update_agent_graduation_events_updated_at
  BEFORE UPDATE ON public.agent_graduation_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_graduation_transaction_logs_updated_at
  BEFORE UPDATE ON public.graduation_transaction_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced execute_bonding_curve_trade function with graduation trigger
CREATE OR REPLACE FUNCTION public.execute_bonding_curve_trade(
  p_agent_id uuid, 
  p_user_id text, 
  p_prompt_amount numeric, 
  p_trade_type text, 
  p_token_amount numeric DEFAULT 0, 
  p_expected_price numeric DEFAULT 30.0, 
  p_slippage numeric DEFAULT 0.5
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_balance NUMERIC;
  v_agent RECORD;
  v_current_tokens_sold NUMERIC;
  v_trade_calc RECORD;
  v_total_cost NUMERIC;
  v_tokens_received NUMERIC;
  v_prompt_returned NUMERIC;
  v_new_price NUMERIC;
  v_holders_count INTEGER;
  v_user_token_balance NUMERIC := 0;
  v_graduation_threshold NUMERIC;
  v_old_prompt_raised NUMERIC;
  v_new_prompt_raised NUMERIC;
  v_graduation_event_id UUID;
  v_has_graduated BOOLEAN := false;
BEGIN
  -- Get graduation threshold
  SELECT graduation_threshold INTO v_graduation_threshold FROM get_bonding_curve_config();
  
  -- Get agent data
  SELECT * INTO v_agent FROM agents WHERE id = p_agent_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Agent not found'
    );
  END IF;

  -- Store old prompt raised for graduation check
  v_old_prompt_raised := v_agent.prompt_raised;

  -- Check if agent has already graduated
  IF v_old_prompt_raised >= v_graduation_threshold THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Agent has graduated - trading on DEX only'
    );
  END IF;

  -- Calculate current tokens sold from prompt raised
  v_current_tokens_sold := COALESCE(v_agent.bonding_curve_supply, v_agent.prompt_raised * 0.1);

  -- Get user balance
  SELECT balance INTO v_user_balance 
  FROM user_token_balances 
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create user balance if doesn't exist
    INSERT INTO user_token_balances (user_id, balance, test_mode)
    VALUES (p_user_id, 10000, true);
    v_user_balance := 10000;
  END IF;

  -- Get user's current token balance for this agent
  SELECT COALESCE(token_balance, 0) INTO v_user_token_balance
  FROM agent_token_holders 
  WHERE agent_id = p_agent_id AND user_id = p_user_id;

  IF p_trade_type = 'buy' THEN
    -- Check if user has enough balance
    IF v_user_balance < p_prompt_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient PROMPT balance'
      );
    END IF;

    -- Calculate tokens to receive using AMM math
    SELECT * INTO v_trade_calc 
    FROM calculate_tokens_from_prompt(v_current_tokens_sold, p_prompt_amount);
    
    v_tokens_received := v_trade_calc.token_amount;
    v_total_cost := p_prompt_amount;
    v_new_price := v_trade_calc.new_price;
    
    -- Apply trading fee (1%)
    SELECT trading_fee_percent INTO v_total_cost FROM get_bonding_curve_config();
    v_tokens_received := v_tokens_received * (100 - v_total_cost) / 100;
    
    -- Calculate new prompt raised after trade
    v_new_prompt_raised := v_old_prompt_raised + p_prompt_amount;
    
    -- Update user balance
    UPDATE user_token_balances 
    SET balance = balance - p_prompt_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Update agent prompt raised and bonding curve supply
    UPDATE agents 
    SET prompt_raised = v_new_prompt_raised,
        bonding_curve_supply = v_trade_calc.new_tokens_sold,
        current_price = v_new_price,
        updated_at = now()
    WHERE id = p_agent_id;
    
    -- 🎓 GRADUATION TRIGGER CHECK
    IF v_old_prompt_raised < v_graduation_threshold AND v_new_prompt_raised >= v_graduation_threshold THEN
      v_has_graduated := true;
      
      -- Log graduation event
      INSERT INTO agent_graduation_events (
        agent_id,
        prompt_raised_at_graduation,
        graduation_status,
        metadata
      ) VALUES (
        p_agent_id,
        v_new_prompt_raised,
        'initiated',
        json_build_object(
          'triggering_trade', json_build_object(
            'user_id', p_user_id,
            'prompt_amount', p_prompt_amount,
            'tokens_received', v_tokens_received
          ),
          'final_prompt_raised', v_new_prompt_raised,
          'graduation_threshold', v_graduation_threshold
        )
      ) RETURNING id INTO v_graduation_event_id;
      
      -- Mark agent as graduated (for immediate UI updates)
      UPDATE agents 
      SET token_graduated = true,
          graduation_event_id = v_graduation_event_id
      WHERE id = p_agent_id;
      
      RAISE NOTICE '🎓 GRADUATION TRIGGERED for agent % with %.2f PROMPT raised!', p_agent_id, v_new_prompt_raised;
    END IF;
    
    -- Update or insert token holder
    INSERT INTO agent_token_holders (agent_id, user_id, token_balance, total_invested, average_buy_price)
    VALUES (p_agent_id, p_user_id, v_tokens_received, p_prompt_amount, v_trade_calc.average_price)
    ON CONFLICT (agent_id, user_id) 
    DO UPDATE SET 
      token_balance = agent_token_holders.token_balance + v_tokens_received,
      total_invested = agent_token_holders.total_invested + p_prompt_amount,
      average_buy_price = (agent_token_holders.total_invested + p_prompt_amount) / 
                         (agent_token_holders.token_balance + v_tokens_received),
      updated_at = now();
    
    -- Count unique holders with positive balance
    SELECT COUNT(DISTINCT user_id) INTO v_holders_count
    FROM agent_token_holders 
    WHERE agent_id = p_agent_id AND token_balance > 0;
    
    -- Update agent holders count
    UPDATE agents 
    SET token_holders = v_holders_count
    WHERE id = p_agent_id;
    
    -- Record the trade
    INSERT INTO agent_token_buy_trades (
      agent_id, user_id, prompt_amount, token_amount, 
      price_per_token, bonding_curve_price
    ) VALUES (
      p_agent_id, p_user_id, p_prompt_amount, v_tokens_received,
      v_trade_calc.average_price, v_new_price
    );
    
    RETURN json_build_object(
      'success', true,
      'tokens_bought', v_tokens_received,
      'cost', p_prompt_amount,
      'new_balance', v_user_balance - p_prompt_amount,
      'new_price', v_new_price,
      'average_price', v_trade_calc.average_price,
      'holders_count', v_holders_count,
      'graduated', v_has_graduated,
      'graduation_event_id', v_graduation_event_id,
      'prompt_raised', v_new_prompt_raised
    );
    
  ELSIF p_trade_type = 'sell' THEN
    -- Check if user has enough tokens
    IF v_user_token_balance < p_token_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient token balance'
      );
    END IF;

    -- Calculate prompt to receive using AMM math
    SELECT * INTO v_trade_calc 
    FROM calculate_prompt_from_tokens(v_current_tokens_sold, p_token_amount);
    
    v_prompt_returned := v_trade_calc.prompt_amount;
    v_new_price := v_trade_calc.new_price;
    
    -- Apply trading fee (1%)
    SELECT trading_fee_percent INTO v_total_cost FROM get_bonding_curve_config();
    v_prompt_returned := v_prompt_returned * (100 - v_total_cost) / 100;
    
    -- Update user balance
    UPDATE user_token_balances 
    SET balance = balance + v_prompt_returned,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Update agent prompt raised and bonding curve supply
    UPDATE agents 
    SET prompt_raised = prompt_raised - v_trade_calc.prompt_amount,
        bonding_curve_supply = v_trade_calc.new_tokens_sold,
        current_price = v_new_price,
        updated_at = now()
    WHERE id = p_agent_id;
    
    -- Update token holder
    UPDATE agent_token_holders 
    SET token_balance = token_balance - p_token_amount,
        updated_at = now()
    WHERE agent_id = p_agent_id AND user_id = p_user_id;
    
    -- Count unique holders with positive balance
    SELECT COUNT(DISTINCT user_id) INTO v_holders_count
    FROM agent_token_holders 
    WHERE agent_id = p_agent_id AND token_balance > 0;
    
    -- Update agent holders count
    UPDATE agents 
    SET token_holders = v_holders_count
    WHERE id = p_agent_id;
    
    -- Record the trade
    INSERT INTO agent_token_sell_trades (
      agent_id, user_id, prompt_amount, token_amount, 
      price_per_token, bonding_curve_price
    ) VALUES (
      p_agent_id, p_user_id, v_prompt_returned, p_token_amount,
      v_trade_calc.average_price, v_new_price
    );
    
    RETURN json_build_object(
      'success', true,
      'tokens_sold', p_token_amount,
      'prompt_received', v_prompt_returned,
      'new_balance', v_user_balance + v_prompt_returned,
      'new_price', v_new_price,
      'average_price', v_trade_calc.average_price,
      'holders_count', v_holders_count,
      'graduated', false,
      'prompt_raised', v_agent.prompt_raised - v_trade_calc.prompt_amount
    );
    
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid trade type. Must be "buy" or "sell"'
    );
  END IF;
  
END;
$$;

-- Add graduation_event_id column to agents table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'graduation_event_id'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN graduation_event_id UUID REFERENCES public.agent_graduation_events(id);
  END IF;
END $$;