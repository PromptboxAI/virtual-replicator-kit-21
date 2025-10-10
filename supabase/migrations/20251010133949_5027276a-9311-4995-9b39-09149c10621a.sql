-- Fix agent_metrics_normalized view to include all agents (not just is_active=true)
DROP VIEW IF EXISTS agent_metrics_normalized CASCADE;

CREATE VIEW agent_metrics_normalized AS
SELECT
  a.id as agent_id,
  -- Price in PROMPT (convert TEXT to NUMERIC for calculations)
  CASE 
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric
    ELSE a.current_price
  END as price_prompt,
  -- Price in USD
  CASE 
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(fx.fx_rate_usd, 0.10)
    ELSE a.current_price * COALESCE(fx.fx_rate_usd, 0.10)
  END as price_usd,
  -- FX rate and staleness
  COALESCE(fx.fx_rate_usd, 0.10) as fx,
  COALESCE(fx.fx_rate_usd, 0.10) as prompt_usd_rate,
  EXTRACT(EPOCH FROM (NOW() - fx.asof))::int as fx_staleness_seconds,
  -- Supply
  1000000000 as total_supply,
  CASE 
    WHEN a.token_graduated THEN COALESCE(a.circulating_supply, 0)
    ELSE 1000000000
  END as circulating_supply,
  CASE 
    WHEN a.token_graduated THEN 'circulating'
    ELSE 'total'
  END as supply_policy,
  -- FDV (PROMPT)
  CASE 
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * 1000000000
    ELSE a.current_price * 1000000000
  END as fdv_prompt,
  -- FDV (USD)
  CASE 
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
    ELSE a.current_price * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
  END as fdv_usd,
  -- Market Cap (PROMPT)
  CASE 
    WHEN a.token_graduated THEN
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(a.circulating_supply, 0)
        ELSE a.current_price * COALESCE(a.circulating_supply, 0)
      END
    ELSE
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * 1000000000
        ELSE a.current_price * 1000000000
      END
  END as mcirc_prompt,
  -- Market Cap (USD)
  CASE 
    WHEN a.token_graduated THEN
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(a.circulating_supply, 0) * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * COALESCE(a.circulating_supply, 0) * COALESCE(fx.fx_rate_usd, 0.10)
      END
    ELSE
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
      END
  END as mcirc_usd,
  -- Alias for market_cap_usd (backwards compat)
  CASE 
    WHEN a.token_graduated THEN
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(a.circulating_supply, 0) * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * COALESCE(a.circulating_supply, 0) * COALESCE(fx.fx_rate_usd, 0.10)
      END
    ELSE
      CASE 
        WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)::numeric * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * 1000000000 * COALESCE(fx.fx_rate_usd, 0.10)
      END
  END as market_cap_usd,
  a.updated_at
FROM agents a
CROSS JOIN LATERAL (
  SELECT fx_rate_usd, asof
  FROM prompt_fx
  ORDER BY asof DESC
  LIMIT 1
) fx;
-- ✅ Removed WHERE a.is_active = true filter to include all agents