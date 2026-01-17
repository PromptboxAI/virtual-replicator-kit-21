-- Fix 1: Update trigger to handle bonding_curve_v8 pricing model
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
    ELSIF NEW.pricing_model = 'bonding_curve_v8' THEN
      NEW.market_cap := NEW.current_price * COALESCE(NEW.circulating_supply, 0);
    ELSE
      NEW.market_cap := NEW.current_price * COALESCE(NEW.shares_sold, 0);
    END IF;
    RETURN NEW;
  END IF;

  -- Calculate price based on pricing model
  IF NEW.pricing_model = 'bonding_curve_v8' THEN
    -- V8: Price comes from on-chain, use on_chain_price or created_p0
    IF NEW.on_chain_price IS NOT NULL AND NEW.on_chain_price > 0 THEN
      NEW.current_price := NEW.on_chain_price;
    ELSE
      NEW.current_price := COALESCE(NEW.created_p0, 0.00004);
    END IF;
  ELSIF NEW.pricing_model = 'linear_v7' THEN
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
    NEW.current_price := get_current_bonding_curve_price(
      CASE WHEN NEW.prompt_raised <= 0 THEN 0 ELSE NEW.prompt_raised * 0.1 END
    );
  END IF;
  
  -- Calculate market cap (V8 uses circulating_supply, others use shares_sold)
  IF NEW.token_graduated = true THEN
    NEW.market_cap := NEW.current_price * NEW.total_supply;
  ELSIF NEW.pricing_model = 'bonding_curve_v8' THEN
    NEW.market_cap := NEW.current_price * COALESCE(NEW.circulating_supply, 0);
  ELSE
    NEW.market_cap := NEW.current_price * COALESCE(NEW.shares_sold, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix 2: Update trade trigger to handle bonding_curve_v8
CREATE OR REPLACE FUNCTION update_agent_price_on_trade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pricing_model = 'bonding_curve_v8' THEN
    -- V8: Use on_chain_price directly
    IF NEW.on_chain_price IS NOT NULL AND NEW.on_chain_price > 0 THEN
      NEW.current_price := NEW.on_chain_price;
    END IF;
  ELSIF NEW.pricing_model = 'linear_v4' THEN
    NEW.current_price := get_agent_current_price_v4(NEW.id);
  ELSIF NEW.pricing_model = 'linear_v3' THEN
    NEW.current_price := get_price_from_prompt_v3(NEW.prompt_raised);
  ELSE
    NEW.current_price := get_current_bonding_curve_price(
      CASE 
        WHEN NEW.prompt_raised <= 0 THEN 0
        ELSE NEW.prompt_raised * 0.1
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix 6: Immediate fix for existing PATIO agent
UPDATE agents 
SET 
  current_price = on_chain_price,
  deployment_verified = true,
  deployed_at = created_at,
  creator_prebuy_amount = 50,
  token_holders = 1,
  dev_ownership_pct = (1169573.7455247384 / 1000000000) * 100
WHERE id = 'bd4b4392-9eb4-4e37-8944-625af1df883d';