-- Phase 0: Fix 4 blockers + implement API corrections
-- Blocker 1 & 2 & 3: Fix get_ohlc_with_fx (keep "buckets", remove 0.10 fallback, ISO timestamps)
DROP FUNCTION IF EXISTS get_ohlc_with_fx(uuid, text, int);

CREATE OR REPLACE FUNCTION get_ohlc_with_fx(
  p_agent_id uuid,
  p_timeframe text,
  p_limit int default 300
)
RETURNS TABLE(
  t text,
  o text,
  h text,
  l text,
  c text,
  v text,
  fx text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    to_char(ohlc.bucket_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS t,
    ohlc.open_prompt::text AS o,
    ohlc.high_prompt::text AS h,
    ohlc.low_prompt::text AS l,
    ohlc.close_prompt::text AS c,
    ohlc.volume_agent::text AS v,
    fx.fx_rate_usd::text AS fx
  FROM agent_ohlcv ohlc
  LEFT JOIN LATERAL (
    SELECT fx_rate_usd
    FROM prompt_fx
    WHERE asof <= ohlc.bucket_time
    ORDER BY asof DESC
    LIMIT 1
  ) fx ON TRUE
  WHERE ohlc.agent_id = p_agent_id
    AND ohlc.timeframe = p_timeframe
  ORDER BY ohlc.bucket_time ASC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_ohlc_with_fx IS 'Returns OHLC buckets with as-of FX rates in API shape: {t,o,h,l,c,v,fx}. No fallback FX. Ascending order.';

-- Blocker 4: Fix agent_metrics_normalized to expose fx properly
DROP VIEW IF EXISTS agent_metrics_normalized CASCADE;

CREATE VIEW agent_metrics_normalized AS
WITH latest_fx AS (
  SELECT 
    fx_rate_usd AS fx,
    EXTRACT(EPOCH FROM (NOW() - asof))::INTEGER AS fx_staleness_seconds
  FROM prompt_fx 
  ORDER BY asof DESC 
  LIMIT 1
)
SELECT
  a.id AS agent_id,
  
  -- V3/V4 routing based on pricing_model
  CASE
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)
    WHEN a.pricing_model = 'linear_v3' THEN get_price_from_prompt_v3(a.prompt_raised)
    ELSE a.current_price
  END AS price_prompt,
  
  -- Expose fx multiple ways for compatibility
  fx.fx AS fx,
  fx.fx AS prompt_usd_rate,
  fx.fx_staleness_seconds,
  
  -- USD price with routing
  (CASE
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)
    WHEN a.pricing_model = 'linear_v3' THEN get_price_from_prompt_v3(a.prompt_raised)
    ELSE a.current_price
  END * fx.fx) AS price_usd,
  
  a.total_supply,
  -- Use circulating_supply, fallback to bonding_curve_supply
  COALESCE(a.circulating_supply, a.bonding_curve_supply, 0) AS circulating_supply,
  
  -- Supply policy based on graduation status
  CASE 
    WHEN (SELECT status FROM agent_graduation g WHERE g.agent_id = a.id LIMIT 1) = 'graduated' 
    THEN 'CIRCULATING'
    ELSE 'FDV'
  END AS supply_policy,
  
  -- FDV (uses total_supply)
  (CASE
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)
    WHEN a.pricing_model = 'linear_v3' THEN get_price_from_prompt_v3(a.prompt_raised)
    ELSE a.current_price
  END * a.total_supply) AS fdv_prompt,
  
  (CASE
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)
    WHEN a.pricing_model = 'linear_v3' THEN get_price_from_prompt_v3(a.prompt_raised)
    ELSE a.current_price
  END * a.total_supply * fx.fx) AS fdv_usd,
  
  -- Market cap (uses circulating_supply)
  (CASE
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)
    WHEN a.pricing_model = 'linear_v3' THEN get_price_from_prompt_v3(a.prompt_raised)
    ELSE a.current_price
  END * COALESCE(a.circulating_supply, a.bonding_curve_supply, 0)) AS mcirc_prompt,
  
  (CASE
    WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)
    WHEN a.pricing_model = 'linear_v3' THEN get_price_from_prompt_v3(a.prompt_raised)
    ELSE a.current_price
  END * COALESCE(a.circulating_supply, a.bonding_curve_supply, 0) * fx.fx) AS mcirc_usd,
  
  a.updated_at
FROM agents a
CROSS JOIN latest_fx fx;

GRANT SELECT ON agent_metrics_normalized TO authenticated, anon;

COMMENT ON VIEW agent_metrics_normalized IS 'Normalized agent metrics with V3/V4 routing, FX staleness, supply_policy, and proper fx exposure';

-- Update check_pricing_consistency to include fdv_diff_pct
CREATE OR REPLACE FUNCTION check_pricing_consistency()
RETURNS TABLE(
  agent_id uuid,
  pricing_model text,
  stored_price numeric,
  calculated_price numeric,
  price_diff numeric,
  fdv_diff_pct numeric,
  ok boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    COALESCE(a.pricing_model, 'legacy') as pricing_model,
    a.current_price as stored_price,
    CASE
      WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)
      WHEN a.pricing_model = 'linear_v3' THEN get_price_from_prompt_v3(a.prompt_raised)
      ELSE get_current_bonding_curve_price(
        CASE WHEN a.prompt_raised <= 0 THEN 0 ELSE a.prompt_raised * 0.1 END
      )
    END as calculated_price,
    ABS(a.current_price - CASE
      WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)
      WHEN a.pricing_model = 'linear_v3' THEN get_price_from_prompt_v3(a.prompt_raised)
      ELSE get_current_bonding_curve_price(
        CASE WHEN a.prompt_raised <= 0 THEN 0 ELSE a.prompt_raised * 0.1 END
      )
    END) as price_diff,
    -- FDV diff %
    CASE 
      WHEN m.fdv_prompt > 0 THEN
        ABS((a.current_price * a.total_supply - m.fdv_prompt) / m.fdv_prompt) * 100
      ELSE 0
    END as fdv_diff_pct,
    ABS(a.current_price - CASE
      WHEN a.pricing_model = 'linear_v4' THEN get_agent_current_price_v4(a.id)
      WHEN a.pricing_model = 'linear_v3' THEN get_price_from_prompt_v3(a.prompt_raised)
      ELSE get_current_bonding_curve_price(
        CASE WHEN a.prompt_raised <= 0 THEN 0 ELSE a.prompt_raised * 0.1 END
      )
    END) < 0.000001 as ok
  FROM agents a
  LEFT JOIN agent_metrics_normalized m ON m.agent_id = a.id
  WHERE a.is_active = true
  ORDER BY price_diff DESC;
END;
$$;