-- Phase 2: Database layer functions migration to Linear Bonding Curve Model
-- This migration updates pricing/trade functions from CPMM to Linear model using get_bonding_curve_config_v3()

-- 1) Linear price based on tokens sold (supply on curve)
CREATE OR REPLACE FUNCTION public.get_current_bonding_curve_price(tokens_sold numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cfg RECORD;
  m NUMERIC;
  s NUMERIC;
BEGIN
  SELECT * INTO cfg FROM public.get_bonding_curve_config_v3();
  -- Guard against division by zero
  IF cfg.curve_supply IS NULL OR cfg.curve_supply = 0 THEN
    RETURN cfg.p0;
  END IF;

  -- Clamp supply between 0 and curve_supply
  s := GREATEST(0, LEAST(tokens_sold, cfg.curve_supply));
  m := (cfg.p1 - cfg.p0) / cfg.curve_supply;

  RETURN cfg.p0 + m * s;
END;
$$;

-- 2) Linear buy math: solve integral cost = prompt_amount
-- cost(x) from s0 to s0+x: p0*x + m*s0*x + 0.5*m*x^2
-- Solve 0.5*m*x^2 + (p0 + m*s0)*x - A = 0
CREATE OR REPLACE FUNCTION public.calculate_tokens_from_prompt(
  current_tokens_sold numeric,
  prompt_amount numeric
)
RETURNS TABLE(
  token_amount numeric,
  new_tokens_sold numeric,
  new_price numeric,
  average_price numeric
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cfg RECORD;
  m NUMERIC;
  s0 NUMERIC := GREATEST(current_tokens_sold, 0);
  A NUMERIC := GREATEST(prompt_amount, 0);
  a NUMERIC;
  b NUMERIC;
  c NUMERIC;
  disc NUMERIC;
  x NUMERIC;
BEGIN
  SELECT * INTO cfg FROM public.get_bonding_curve_config_v3();

  IF A <= 0 THEN
    token_amount := 0;
    new_tokens_sold := s0;
    new_price := public.get_current_bonding_curve_price(s0);
    average_price := new_price;
    RETURN NEXT;
    RETURN;
  END IF;

  IF cfg.curve_supply IS NULL OR cfg.curve_supply = 0 THEN
    -- Degenerate: constant price p0
    x := A / NULLIF(cfg.p0, 0);
  ELSE
    m := (cfg.p1 - cfg.p0) / cfg.curve_supply;
    IF m = 0 THEN
      x := A / NULLIF(cfg.p0, 0);
    ELSE
      a := 0.5 * m;
      b := (cfg.p0 + m * s0);
      c := -A;
      disc := b*b - 4*a*c;
      IF disc < 0 THEN
        x := 0; -- numerical guard
      ELSE
        x := (-b + sqrt(disc)) / (2*a);
      END IF;
    END IF;
  END IF;

  token_amount := GREATEST(x, 0);
  new_tokens_sold := s0 + token_amount;
  new_price := public.get_current_bonding_curve_price(new_tokens_sold);
  average_price := CASE WHEN token_amount > 0 THEN A / token_amount ELSE new_price END;

  RETURN NEXT;
END;
$$;

-- 3) Linear sell math: prompt returned for selling x tokens
-- revenue(x) from s0-x to s0: p0*x + m*(s0*x - 0.5*x^2)
CREATE OR REPLACE FUNCTION public.calculate_prompt_from_tokens(
  current_tokens_sold numeric,
  token_amount numeric
)
RETURNS TABLE(
  prompt_amount numeric,
  new_tokens_sold numeric,
  new_price numeric,
  average_price numeric
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cfg RECORD;
  m NUMERIC;
  s0 NUMERIC := GREATEST(current_tokens_sold, 0);
  x NUMERIC := GREATEST(token_amount, 0);
  A NUMERIC;
BEGIN
  SELECT * INTO cfg FROM public.get_bonding_curve_config_v3();

  IF x <= 0 THEN
    prompt_amount := 0;
    new_tokens_sold := s0;
    new_price := public.get_current_bonding_curve_price(s0);
    average_price := new_price;
    RETURN NEXT;
    RETURN;
  END IF;

  IF cfg.curve_supply IS NULL OR cfg.curve_supply = 0 THEN
    -- Degenerate: constant price p0
    A := cfg.p0 * x;
  ELSE
    m := (cfg.p1 - cfg.p0) / cfg.curve_supply;
    A := cfg.p0 * x + m * (s0 * x - 0.5 * x * x);
  END IF;

  prompt_amount := GREATEST(A, 0);
  new_tokens_sold := GREATEST(s0 - x, 0);
  new_price := public.get_current_bonding_curve_price(new_tokens_sold);
  average_price := CASE WHEN x > 0 THEN prompt_amount / x ELSE new_price END;

  RETURN NEXT;
END;
$$;

-- 4) Update main trade executor to use linear math and config v3
CREATE OR REPLACE FUNCTION public.execute_bonding_curve_trade(
  p_agent_id uuid,
  p_user_id text,
  p_prompt_amount numeric,
  p_trade_type text,
  p_token_amount numeric DEFAULT 0,
  p_expected_price numeric DEFAULT 0.000001,
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
  cfg RECORD;
  v_fee_percent NUMERIC := 1; -- default fallback
  v_curve_remaining NUMERIC;
  v_cost_to_buy_remaining NUMERIC;
  m NUMERIC;
BEGIN
  -- Get config and derived slope
  SELECT * INTO cfg FROM public.get_bonding_curve_config_v3();
  v_fee_percent := COALESCE(cfg.trading_fee_percent, 1);
  m := CASE WHEN cfg.curve_supply IS NULL OR cfg.curve_supply = 0 THEN 0 ELSE (cfg.p1 - cfg.p0) / cfg.curve_supply END;

  -- Get graduation threshold
  SELECT graduation_threshold INTO v_graduation_threshold FROM get_bonding_curve_config_v3();
  
  -- Get agent data
  SELECT * INTO v_agent FROM agents WHERE id = p_agent_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Agent not found');
  END IF;

  v_old_prompt_raised := COALESCE(v_agent.prompt_raised, 0);
  v_current_tokens_sold := COALESCE(v_agent.bonding_curve_supply, 0);

  -- Prevent trading after graduation (DEX only)
  IF v_old_prompt_raised >= v_graduation_threshold THEN
    RETURN json_build_object('success', false, 'error', 'Agent has graduated - trading on DEX only');
  END IF;

  -- Get user overall PROMPT balance (test credits)
  SELECT balance INTO v_user_balance 
  FROM user_token_balances 
  WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO user_token_balances (user_id, balance, test_mode)
    VALUES (p_user_id, 10000, true);
    v_user_balance := 10000;
  END IF;

  -- Get user's current token balance for this agent
  SELECT COALESCE(token_balance, 0) INTO v_user_token_balance
  FROM agent_token_holders 
  WHERE agent_id = p_agent_id AND user_id = p_user_id;

  IF p_trade_type = 'buy' THEN
    -- Check user funds
    IF v_user_balance < p_prompt_amount THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient PROMPT balance');
    END IF;

    -- Capacity check: compute max PROMPT needed to buy all remaining supply
    v_curve_remaining := GREATEST(cfg.curve_supply - v_current_tokens_sold, 0);
    v_cost_to_buy_remaining := cfg.p0 * v_curve_remaining + m * (v_current_tokens_sold * v_curve_remaining + 0.5 * v_curve_remaining * v_curve_remaining);
    IF p_prompt_amount > v_cost_to_buy_remaining THEN
      RETURN json_build_object('success', false, 'error', 'Trade exceeds available curve supply');
    END IF;

    -- Linear buy calculation
    SELECT * INTO v_trade_calc 
    FROM calculate_tokens_from_prompt(v_current_tokens_sold, p_prompt_amount);

    v_tokens_received := COALESCE(v_trade_calc.token_amount, 0);
    v_new_price := COALESCE(v_trade_calc.new_price, public.get_current_bonding_curve_price(v_current_tokens_sold));

    -- Apply fee (percent)
    v_tokens_received := v_tokens_received * (100 - v_fee_percent) / 100;

    v_new_prompt_raised := v_old_prompt_raised + p_prompt_amount;

    -- Update user balance
    UPDATE user_token_balances 
    SET balance = balance - p_prompt_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Update agent state
    UPDATE agents 
    SET prompt_raised = v_new_prompt_raised,
        bonding_curve_supply = v_current_tokens_sold + v_trade_calc.token_amount,
        current_price = v_new_price,
        updated_at = now()
    WHERE id = p_agent_id;

    -- Graduation trigger
    IF v_old_prompt_raised < v_graduation_threshold AND v_new_prompt_raised >= v_graduation_threshold THEN
      v_has_graduated := true;
      INSERT INTO agent_graduation_events (
        agent_id, prompt_raised_at_graduation, graduation_status, metadata
      ) VALUES (
        p_agent_id, v_new_prompt_raised, 'initiated',
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
      
      UPDATE agents 
      SET token_graduated = true,
          graduation_event_id = v_graduation_event_id
      WHERE id = p_agent_id;
    END IF;

    -- Upsert holder
    INSERT INTO agent_token_holders (agent_id, user_id, token_balance, total_invested, average_buy_price)
    VALUES (p_agent_id, p_user_id, v_tokens_received, p_prompt_amount, NULL)
    ON CONFLICT (agent_id, user_id)
    DO UPDATE SET 
      token_balance = agent_token_holders.token_balance + EXCLUDED.token_balance,
      total_invested = agent_token_holders.total_invested + EXCLUDED.total_invested,
      average_buy_price = CASE 
        WHEN (agent_token_holders.token_balance + EXCLUDED.token_balance) > 0 THEN 
          (agent_token_holders.total_invested + EXCLUDED.total_invested) / (agent_token_holders.token_balance + EXCLUDED.token_balance)
        ELSE NULL END,
      updated_at = now();

    -- Recompute holders count
    SELECT COUNT(DISTINCT user_id) INTO v_holders_count
    FROM agent_token_holders WHERE agent_id = p_agent_id AND token_balance > 0;
    UPDATE agents SET token_holders = v_holders_count WHERE id = p_agent_id;

    -- Record trade
    INSERT INTO agent_token_buy_trades (
      agent_id, user_id, prompt_amount, token_amount, price_per_token, bonding_curve_price
    ) VALUES (
      p_agent_id, p_user_id, p_prompt_amount, v_tokens_received, 
      CASE WHEN v_tokens_received > 0 THEN p_prompt_amount / v_tokens_received ELSE v_new_price END,
      v_new_price
    );

    RETURN json_build_object(
      'success', true,
      'tokens_bought', v_tokens_received,
      'cost', p_prompt_amount,
      'new_balance', v_user_balance - p_prompt_amount,
      'new_price', v_new_price,
      'average_price', CASE WHEN v_tokens_received > 0 THEN p_prompt_amount / v_tokens_received ELSE v_new_price END,
      'holders_count', v_holders_count,
      'graduated', v_has_graduated,
      'graduation_event_id', v_graduation_event_id,
      'prompt_raised', v_new_prompt_raised
    );

  ELSIF p_trade_type = 'sell' THEN
    -- Check user has tokens
    IF v_user_token_balance < p_token_amount THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient token balance');
    END IF;

    -- Linear sell calculation
    SELECT * INTO v_trade_calc 
    FROM calculate_prompt_from_tokens(v_current_tokens_sold, p_token_amount);

    v_prompt_returned := COALESCE(v_trade_calc.prompt_amount, 0);
    v_new_price := COALESCE(v_trade_calc.new_price, public.get_current_bonding_curve_price(v_current_tokens_sold));

    -- Apply fee (percent)
    v_prompt_returned := v_prompt_returned * (100 - v_fee_percent) / 100;

    -- Update user balance
    UPDATE user_token_balances 
    SET balance = balance + v_prompt_returned,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Update agent state
    UPDATE agents 
    SET prompt_raised = GREATEST(v_old_prompt_raised - COALESCE(v_trade_calc.prompt_amount, 0), 0),
        bonding_curve_supply = GREATEST(v_trade_calc.new_tokens_sold, 0),
        current_price = v_new_price,
        updated_at = now()
    WHERE id = p_agent_id;

    -- Update holder
    UPDATE agent_token_holders 
    SET token_balance = token_balance - p_token_amount,
        updated_at = now()
    WHERE agent_id = p_agent_id AND user_id = p_user_id;

    -- Recompute holders count
    SELECT COUNT(DISTINCT user_id) INTO v_holders_count
    FROM agent_token_holders WHERE agent_id = p_agent_id AND token_balance > 0;
    UPDATE agents SET token_holders = v_holders_count WHERE id = p_agent_id;

    -- Record trade
    INSERT INTO agent_token_sell_trades (
      agent_id, user_id, prompt_amount, token_amount, price_per_token, bonding_curve_price
    ) VALUES (
      p_agent_id, p_user_id, v_prompt_returned, p_token_amount,
      CASE WHEN p_token_amount > 0 THEN v_prompt_returned / p_token_amount ELSE v_new_price END,
      v_new_price
    );

    RETURN json_build_object(
      'success', true,
      'tokens_sold', p_token_amount,
      'prompt_received', v_prompt_returned,
      'new_balance', v_user_balance + v_prompt_returned,
      'new_price', v_new_price,
      'average_price', CASE WHEN p_token_amount > 0 THEN v_prompt_returned / p_token_amount ELSE v_new_price END,
      'holders_count', v_holders_count,
      'graduated', false,
      'prompt_raised', GREATEST(v_agent.prompt_raised - COALESCE(v_trade_calc.prompt_amount, 0), 0)
    );

  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid trade type. Must be "buy" or "sell"');
  END IF;
END;
$$;

-- 5) Update simulate_price_impact to linear model for better UX estimates
CREATE OR REPLACE FUNCTION public.simulate_price_impact(
  p_agent_id uuid,
  p_prompt_amount numeric,
  p_trade_type text DEFAULT 'buy'
)
RETURNS TABLE(
  current_price numeric,
  impact_price numeric,
  price_impact_percent numeric,
  estimated_tokens numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  cfg RECORD;
  s0 NUMERIC;
  m NUMERIC;
  rec RECORD;
  cur_price NUMERIC;
  est_tokens NUMERIC := 0;
  impact NUMERIC := 0;
BEGIN
  SELECT * INTO cfg FROM public.get_bonding_curve_config_v3();
  m := CASE WHEN cfg.curve_supply IS NULL OR cfg.curve_supply = 0 THEN 0 ELSE (cfg.p1 - cfg.p0) / cfg.curve_supply END;

  SELECT COALESCE(bonding_curve_supply, 0) INTO s0 FROM agents WHERE id = p_agent_id;
  cur_price := public.get_current_bonding_curve_price(s0);

  IF p_trade_type = 'buy' THEN
    SELECT * INTO rec FROM calculate_tokens_from_prompt(s0, p_prompt_amount);
    est_tokens := COALESCE(rec.token_amount, 0);
    impact := public.get_current_bonding_curve_price(s0 + est_tokens);
  ELSE
    -- Estimate tokens to sell given prompt target using inverse quadratic
    -- Solve for x: A = p0*x + m*(s0*x - 0.5*x^2)
    -- => 0.5*m*x^2 - (p0 + m*s0)*x + A = 0
    IF m = 0 THEN
      est_tokens := p_prompt_amount / NULLIF(cfg.p0, 0);
    ELSE
      est_tokens := ((cfg.p0 + m*s0) - sqrt(GREATEST((cfg.p0 + m*s0)^2 - 2*m*p_prompt_amount, 0))) / NULLIF(m, 0);
    END IF;
    est_tokens := LEAST(GREATEST(est_tokens, 0), s0);
    impact := public.get_current_bonding_curve_price(GREATEST(s0 - est_tokens, 0));
  END IF;

  RETURN QUERY SELECT 
    cur_price,
    impact,
    CASE WHEN cur_price > 0 THEN ((impact - cur_price) / cur_price) * 100 ELSE 0 END,
    est_tokens;
END;
$$;