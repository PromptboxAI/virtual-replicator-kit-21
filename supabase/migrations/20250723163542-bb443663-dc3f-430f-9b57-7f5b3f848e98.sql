-- Create the missing execute_bonding_curve_trade function for trading
CREATE OR REPLACE FUNCTION public.execute_bonding_curve_trade(
  p_agent_id UUID,
  p_user_id TEXT,
  p_prompt_amount NUMERIC,
  p_trade_type TEXT,
  p_token_amount NUMERIC DEFAULT 0,
  p_expected_price NUMERIC DEFAULT 30.0,
  p_slippage NUMERIC DEFAULT 0.5
)
RETURNS JSON AS $$
DECLARE
  v_user_balance NUMERIC;
  v_agent RECORD;
  v_tokens_to_buy NUMERIC;
  v_total_cost NUMERIC;
  v_new_price NUMERIC;
  v_new_prompt_raised NUMERIC;
  v_result JSON;
BEGIN
  -- Get agent data
  SELECT * INTO v_agent FROM agents WHERE id = p_agent_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Agent not found'
    );
  END IF;

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

  IF p_trade_type = 'buy' THEN
    -- Check if user has enough balance
    IF v_user_balance < p_prompt_amount THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient balance'
      );
    END IF;

    -- Simple bonding curve calculation
    -- tokens = prompt_amount / current_price
    v_tokens_to_buy := p_prompt_amount / v_agent.current_price;
    v_total_cost := p_prompt_amount;
    
    -- Update user balance
    UPDATE user_token_balances 
    SET balance = balance - v_total_cost 
    WHERE user_id = p_user_id;
    
    -- Update agent prompt raised
    v_new_prompt_raised := v_agent.prompt_raised + p_prompt_amount;
    UPDATE agents 
    SET prompt_raised = v_new_prompt_raised 
    WHERE id = p_agent_id;
    
    -- Update or insert token holder
    INSERT INTO agent_token_holders (agent_id, user_id, token_balance, total_invested)
    VALUES (p_agent_id, p_user_id, v_tokens_to_buy, p_prompt_amount)
    ON CONFLICT (agent_id, user_id) 
    DO UPDATE SET 
      token_balance = agent_token_holders.token_balance + v_tokens_to_buy,
      total_invested = agent_token_holders.total_invested + p_prompt_amount;
    
    -- Record the trade
    INSERT INTO agent_token_buy_trades (
      agent_id, user_id, prompt_amount, token_amount, 
      price_per_token, bonding_curve_price
    ) VALUES (
      p_agent_id, p_user_id, p_prompt_amount, v_tokens_to_buy,
      v_agent.current_price, v_agent.current_price
    );
    
    RETURN json_build_object(
      'success', true,
      'tokens_bought', v_tokens_to_buy,
      'cost', v_total_cost,
      'new_balance', v_user_balance - v_total_cost
    );
    
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Sell functionality not implemented yet'
    );
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;