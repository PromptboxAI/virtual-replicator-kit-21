-- Phase 2: Market Data Cache Tables

-- ============================================
-- 2.1: agent_prices_latest materialized view
-- ============================================

CREATE MATERIALIZED VIEW public.agent_prices_latest AS
SELECT 
  a.id as agent_id,
  a.symbol,
  a.name,
  a.current_price as price_prompt,
  a.current_price * COALESCE(fx.fx_rate_usd, 0.10) as price_usd,
  a.market_cap as mc_prompt,
  a.market_cap * COALESCE(fx.fx_rate_usd, 0.10) as mc_usd,
  a.volume_24h,
  a.price_change_24h as change_24h_pct,
  a.token_holders as holders,
  a.prompt_raised,
  a.token_graduated as is_graduated,
  a.avatar_url,
  a.category,
  a.updated_at
FROM public.agents a
LEFT JOIN LATERAL (
  SELECT fx_rate_usd 
  FROM public.prompt_fx 
  ORDER BY asof DESC 
  LIMIT 1
) fx ON true
WHERE a.is_active = true;

-- Indexes for fast lookups
CREATE UNIQUE INDEX idx_agent_prices_latest_id ON public.agent_prices_latest(agent_id);
CREATE INDEX idx_agent_prices_latest_volume ON public.agent_prices_latest(volume_24h DESC NULLS LAST);
CREATE INDEX idx_agent_prices_latest_mc ON public.agent_prices_latest(mc_usd DESC NULLS LAST);
CREATE INDEX idx_agent_prices_latest_change ON public.agent_prices_latest(change_24h_pct DESC NULLS LAST);
CREATE INDEX idx_agent_prices_latest_updated ON public.agent_prices_latest(updated_at DESC);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION public.refresh_agent_prices_latest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.agent_prices_latest;
END;
$$;

-- ============================================
-- 2.2: leaderboards_cache table
-- ============================================

-- Create enums for leaderboard metrics and timeframes
CREATE TYPE public.leaderboard_metric AS ENUM ('volume', 'liquidity', 'holders', 'growth', 'graduation');
CREATE TYPE public.leaderboard_timeframe AS ENUM ('24h', '7d', '30d', 'all');

-- Create leaderboards cache table
CREATE TABLE public.leaderboards_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric leaderboard_metric NOT NULL,
  timeframe leaderboard_timeframe NOT NULL,
  rankings jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(metric, timeframe)
);

-- Index for fast lookups
CREATE INDEX idx_leaderboards_metric_time ON public.leaderboards_cache(metric, timeframe);

-- Enable RLS with public read access
ALTER TABLE public.leaderboards_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboards are viewable by everyone"
  ON public.leaderboards_cache FOR SELECT
  USING (true);

-- Only system can modify leaderboards (INSERT/UPDATE/DELETE blocked for users)
CREATE POLICY "Only system can modify leaderboards"
  ON public.leaderboards_cache FOR ALL
  USING (false);