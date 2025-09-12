-- PHASE 1.2: Fix Market Cap Formula
-- Fix market cap to use total supply (1B tokens) instead of prompt_raised
UPDATE agents
SET market_cap = current_price * 1000000000
WHERE pricing_model = 'linear_v3' OR pricing_model IS NULL;

-- PHASE 1.3: Fix V3 Pricing Functions
-- Create V3 pricing functions for linear bonding curve
CREATE OR REPLACE FUNCTION get_current_linear_price_v3(p_tokens_sold NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  v_p0 CONSTANT NUMERIC := 0.000001;  -- Starting price
  v_p1 CONSTANT NUMERIC := 0.000104;  -- Ending price  
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
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION tokens_sold_from_prompt_v3(p_prompt_raised NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  v_p0 CONSTANT NUMERIC := 0.000001;
  v_p1 CONSTANT NUMERIC := 0.000104;
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
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_price_from_prompt_v3(p_prompt_raised NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  RETURN get_current_linear_price_v3(tokens_sold_from_prompt_v3(p_prompt_raised));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the trigger to use V3 pricing for linear_v3 model
CREATE OR REPLACE FUNCTION update_agent_price_on_prompt_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pricing_model = 'linear_v3' THEN
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
$$ LANGUAGE plpgsql;