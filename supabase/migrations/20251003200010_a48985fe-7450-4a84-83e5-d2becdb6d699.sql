-- Fix V4 price calculation to return properly formatted numbers
-- The current function returns excessive decimal precision

CREATE OR REPLACE FUNCTION public.get_agent_current_price_v4(p_agent_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_tokens_sold NUMERIC;
  v_p0 NUMERIC;
  v_p1 NUMERIC;
  v_curve_supply NUMERIC := 800000000; -- 800M tokens
  v_slope NUMERIC;
  v_current_price NUMERIC;
BEGIN
  -- Get agent's V4 pricing parameters from the agents table
  SELECT
    COALESCE(bonding_curve_supply, 0),
    COALESCE(created_p0, 0.00004),  -- Use agent-specific P0
    COALESCE(created_p1, 0.0001)    -- Use agent-specific P1
  INTO v_tokens_sold, v_p0, v_p1
  FROM agents
  WHERE id = p_agent_id;

  -- If agent not found, return 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate slope for linear bonding curve
  v_slope := (v_p1 - v_p0) / v_curve_supply;

  -- Linear pricing formula: P(S) = P0 + slope * S
  v_current_price := v_p0 + (v_slope * v_tokens_sold);

  -- Round to 18 decimal places for reasonable precision
  RETURN ROUND(v_current_price, 18);
END;
$function$;