-- Migration: Atomic balance operations
-- This fixes critical race conditions in trading and reward claiming

-- ============================================
-- ATOMIC POSITION UPDATE FUNCTION
-- Prevents race condition in balance updates
-- ============================================
CREATE OR REPLACE FUNCTION atomic_update_position(
  p_agent_id UUID,
  p_holder_address TEXT,
  p_delta NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
  v_old_balance NUMERIC;
BEGIN
  -- Normalize address
  p_holder_address := LOWER(p_holder_address);

  -- Try to update existing position atomically
  UPDATE agent_database_positions
  SET
    token_balance = token_balance + p_delta,
    last_updated = NOW()
  WHERE agent_id = p_agent_id
    AND holder_address = p_holder_address
    AND (token_balance + p_delta) >= 0  -- Prevent negative balance
  RETURNING token_balance, token_balance - p_delta INTO v_new_balance, v_old_balance;

  IF FOUND THEN
    -- Position existed and was updated
    IF v_new_balance = 0 THEN
      -- Clean up zero-balance positions
      DELETE FROM agent_database_positions
      WHERE agent_id = p_agent_id AND holder_address = p_holder_address;
    END IF;

    RETURN json_build_object(
      'success', true,
      'old_balance', v_old_balance,
      'new_balance', v_new_balance,
      'delta', p_delta
    );
  END IF;

  -- Position doesn't exist - only allow positive delta (buy)
  IF p_delta <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot sell: no position exists',
      'old_balance', 0,
      'new_balance', 0,
      'delta', p_delta
    );
  END IF;

  -- Insert new position
  INSERT INTO agent_database_positions (agent_id, holder_address, token_balance, last_updated)
  VALUES (p_agent_id, p_holder_address, p_delta, NOW())
  ON CONFLICT (agent_id, holder_address) DO UPDATE
  SET token_balance = agent_database_positions.token_balance + p_delta,
      last_updated = NOW();

  RETURN json_build_object(
    'success', true,
    'old_balance', 0,
    'new_balance', p_delta,
    'delta', p_delta
  );
END;
$$;

-- ============================================
-- ATOMIC AGENT STATE UPDATE FUNCTION
-- Prevents race condition in shares_sold/prompt_raised updates
-- ============================================
CREATE OR REPLACE FUNCTION atomic_update_agent_state(
  p_agent_id UUID,
  p_shares_delta NUMERIC,
  p_prompt_delta NUMERIC,
  p_new_price NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_shares NUMERIC;
  v_new_prompt NUMERIC;
  v_graduation_threshold NUMERIC := 42000;
  v_should_graduate BOOLEAN := false;
BEGIN
  UPDATE agents
  SET
    shares_sold = shares_sold + p_shares_delta,
    prompt_raised = prompt_raised + p_prompt_delta,
    current_price = p_new_price,
    updated_at = NOW()
  WHERE id = p_agent_id
    AND (shares_sold + p_shares_delta) >= 0
    AND (prompt_raised + p_prompt_delta) >= 0
  RETURNING shares_sold, prompt_raised INTO v_new_shares, v_new_prompt;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid state update or agent not found'
    );
  END IF;

  -- Check graduation threshold
  IF v_new_prompt >= v_graduation_threshold THEN
    v_should_graduate := true;
    UPDATE agents SET bonding_curve_phase = 'graduating' WHERE id = p_agent_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'shares_sold', v_new_shares,
    'prompt_raised', v_new_prompt,
    'current_price', p_new_price,
    'should_graduate', v_should_graduate
  );
END;
$$;

-- ============================================
-- ATOMIC CLAIM REWARDS FUNCTION
-- Prevents double-claim race condition
-- ============================================
CREATE OR REPLACE FUNCTION atomic_claim_reward(
  p_agent_id UUID,
  p_holder_address TEXT,
  p_claim_type TEXT  -- 'holder_reward' or 'team_vesting'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_reward NUMERIC;
  v_already_claimed NUMERIC;
  v_start_time TIMESTAMPTZ;
  v_vest_end_time TIMESTAMPTZ;
  v_vested_amount NUMERIC;
  v_claimable NUMERIC;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  p_holder_address := LOWER(p_holder_address);

  IF p_claim_type = 'holder_reward' THEN
    -- Lock the row for update (prevents race condition)
    SELECT total_reward_amount, claimed_amount, start_time, vest_end_time
    INTO v_total_reward, v_already_claimed, v_start_time, v_vest_end_time
    FROM agent_holder_rewards
    WHERE agent_id = p_agent_id AND holder_address = p_holder_address
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'No rewards found');
    END IF;

    -- Calculate vested amount
    IF v_now >= v_vest_end_time THEN
      v_vested_amount := v_total_reward;
    ELSIF v_now <= v_start_time THEN
      v_vested_amount := 0;
    ELSE
      v_vested_amount := v_total_reward *
        EXTRACT(EPOCH FROM (v_now - v_start_time)) /
        EXTRACT(EPOCH FROM (v_vest_end_time - v_start_time));
    END IF;

    v_claimable := v_vested_amount - v_already_claimed;

    IF v_claimable <= 0 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'No rewards available to claim',
        'vested', v_vested_amount,
        'claimed', v_already_claimed
      );
    END IF;

    -- Atomic update
    UPDATE agent_holder_rewards
    SET claimed_amount = claimed_amount + v_claimable
    WHERE agent_id = p_agent_id AND holder_address = p_holder_address;

    RETURN json_build_object(
      'success', true,
      'claimed_amount', v_claimable,
      'total_reward', v_total_reward,
      'remaining', v_total_reward - v_already_claimed - v_claimable
    );

  ELSIF p_claim_type = 'team_vesting' THEN
    -- Similar logic for team vesting
    RETURN json_build_object('success', false, 'error', 'Team vesting not implemented');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid claim type');
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION atomic_update_position TO service_role;
GRANT EXECUTE ON FUNCTION atomic_update_agent_state TO service_role;
GRANT EXECUTE ON FUNCTION atomic_claim_reward TO service_role;