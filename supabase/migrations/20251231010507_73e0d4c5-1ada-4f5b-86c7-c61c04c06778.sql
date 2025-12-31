
-- Fix market cap calculation to use circulating supply (shares_sold) instead of total supply
-- For pre-graduation bonding curve agents, market cap = price × shares_sold

CREATE OR REPLACE FUNCTION update_agent_price_on_prompt_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip price recalculation if current_price is already being set explicitly
  -- (e.g., from trading-engine-v6 via atomic_update_agent_state)
  IF TG_OP = 'UPDATE' AND NEW.current_price IS DISTINCT FROM OLD.current_price THEN
    -- Price was explicitly set, calculate market cap based on circulating supply
    IF NEW.token_graduated = true THEN
      -- After graduation: use total supply for FDV-style market cap
      NEW.market_cap := NEW.current_price * NEW.total_supply;
    ELSE
      -- Pre-graduation: use shares_sold (circulating supply)
      NEW.market_cap := NEW.current_price * COALESCE(NEW.shares_sold, 0);
    END IF;
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
  ELSIF NEW.pricing_model = 'linear_v4' THEN
    NEW.current_price := get_price_from_prompt_v4(NEW.prompt_raised);
  ELSIF NEW.pricing_model = 'linear_v3' THEN
    NEW.current_price := get_price_from_prompt_v3(NEW.prompt_raised);
  ELSE
    -- Legacy AMM pricing for older agents
    NEW.current_price := get_current_bonding_curve_price(
      CASE 
        WHEN NEW.prompt_raised <= 0 THEN 0
        ELSE NEW.prompt_raised * 0.1
      END
    );
  END IF;
  
  -- Calculate market cap based on graduation status
  IF NEW.token_graduated = true THEN
    -- After graduation: use total supply for FDV-style market cap
    NEW.market_cap := NEW.current_price * NEW.total_supply;
  ELSE
    -- Pre-graduation: use shares_sold (circulating supply)
    NEW.market_cap := NEW.current_price * COALESCE(NEW.shares_sold, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix existing V6.1 agents with correct circulating market cap
UPDATE agents
SET market_cap = current_price * COALESCE(shares_sold, 0)
WHERE pricing_model = 'linear_v6_1'
AND token_graduated = false;
