-- Create a function to execute bonding curve trades in a single transaction
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
BEGIN
  -- Validate trade type
  IF p_trade_type NOT IN ('buy', 'sell') THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Invalid trade type'::TEXT;
    RETURN;
  END IF;

  -- Get current agent data
  SELECT COALESCE(prompt_raised, 0) INTO current_prompt_raised
  FROM agents 
  WHERE id = p_agent_id;

  IF current_prompt_raised IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Agent not found'::TEXT;
    RETURN;
  END IF;

  -- Get current user balance
  SELECT COALESCE(balance, 0) INTO current_balance
  FROM user_token_balances 
  WHERE user_id = p_user_id;

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

    -- Calculate tokens to receive (simplified bonding curve)
    calculated_tokens := p_prompt_amount / (base_price + bonding_curve_k * current_prompt_raised);
    new_prompt_raised := current_prompt_raised + p_prompt_amount;
    new_price := base_price + bonding_curve_k * new_prompt_raised;

    -- Insert buy trade record
    INSERT INTO agent_token_buy_trades (
      agent_id, user_id, prompt_amount, token_amount, 
      price_per_token, bonding_curve_price
    ) VALUES (
      p_agent_id, p_user_id, p_prompt_amount, calculated_tokens,
      new_price, new_price
    );

    -- Update user PROMPT balance
    UPDATE user_token_balances 
    SET balance = balance - p_prompt_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

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
      average_buy_price = new_price,
      updated_at = now();

    -- Update agent metrics
    UPDATE agents 
    SET prompt_raised = new_prompt_raised,
        current_price = new_price,
        market_cap = new_price * new_prompt_raised,
        volume_24h = COALESCE(volume_24h, 0) + p_prompt_amount,
        updated_at = now()
    WHERE id = p_agent_id;

    RETURN QUERY SELECT TRUE, calculated_tokens, new_price, new_prompt_raised, 'Buy trade successful'::TEXT;

  ELSE -- sell
    -- Get user's token balance for this agent
    SELECT COALESCE(token_balance, 0) INTO current_holder_balance
    FROM agent_token_holders
    WHERE agent_id = p_agent_id AND user_id = p_user_id;

    -- Validate sufficient token balance for sell
    IF current_holder_balance < p_token_amount THEN
      RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Insufficient token balance'::TEXT;
      RETURN;
    END IF;

    -- Calculate PROMPT to receive (simplified bonding curve)
    calculated_prompt := p_token_amount * (base_price + bonding_curve_k * (current_prompt_raised - p_token_amount));
    new_prompt_raised := current_prompt_raised - calculated_prompt;
    new_price := base_price + bonding_curve_k * new_prompt_raised;

    -- Insert sell trade record
    INSERT INTO agent_token_sell_trades (
      agent_id, user_id, token_amount, prompt_amount,
      price_per_token, bonding_curve_price
    ) VALUES (
      p_agent_id, p_user_id, p_token_amount, calculated_prompt,
      new_price, new_price
    );

    -- Update user PROMPT balance
    UPDATE user_token_balances 
    SET balance = balance + calculated_prompt,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Update token holder record
    UPDATE agent_token_holders
    SET token_balance = token_balance - p_token_amount,
        updated_at = now()
    WHERE agent_id = p_agent_id AND user_id = p_user_id;

    -- Update agent metrics
    UPDATE agents 
    SET prompt_raised = new_prompt_raised,
        current_price = new_price,
        market_cap = new_price * new_prompt_raised,
        volume_24h = COALESCE(volume_24h, 0) + calculated_prompt,
        updated_at = now()
    WHERE id = p_agent_id;

    RETURN QUERY SELECT TRUE, calculated_prompt, new_price, new_prompt_raised, 'Sell trade successful'::TEXT;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback will happen automatically
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, SQLERRM::TEXT;
END;
$$;