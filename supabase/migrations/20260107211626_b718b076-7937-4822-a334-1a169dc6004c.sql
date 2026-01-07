-- V7 Bug Fixes: Price Trigger, atomic_update_agent_state, and existing agent fixes

-- Fix 1: Add linear_v7 support to price calculation trigger
CREATE OR REPLACE FUNCTION update_agent_price_on_prompt_change()
RETURNS TRIGGER AS $$
DECLARE
  v_tradeable_cap NUMERIC := 248000000;
  v_slope NUMERIC;
BEGIN
  -- Skip if price was explicitly set
  IF TG_OP = 'UPDATE' AND NEW.current_price IS DISTINCT FROM OLD.current_price THEN
    IF NEW.token_graduated = true THEN
      NEW.market_cap := NEW.current_price * NEW.total_supply;
    ELSE
      NEW.market_cap := NEW.current_price * COALESCE(NEW.shares_sold, 0);
    END IF;
    RETURN NEW;
  END IF;

  -- Calculate price based on pricing model
  IF NEW.pricing_model = 'linear_v7' THEN
    -- V7: Linear price from shares_sold using agent's p0/p1
    v_slope := (COALESCE(NEW.created_p1, 0.0003) - COALESCE(NEW.created_p0, 0.00004)) / v_tradeable_cap;
    NEW.current_price := COALESCE(NEW.created_p0, 0.00004) + v_slope * COALESCE(NEW.shares_sold, 0);
  ELSIF NEW.pricing_model = 'linear_v6_1' THEN
    NEW.current_price := get_current_linear_price_v6_1(
      COALESCE(NEW.shares_sold, 0),
      COALESCE(NEW.created_p0, 0.00004),
      COALESCE(NEW.created_p1, 0.00024)
    );
  ELSIF NEW.pricing_model = 'linear_v4' THEN
    NEW.current_price := get_price_from_prompt_v4(NEW.prompt_raised);
  ELSIF NEW.pricing_model = 'linear_v3' THEN
    NEW.current_price := get_price_from_prompt_v3(NEW.prompt_raised);
  ELSE
    -- Legacy AMM pricing
    NEW.current_price := get_current_bonding_curve_price(
      CASE WHEN NEW.prompt_raised <= 0 THEN 0 ELSE NEW.prompt_raised * 0.1 END
    );
  END IF;
  
  -- Calculate market cap
  IF NEW.token_graduated = true THEN
    NEW.market_cap := NEW.current_price * NEW.total_supply;
  ELSE
    NEW.market_cap := NEW.current_price * COALESCE(NEW.shares_sold, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists on agents table
DROP TRIGGER IF EXISTS trigger_update_agent_price ON agents;
CREATE TRIGGER trigger_update_agent_price
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_price_on_prompt_change();

-- Fix 2: Update atomic_update_agent_state with correct graduation threshold and bonding_curve_supply sync
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
  v_graduation_threshold NUMERIC := 42160;  -- V7 graduation threshold
  v_should_graduate BOOLEAN := false;
BEGIN
  UPDATE agents
  SET
    shares_sold = COALESCE(shares_sold, 0) + p_shares_delta,
    prompt_raised = COALESCE(prompt_raised, 0) + p_prompt_delta,
    current_price = p_new_price,
    bonding_curve_supply = COALESCE(shares_sold, 0) + p_shares_delta,  -- Sync bonding_curve_supply
    updated_at = NOW()
  WHERE id = p_agent_id
    AND (COALESCE(shares_sold, 0) + p_shares_delta) >= 0
    AND (COALESCE(prompt_raised, 0) + p_prompt_delta) >= 0
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

-- Fix 3: Update existing linear_v7 agents to fix bonding_curve_supply and graduation_threshold
UPDATE agents
SET 
  bonding_curve_supply = shares_sold,
  graduation_threshold = 42160,
  updated_at = NOW()
WHERE pricing_model = 'linear_v7';