
-- Ensure the V6.1 pricing trigger is attached to the agents table
-- This handles both INSERTs (new agents) and UPDATEs (trades)

-- Drop existing trigger if it exists (to recreate cleanly)
DROP TRIGGER IF EXISTS update_agent_price_trigger ON agents;

-- Create trigger for BEFORE INSERT OR UPDATE
CREATE TRIGGER update_agent_price_trigger
  BEFORE INSERT OR UPDATE OF shares_sold, prompt_raised, pricing_model
  ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_price_on_prompt_change();

-- Also ensure atomic_update_agent_state uses the correct price for V6.1
-- The edge function already calculates the price correctly, but we should
-- not recalculate in the trigger when it's already being set by the edge function
CREATE OR REPLACE FUNCTION update_agent_price_on_prompt_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip price recalculation if current_price is already being set explicitly
  -- (e.g., from trading-engine-v6 via atomic_update_agent_state)
  IF TG_OP = 'UPDATE' AND NEW.current_price IS DISTINCT FROM OLD.current_price THEN
    -- Price was explicitly set, just update market_cap
    NEW.market_cap := NEW.current_price * 1000000000;
    RETURN NEW;
  END IF;

  -- Calculate price based on pricing model
  IF NEW.pricing_model = 'linear_v6_1' THEN
    -- V6.1: Use shares_sold with custom p0/p1
    NEW.current_price := get_current_linear_price_v6_1(
      COALESCE(NEW.shares_sold, 0),
      COALESCE(NEW.created_p0, 0.00004),
      COALESCE(NEW.created_p1, 0.00024)
    );
    NEW.market_cap := NEW.current_price * 1000000000;
  ELSIF NEW.pricing_model = 'linear_v4' THEN
    NEW.current_price := get_price_from_prompt_v4(NEW.prompt_raised);
    NEW.market_cap := NEW.current_price * 1000000000;
  ELSIF NEW.pricing_model = 'linear_v3' THEN
    NEW.current_price := get_price_from_prompt_v3(NEW.prompt_raised);
    NEW.market_cap := NEW.current_price * 1000000000;
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
