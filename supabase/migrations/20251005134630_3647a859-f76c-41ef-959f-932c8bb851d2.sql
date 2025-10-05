-- Phase 1: Data Normalization - Pricing Unification
-- =======================================================

-- 1) PROMPT → USD FX table (single source of truth for conversion rate)
CREATE TABLE IF NOT EXISTS prompt_fx (
  asof TIMESTAMPTZ PRIMARY KEY,
  fx_rate_usd NUMERIC NOT NULL
);

-- Seed fixed test rate for DB mode (1 PROMPT = $0.10 USD)
INSERT INTO prompt_fx(asof, fx_rate_usd)
VALUES (NOW(), 0.10)
ON CONFLICT (asof) DO NOTHING;

-- Enable RLS
ALTER TABLE prompt_fx ENABLE ROW LEVEL SECURITY;

-- Anyone can read FX rates
CREATE POLICY "FX rates are viewable by everyone"
  ON prompt_fx FOR SELECT
  USING (true);

-- Only admins can modify FX rates
CREATE POLICY "Only admins can modify FX rates"
  ON prompt_fx FOR ALL
  USING (has_role(auth.uid()::text, 'admin'::app_role));

-- 2) Normalized metrics view (single source for all price/cap calculations)
CREATE OR REPLACE VIEW agent_metrics_normalized AS
SELECT
  a.id AS agent_id,
  a.current_price AS price_prompt,              -- PROMPT per agent token (canonical source)
  fx.fx_rate_usd AS prompt_usd_rate,            -- FX rate (0.10 for test mode)
  (a.current_price * fx.fx_rate_usd) AS price_usd,  -- USD per agent token
  a.total_supply,
  a.bonding_curve_supply AS circulating_supply,
  -- FDV (Full Diluted Valuation) - pre-graduation default
  (a.current_price * a.total_supply) AS fdv_prompt,
  (a.current_price * fx.fx_rate_usd * a.total_supply) AS fdv_usd,
  -- Market Cap (Circulating) - optional
  (a.current_price * COALESCE(a.bonding_curve_supply, 0)) AS mcirc_prompt,
  (a.current_price * fx.fx_rate_usd * COALESCE(a.bonding_curve_supply, 0)) AS mcirc_usd,
  a.updated_at
FROM agents a
CROSS JOIN LATERAL (
  SELECT fx_rate_usd 
  FROM prompt_fx 
  ORDER BY asof DESC 
  LIMIT 1
) fx;

-- Grant access to the view
GRANT SELECT ON agent_metrics_normalized TO authenticated, anon;

-- 3) Fix V4 price updates on trades (ensure agents.current_price stays in sync)
-- This ensures the trigger uses the correct pricing function based on pricing_model
CREATE OR REPLACE FUNCTION update_agent_price_on_trade()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_price based on pricing model
  IF NEW.pricing_model = 'linear_v4' THEN
    -- Use V4 RPC for dynamic calculation
    NEW.current_price := get_agent_current_price_v4(NEW.id);
  ELSIF NEW.pricing_model = 'linear_v3' THEN
    -- Use V3 formula
    NEW.current_price := get_price_from_prompt_v3(NEW.prompt_raised);
  ELSE
    -- Legacy AMM pricing
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

-- Create trigger on agents table to update price when bonding_curve_supply changes
DROP TRIGGER IF EXISTS update_price_on_trade ON agents;
CREATE TRIGGER update_price_on_trade
  BEFORE UPDATE OF bonding_curve_supply, prompt_raised ON agents
  FOR EACH ROW
  WHEN (OLD.bonding_curve_supply IS DISTINCT FROM NEW.bonding_curve_supply 
        OR OLD.prompt_raised IS DISTINCT FROM NEW.prompt_raised)
  EXECUTE FUNCTION update_agent_price_on_trade();

COMMENT ON TABLE prompt_fx IS 'FX conversion rates for PROMPT → USD (single source of truth)';
COMMENT ON VIEW agent_metrics_normalized IS 'Normalized agent metrics: all prices in PROMPT, FDV and market cap pre-calculated in both units';