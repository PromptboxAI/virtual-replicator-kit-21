-- Fix the execute_bonding_curve_trade function to address critical robustness issues
CREATE OR REPLACE FUNCTION public.execute_bonding_curve_trade(
  p_agent_id UUID,
  p_user_id TEXT,
  p_prompt_amount NUMERIC,
  p_trade_type TEXT,
  p_token_amount NUMERIC DEFAULT 0,
  p_expected_price NUMERIC DEFAULT 0,
  p_slippage NUMERIC DEFAULT 2
)
RETURNS TABLE(
  success BOOLEAN,
  token_amount NUMERIC,
  new_price NUMERIC,
  new_prompt_raised NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  current_prompt_raised NUMERIC;
  current_balance NUMERIC;
  calculated_tokens NUMERIC;
  calculated_prompt NUMERIC;
  new_price NUMERIC;
  new_prompt_raised NUMERIC;
  graduation_threshold NUMERIC := 42000;
  base_price NUMERIC := 30;
  bonding_curve_k NUMERIC := 0.001;
  current_holder_balance NUMERIC := 0;
  current_total_invested NUMERIC := 0;
  price_impact NUMERIC;
  max_slippage_price NUMERIC;
  min_slippage_price NUMERIC;
  affected_rows INTEGER;
BEGIN
  -- Start explicit transaction
  -- Note: This function is already wrapped in a transaction by default in PL/pgSQL
  
  -- Validate trade type
  IF p_trade_type NOT IN ('buy', 'sell') THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Invalid trade type'::TEXT;
    RETURN;
  END IF;

  -- Validate amounts with precision limits (max 6 decimal places)
  IF p_prompt_amount <= 0 OR p_prompt_amount != ROUND(p_prompt_amount, 6) THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Invalid prompt amount - must be positive and max 6 decimals'::TEXT;
    RETURN;
  END IF;

  -- Get current agent data with row lock to prevent race conditions
  SELECT COALESCE(prompt_raised, 0) INTO current_prompt_raised
  FROM agents 
  WHERE id = p_agent_id
  FOR UPDATE;

  IF current_prompt_raised IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Agent not found'::TEXT;
    RETURN;
  END IF;

  -- Get current user balance with row lock
  SELECT COALESCE(balance, 0) INTO current_balance
  FROM user_token_balances 
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Initialize balance if user doesn't exist
  IF current_balance IS NULL THEN
    INSERT INTO user_token_balances (user_id, balance, test_mode)
    VALUES (p_user_id, 1000, true)
    ON CONFLICT (user_id) DO NOTHING;
    current_balance := 1000;
  END IF;

  IF p_trade_type = 'buy' THEN
    -- Validate sufficient balance for buy
    IF current_balance < p_prompt_amount THEN
      RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Insufficient PROMPT balance'::TEXT;
      RETURN;
    END IF;

    -- Calculate tokens to receive with proper rounding (6 decimals)
    calculated_tokens := ROUND(p_prompt_amount / (base_price + bonding_curve_k * current_prompt_raised), 6);
    new_prompt_raised := current_prompt_raised + p_prompt_amount;
    new_price := ROUND(base_price + bonding_curve_k * new_prompt_raised, 6);

    -- Slippage protection - check if price is within acceptable range
    IF p_expected_price > 0 THEN
      max_slippage_price := p_expected_price * (1 + p_slippage / 100);
      min_slippage_price := p_expected_price * (1 - p_slippage / 100);
      
      IF new_price > max_slippage_price THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 
          FORMAT('Price slippage too high: expected %s, got %s (max allowed: %s)', 
                 p_expected_price, new_price, max_slippage_price)::TEXT;
        RETURN;
      END IF;
    END IF;

    -- Check graduation threshold won't be exceeded
    IF new_prompt_raised > graduation_threshold THEN
      RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Trade would exceed graduation threshold'::TEXT;
      RETURN;
    END IF;

    -- Update user PROMPT balance with validation
    UPDATE user_token_balances 
    SET balance = balance - p_prompt_amount,
        updated_at = now()
    WHERE user_id = p_user_id AND balance >= p_prompt_amount;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows = 0 THEN
      RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Failed to update user balance - insufficient funds or race condition'::TEXT;
      RETURN;
    END IF;

    -- Get current holder data
    SELECT COALESCE(token_balance, 0), COALESCE(total_invested, 0)
    INTO current_holder_balance, current_total_invested
    FROM agent_token_holders
    WHERE agent_id = p_agent_id AND user_id = p_user_id;

    -- Update or insert token holder record
    INSERT INTO agent_token_holders (
      agent_id, user_id, token_balance, total_invested, average_buy_price
    ) VALUES (
      p_agent_id, p_user_id, calculated_tokens, p_prompt_amount, new_price
    ) ON CONFLICT (agent_id, user_id) 
    DO UPDATE SET 
      token_balance = agent_token_holders.token_balance + calculated_tokens,
      total_invested = agent_token_holders.total_invested + p_prompt_amount,
      average_buy_price = ROUND((agent_token_holders.total_invested + p_prompt_amount) / (agent_token_holders.token_balance + calculated_tokens), 6),
      updated_at = now();

    -- Update agent metrics with validation
    UPDATE agents 
    SET prompt_raised = new_prompt_raised,
        current_price = new_price,
        market_cap = ROUND(new_price * new_prompt_raised, 6),
        volume_24h = COALESCE(volume_24h, 0) + p_prompt_amount,
        updated_at = now()
    WHERE id = p_agent_id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows = 0 THEN
      RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Failed to update agent metrics'::TEXT;
      RETURN;
    END IF;

    -- Insert buy trade record
    INSERT INTO agent_token_buy_trades (
      agent_id, user_id, prompt_amount, token_amount, 
      price_per_token, bonding_curve_price
    ) VALUES (
      p_agent_id, p_user_id, p_prompt_amount, calculated_tokens,
      new_price, new_price
    );

    RETURN QUERY SELECT TRUE, calculated_tokens, new_price, new_prompt_raised, 'Buy trade successful'::TEXT;

  ELSE -- sell
    -- Validate token amount with precision
    IF p_token_amount <= 0 OR p_token_amount != ROUND(p_token_amount, 6) THEN
      RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Invalid token amount - must be positive and max 6 decimals'::TEXT;
      RETURN;
    END IF;

    -- Get user's token balance for this agent with lock
    SELECT COALESCE(token_balance, 0) INTO current_holder_balance
    FROM agent_token_holders
    WHERE agent_id = p_agent_id AND user_id = p_user_id
    FOR UPDATE;

    -- Validate sufficient token balance for sell
    IF current_holder_balance < p_token_amount THEN
      RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Insufficient token balance'::TEXT;
      RETURN;
    END IF;

    -- Calculate PROMPT to receive with proper rounding
    calculated_prompt := ROUND(p_token_amount * (base_price + bonding_curve_k * (current_prompt_raised - p_token_amount)), 6);
    new_prompt_raised := current_prompt_raised - calculated_prompt;
    new_price := ROUND(base_price + bonding_curve_k * new_prompt_raised, 6);

    -- Prevent negative prompt_raised or market_cap
    IF new_prompt_raised < 0 THEN
      RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Trade would result in negative prompt raised'::TEXT;
      RETURN;
    END IF;

    -- Slippage protection for sells
    IF p_expected_price > 0 THEN
      max_slippage_price := p_expected_price * (1 + p_slippage / 100);
      min_slippage_price := p_expected_price * (1 - p_slippage / 100);
      
      IF new_price < min_slippage_price THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 
          FORMAT('Price slippage too high: expected %s, got %s (min allowed: %s)', 
                 p_expected_price, new_price, min_slippage_price)::TEXT;
        RETURN;
      END IF;
    END IF;

    -- Update token holder record with validation
    UPDATE agent_token_holders
    SET token_balance = token_balance - p_token_amount,
        updated_at = now()
    WHERE agent_id = p_agent_id AND user_id = p_user_id AND token_balance >= p_token_amount;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows = 0 THEN
      RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Failed to update token balance - insufficient tokens or race condition'::TEXT;
      RETURN;
    END IF;

    -- Update user PROMPT balance
    UPDATE user_token_balances 
    SET balance = balance + calculated_prompt,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Update agent metrics with validation
    UPDATE agents 
    SET prompt_raised = new_prompt_raised,
        current_price = new_price,
        market_cap = ROUND(new_price * new_prompt_raised, 6),
        volume_24h = COALESCE(volume_24h, 0) + calculated_prompt,
        updated_at = now()
    WHERE id = p_agent_id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows = 0 THEN
      RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Failed to update agent metrics'::TEXT;
      RETURN;
    END IF;

    -- Insert sell trade record
    INSERT INTO agent_token_sell_trades (
      agent_id, user_id, token_amount, prompt_amount,
      price_per_token, bonding_curve_price
    ) VALUES (
      p_agent_id, p_user_id, p_token_amount, calculated_prompt,
      new_price, new_price
    );

    RETURN QUERY SELECT TRUE, calculated_prompt, new_price, new_prompt_raised, 'Sell trade successful'::TEXT;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    -- Detailed error logging and automatic rollback
    RAISE LOG 'Trade execution failed for agent % user % type %: %', p_agent_id, p_user_id, p_trade_type, SQLERRM;
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 
      FORMAT('Transaction failed: %s', SQLERRM)::TEXT;
END;
$$;