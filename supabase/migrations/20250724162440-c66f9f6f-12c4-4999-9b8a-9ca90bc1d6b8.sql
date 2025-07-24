-- Drop and recreate the execute_bonding_curve_trade function with proper AMM bonding curve math
DROP FUNCTION IF EXISTS public.execute_bonding_curve_trade(uuid, text, numeric, text, numeric, numeric, numeric);

-- Bonding curve configuration constants
CREATE OR REPLACE FUNCTION public.get_bonding_curve_config()
RETURNS TABLE(
  initial_prompt_reserve NUMERIC,
  initial_token_reserve NUMERIC, 
  total_supply NUMERIC,
  graduation_threshold NUMERIC,
  trading_fee_percent NUMERIC
) LANGUAGE sql IMMUTABLE AS $$
  SELECT 
    30000::NUMERIC as initial_prompt_reserve,
    1000000::NUMERIC as initial_token_reserve,
    1000000000::NUMERIC as total_supply,
    42000::NUMERIC as graduation_threshold,
    1::NUMERIC as trading_fee_percent;
$$;

-- Get invariant (k = x * y)
CREATE OR REPLACE FUNCTION public.get_bonding_curve_invariant()
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT (SELECT initial_prompt_reserve FROM get_bonding_curve_config()) * 
         (SELECT initial_token_reserve FROM get_bonding_curve_config());
$$;

-- Calculate current reserves based on tokens sold
CREATE OR REPLACE FUNCTION public.get_current_reserves(tokens_sold NUMERIC)
RETURNS TABLE(prompt_reserve NUMERIC, token_reserve NUMERIC)
LANGUAGE sql IMMUTABLE AS $$
  SELECT 
    get_bonding_curve_invariant() / ((SELECT initial_token_reserve FROM get_bonding_curve_config()) - tokens_sold) as prompt_reserve,
    (SELECT initial_token_reserve FROM get_bonding_curve_config()) - tokens_sold as token_reserve;
$$;

-- Calculate current price based on tokens sold
CREATE OR REPLACE FUNCTION public.get_current_bonding_curve_price(tokens_sold NUMERIC)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT 
    (SELECT prompt_reserve FROM get_current_reserves(tokens_sold)) / 
    (SELECT token_reserve FROM get_current_reserves(tokens_sold));
$$;

-- Calculate tokens that can be bought with prompt amount (AMM style)
CREATE OR REPLACE FUNCTION public.calculate_tokens_from_prompt(current_tokens_sold NUMERIC, prompt_amount NUMERIC)
RETURNS TABLE(
  token_amount NUMERIC,
  new_tokens_sold NUMERIC,
  new_price NUMERIC,
  average_price NUMERIC
) LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  current_reserves RECORD;
  invariant NUMERIC;
  new_prompt_reserve NUMERIC;
  new_token_reserve NUMERIC;
  tokens_received NUMERIC;
BEGIN
  -- Get current reserves
  SELECT * INTO current_reserves FROM get_current_reserves(current_tokens_sold);
  
  -- Get invariant
  SELECT get_bonding_curve_invariant() INTO invariant;
  
  -- Calculate new reserves after adding prompt
  new_prompt_reserve := current_reserves.prompt_reserve + prompt_amount;
  new_token_reserve := invariant / new_prompt_reserve;
  
  -- Tokens received = current_token_reserve - new_token_reserve
  tokens_received := current_reserves.token_reserve - new_token_reserve;
  
  RETURN QUERY SELECT
    tokens_received as token_amount,
    current_tokens_sold + tokens_received as new_tokens_sold,
    get_current_bonding_curve_price(current_tokens_sold + tokens_received) as new_price,
    prompt_amount / tokens_received as average_price;
END;
$$;

-- Calculate prompt returned from selling tokens (AMM style)
CREATE OR REPLACE FUNCTION public.calculate_prompt_from_tokens(current_tokens_sold NUMERIC, token_amount NUMERIC)
RETURNS TABLE(
  prompt_amount NUMERIC,
  new_tokens_sold NUMERIC,
  new_price NUMERIC,
  average_price NUMERIC
) LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  current_reserves RECORD;
  invariant NUMERIC;
  new_token_reserve NUMERIC;
  new_prompt_reserve NUMERIC;
  prompt_returned NUMERIC;
BEGIN
  -- Get current reserves
  SELECT * INTO current_reserves FROM get_current_reserves(current_tokens_sold);
  
  -- Get invariant
  SELECT get_bonding_curve_invariant() INTO invariant;
  
  -- Calculate new reserves after adding tokens back
  new_token_reserve := current_reserves.token_reserve + token_amount;
  new_prompt_reserve := invariant / new_token_reserve;
  
  -- Prompt returned = current_prompt_reserve - new_prompt_reserve
  prompt_returned := current_reserves.prompt_reserve - new_prompt_reserve;
  
  RETURN QUERY SELECT
    prompt_returned as prompt_amount,
    current_tokens_sold - token_amount as new_tokens_sold,
    get_current_bonding_curve_price(current_tokens_sold - token_amount) as new_price,
    prompt_returned / token_amount as average_price;
END;
$$;

-- New execute_bonding_curve_trade function with proper AMM math
CREATE OR REPLACE FUNCTION public.execute_bonding_curve_trade(
  p_agent_id uuid, 
  p_user_id text, 
  p_prompt_amount numeric, 
  p_trade_type text, 
  p_token_amount numeric DEFAULT 0, 
  p_expected_price numeric DEFAULT 30.0, 
  p_slippage numeric DEFAULT 0.5
) RETURNS json
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

  -- Check if agent has graduated
  IF v_agent.prompt_raised >= v_graduation_threshold THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Agent has graduated - trading on DEX only'
    );
  END IF;

  -- Calculate current tokens sold from prompt raised
  -- This approximation will be improved as we fix the data
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
    
    -- Update user balance
    UPDATE user_token_balances 
    SET balance = balance - p_prompt_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Update agent prompt raised and bonding curve supply
    UPDATE agents 
    SET prompt_raised = prompt_raised + p_prompt_amount,
        bonding_curve_supply = v_trade_calc.new_tokens_sold,
        current_price = v_new_price,
        updated_at = now()
    WHERE id = p_agent_id;
    
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
      'holders_count', v_holders_count
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
      'holders_count', v_holders_count
    );
    
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid trade type. Must be "buy" or "sell"'
    );
  END IF;
  
END;
$$;