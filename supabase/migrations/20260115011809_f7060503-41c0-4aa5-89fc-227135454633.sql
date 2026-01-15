-- ============================================
-- Fix Security Definer Views - Add security_invoker=on
-- ============================================

-- Drop and recreate agent_metrics_normalized with security_invoker
DROP VIEW IF EXISTS public.agent_metrics_normalized;

CREATE VIEW public.agent_metrics_normalized
WITH (security_invoker=on) AS
SELECT 
  a.id AS agent_id,
  CASE
    WHEN a.pricing_model = 'linear_v4'::text THEN get_agent_current_price_v4(a.id)::numeric
    ELSE a.current_price
  END AS price_prompt,
  CASE
    WHEN a.pricing_model = 'linear_v4'::text THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(fx.fx_rate_usd, 0.10)
    ELSE a.current_price * COALESCE(fx.fx_rate_usd, 0.10)
  END AS price_usd,
  COALESCE(fx.fx_rate_usd, 0.10) AS fx,
  COALESCE(fx.fx_rate_usd, 0.10) AS prompt_usd_rate,
  EXTRACT(epoch FROM now() - fx.asof)::integer AS fx_staleness_seconds,
  1000000000 AS total_supply,
  CASE
    WHEN a.token_graduated THEN COALESCE(a.circulating_supply, 0::bigint)
    ELSE 1000000000::bigint
  END AS circulating_supply,
  CASE
    WHEN a.token_graduated THEN 'circulating'::text
    ELSE 'total'::text
  END AS supply_policy,
  CASE
    WHEN a.pricing_model = 'linear_v4'::text THEN get_agent_current_price_v4(a.id)::numeric * 1000000000::numeric
    ELSE a.current_price * 1000000000::numeric
  END AS fdv_prompt,
  CASE
    WHEN a.pricing_model = 'linear_v4'::text THEN get_agent_current_price_v4(a.id)::numeric * 1000000000::numeric * COALESCE(fx.fx_rate_usd, 0.10)
    ELSE a.current_price * 1000000000::numeric * COALESCE(fx.fx_rate_usd, 0.10)
  END AS fdv_usd,
  CASE
    WHEN a.token_graduated THEN
      CASE
        WHEN a.pricing_model = 'linear_v4'::text THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(a.circulating_supply, 0::bigint)::numeric
        ELSE a.current_price * COALESCE(a.circulating_supply, 0::bigint)::numeric
      END
    ELSE
      CASE
        WHEN a.pricing_model = 'linear_v4'::text THEN get_agent_current_price_v4(a.id)::numeric * 1000000000::numeric
        ELSE a.current_price * 1000000000::numeric
      END
  END AS mcirc_prompt,
  CASE
    WHEN a.token_graduated THEN
      CASE
        WHEN a.pricing_model = 'linear_v4'::text THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(a.circulating_supply, 0::bigint)::numeric * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * COALESCE(a.circulating_supply, 0::bigint)::numeric * COALESCE(fx.fx_rate_usd, 0.10)
      END
    ELSE
      CASE
        WHEN a.pricing_model = 'linear_v4'::text THEN get_agent_current_price_v4(a.id)::numeric * 1000000000::numeric * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * 1000000000::numeric * COALESCE(fx.fx_rate_usd, 0.10)
      END
  END AS mcirc_usd,
  CASE
    WHEN a.token_graduated THEN
      CASE
        WHEN a.pricing_model = 'linear_v4'::text THEN get_agent_current_price_v4(a.id)::numeric * COALESCE(a.circulating_supply, 0::bigint)::numeric * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * COALESCE(a.circulating_supply, 0::bigint)::numeric * COALESCE(fx.fx_rate_usd, 0.10)
      END
    ELSE
      CASE
        WHEN a.pricing_model = 'linear_v4'::text THEN get_agent_current_price_v4(a.id)::numeric * 1000000000::numeric * COALESCE(fx.fx_rate_usd, 0.10)
        ELSE a.current_price * 1000000000::numeric * COALESCE(fx.fx_rate_usd, 0.10)
      END
  END AS market_cap_usd,
  a.updated_at
FROM agents a
CROSS JOIN LATERAL (
  SELECT prompt_fx.fx_rate_usd, prompt_fx.asof
  FROM prompt_fx
  ORDER BY prompt_fx.asof DESC
  LIMIT 1
) fx;

-- Drop and recreate agent_prices with security_invoker
DROP VIEW IF EXISTS public.agent_prices;

CREATE VIEW public.agent_prices
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  symbol,
  prompt_raised,
  current_price AS static_price,
  get_current_bonding_curve_price(
    CASE
      WHEN prompt_raised <= 0::numeric THEN 0::numeric
      ELSE prompt_raised * 0.1
    END) AS dynamic_price,
  token_holders,
  market_cap,
  volume_24h,
  is_active,
  test_mode,
  token_graduated
FROM agents a;

-- ============================================
-- Enable RLS on backup tables
-- ============================================

-- Enable RLS on agent_graduation_events_backup
ALTER TABLE public.agent_graduation_events_backup ENABLE ROW LEVEL SECURITY;

-- Enable RLS on agent_token_holders_backup  
ALTER TABLE public.agent_token_holders_backup ENABLE ROW LEVEL SECURITY;

-- Enable RLS on agents_backup
ALTER TABLE public.agents_backup ENABLE ROW LEVEL SECURITY;

-- Enable RLS on deployed_contracts_backup
ALTER TABLE public.deployed_contracts_backup ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies for backup tables (service role only)
-- No public access to backup tables

CREATE POLICY "Backup tables are not accessible to users"
ON public.agent_graduation_events_backup
FOR ALL
TO authenticated, anon
USING (false);

CREATE POLICY "Backup tables are not accessible to users"
ON public.agent_token_holders_backup
FOR ALL
TO authenticated, anon
USING (false);

CREATE POLICY "Backup tables are not accessible to users"
ON public.agents_backup
FOR ALL
TO authenticated, anon
USING (false);

CREATE POLICY "Backup tables are not accessible to users"
ON public.deployed_contracts_backup
FOR ALL
TO authenticated, anon
USING (false);