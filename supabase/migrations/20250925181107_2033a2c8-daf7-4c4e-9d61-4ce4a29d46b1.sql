-- Update V3 configuration to V4 with corrected parameters
-- This fixes the 100x token issue by using proper pricing

-- Update the V3 config function to use V4 parameters  
CREATE OR REPLACE FUNCTION public.get_bonding_curve_config_v4()
 RETURNS TABLE(
   initial_prompt_reserve numeric, 
   initial_token_reserve numeric, 
   total_supply numeric, 
   graduation_threshold numeric, 
   trading_fee_percent numeric, 
   curve_supply numeric, 
   lp_supply numeric, 
   p0 numeric, 
   p1 numeric, 
   max_single_trade_default numeric, 
   max_daily_trade_default numeric, 
   max_user_daily_default numeric, 
   lp_prompt_allocation_percent numeric, 
   lp_lock_duration_days integer
 )
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT 
    -- Legacy AMM parameters (for existing agents)
    30000::NUMERIC as initial_prompt_reserve,
    1000000::NUMERIC as initial_token_reserve,
    1000000000::NUMERIC as total_supply,
    750000::NUMERIC as graduation_threshold,        -- CORRECTED: 750k instead of 42k
    1::NUMERIC as trading_fee_percent,
    
    -- V4 Linear curve parameters - CORRECTED
    800000000::NUMERIC as curve_supply,             -- 800M tokens for curve
    200000000::NUMERIC as lp_supply,                -- 200M tokens for LP
    0.0000075::NUMERIC as p0,                       -- CORRECTED: Starting price (7.5x higher)
    0.00075::NUMERIC as p1,                         -- CORRECTED: Ending price (~7.2x higher)
    
    -- Safety parameters
    1000::NUMERIC as max_single_trade_default,
    5000::NUMERIC as max_daily_trade_default,
    2000::NUMERIC as max_user_daily_default,
    
    -- LP parameters
    70::NUMERIC as lp_prompt_allocation_percent,    -- 70% of raised PROMPT
    365::INTEGER as lp_lock_duration_days           -- 1 year lock
$function$;

-- Update the linear price function to use V4 parameters
CREATE OR REPLACE FUNCTION public.get_current_linear_price_v4(p_tokens_sold numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  v_p0 CONSTANT NUMERIC := 0.0000075;  -- CORRECTED: Starting price
  v_p1 CONSTANT NUMERIC := 0.00075;    -- CORRECTED: Ending price  
  v_curve_supply CONSTANT NUMERIC := 800000000; -- 800M tokens for curve
BEGIN
  IF p_tokens_sold <= 0 THEN
    RETURN v_p0;
  END IF;
  
  IF p_tokens_sold >= v_curve_supply THEN
    RETURN v_p1;
  END IF;
  
  -- Linear interpolation: price = p0 + (p1-p0) * (tokens_sold / curve_supply)
  RETURN v_p0 + ((v_p1 - v_p0) * p_tokens_sold / v_curve_supply);
END;
$function$;

-- Update tokens sold calculation for V4
CREATE OR REPLACE FUNCTION public.tokens_sold_from_prompt_v4(p_prompt_raised numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  v_p0 CONSTANT NUMERIC := 0.0000075;  -- CORRECTED: Starting price
  v_p1 CONSTANT NUMERIC := 0.00075;    -- CORRECTED: Ending price
  v_curve_supply CONSTANT NUMERIC := 800000000;
  v_slope NUMERIC;
  v_a NUMERIC;
  v_b NUMERIC;
  v_c NUMERIC;
  v_discriminant NUMERIC;
BEGIN
  IF p_prompt_raised <= 0 THEN 
    RETURN 0; 
  END IF;

  -- For linear curve: prompt_raised = integral of price from 0 to s
  -- prompt_raised = p0*s + 0.5*slope*s^2, where slope = (p1-p0)/curve_supply
  -- Solve quadratic: 0.5*slope*s^2 + p0*s - prompt_raised = 0
  
  v_slope := (v_p1 - v_p0) / v_curve_supply;
  v_a := v_slope / 2;
  v_b := v_p0;
  v_c := -p_prompt_raised;

  -- If slope is effectively zero, use simple division
  IF ABS(v_slope) < 1e-15 THEN
    RETURN LEAST(p_prompt_raised / v_p0, v_curve_supply);
  END IF;

  v_discriminant := v_b * v_b - 4 * v_a * v_c;
  
  IF v_discriminant < 0 THEN 
    RETURN v_curve_supply; -- Max out at curve supply
  END IF;

  RETURN LEAST((-v_b + SQRT(v_discriminant)) / (2 * v_a), v_curve_supply);
END;
$function$;

-- Update price calculation from prompt for V4
CREATE OR REPLACE FUNCTION public.get_price_from_prompt_v4(p_prompt_raised numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN get_current_linear_price_v4(tokens_sold_from_prompt_v4(p_prompt_raised));
END;
$function$;

-- Update agent price trigger to use V4 for new agents
CREATE OR REPLACE FUNCTION public.update_agent_price_on_prompt_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.pricing_model = 'linear_v4' THEN
    -- Use V4 linear pricing (CORRECTED)
    NEW.current_price := get_price_from_prompt_v4(NEW.prompt_raised);
    NEW.market_cap := NEW.current_price * 1000000000; -- 1B total supply
  ELSIF NEW.pricing_model = 'linear_v3' THEN
    -- Use V3 linear pricing
    NEW.current_price := get_price_from_prompt_v3(NEW.prompt_raised);
    NEW.market_cap := NEW.current_price * 1000000000; -- 1B total supply
  ELSE
    -- Legacy AMM pricing for older agents
    NEW.current_price := get_current_bonding_curve_price(
      CASE 
        WHEN NEW.prompt_raised <= 0 THEN 0
        ELSE NEW.prompt_raised * 0.1
      END
    );
    NEW.market_cap := NEW.current_price * 1000000000;
  END IF;
  
  RETURN NEW;
END;
$function$;