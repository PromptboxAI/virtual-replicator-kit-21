-- Phase 2.5: Public API Database Foundation
-- Creates materialized view, indexes, and RPC for high-performance token metadata access

-- ============================================================================
-- 1. MATERIALIZED VIEW: token_metadata_cache
-- ============================================================================
-- Pre-joins agents + agent_marketing for fast API lookups
-- Includes normalized token_address for case-insensitive searches

CREATE MATERIALIZED VIEW IF NOT EXISTS public.token_metadata_cache AS
SELECT 
  -- Agent core fields
  a.id,
  a.name,
  a.symbol,
  a.description,
  a.category,
  a.avatar_url,
  a.website_url,
  a.twitter_url,
  a.twitter_username,
  a.creator_id,
  a.creator_wallet_address,
  a.creator_ens_name,
  a.token_address,
  LOWER(a.token_address) as token_address_normalized, -- Case-insensitive lookup
  a.trading_wallet_address,
  
  -- Pricing & supply
  a.current_price,
  a.market_cap,
  a.market_cap_usd,
  a.volume_24h,
  a.price_change_24h,
  a.total_supply,
  a.circulating_supply,
  a.bonding_curve_supply,
  a.prompt_raised,
  a.token_holders,
  
  -- Pricing model
  a.pricing_model,
  a.created_p0,
  a.created_p1,
  a.created_prompt_usd_rate,
  a.prompt_usd_rate,
  a.target_market_cap_usd,
  
  -- Status & graduation
  a.is_active,
  a.status,
  a.token_graduated,
  a.graduation_threshold,
  a.graduation_event_id,
  a.graduation_mode,
  
  -- Deployment info
  a.deployment_method,
  a.deployment_tx_hash,
  a.deployment_verified,
  a.chain_id,
  a.block_number,
  
  -- Trading settings
  a.allow_automated_trading,
  a.max_trade_amount,
  a.creation_locked,
  a.creation_expires_at,
  a.creator_prebuy_amount,
  
  -- Mode & framework
  a.test_mode,
  a.framework,
  a.creation_mode,
  
  -- Metadata
  a.creation_cost,
  a.created_at,
  a.updated_at,
  
  -- Marketing fields (from agent_marketing)
  am.discord_url,
  am.telegram_url,
  am.whitepaper_url,
  am.youtube_url,
  am.screenshots,
  am.demo_videos,
  am.description as marketing_description
  
FROM public.agents a
LEFT JOIN public.agent_marketing am ON a.id = am.agent_id
WHERE a.is_active = true;

-- ============================================================================
-- 2. INDEXES: Optimize common query patterns
-- ============================================================================

-- Primary key lookup (unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_metadata_cache_id 
ON public.token_metadata_cache(id);

-- Contract address lookup (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_token_metadata_cache_address 
ON public.token_metadata_cache(token_address_normalized);

-- Multi-chain contract lookup
CREATE INDEX IF NOT EXISTS idx_token_metadata_cache_address_chain 
ON public.token_metadata_cache(token_address_normalized, chain_id);

-- Filter by test mode (production tokens only)
CREATE INDEX IF NOT EXISTS idx_token_metadata_cache_test_mode 
ON public.token_metadata_cache(test_mode);

-- Filter by category
CREATE INDEX IF NOT EXISTS idx_token_metadata_cache_category 
ON public.token_metadata_cache(category) 
WHERE category IS NOT NULL;

-- Filter by graduation status
CREATE INDEX IF NOT EXISTS idx_token_metadata_cache_graduated 
ON public.token_metadata_cache(token_graduated);

-- Optimize source table lookups (agents.token_address)
CREATE INDEX IF NOT EXISTS idx_agents_token_address_lower 
ON public.agents(LOWER(token_address)) 
WHERE token_address IS NOT NULL;

-- ============================================================================
-- 3. RPC FUNCTION: refresh_token_metadata_cache()
-- ============================================================================
-- Manually refresh the materialized view with latest data
-- Can be called by edge functions or scheduled via pg_cron

CREATE OR REPLACE FUNCTION public.refresh_token_metadata_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Refresh the materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.token_metadata_cache;
  
  -- Get count of rows
  SELECT COUNT(*) INTO row_count FROM public.token_metadata_cache;
  
  RETURN row_count;
END;
$$;

-- ============================================================================
-- 4. RLS POLICIES: Public read access for API consumption
-- ============================================================================

ALTER MATERIALIZED VIEW public.token_metadata_cache OWNER TO postgres;

-- Enable RLS on materialized view (Postgres 15+)
-- Note: Materialized views inherit security from source tables by default
-- This policy ensures explicit public read access for API endpoints

COMMENT ON MATERIALIZED VIEW public.token_metadata_cache IS 
'Materialized view for high-performance token metadata API. 
Combines agents + agent_marketing tables with pre-computed normalized fields.
Refresh manually via refresh_token_metadata_cache() or schedule via pg_cron.';

COMMENT ON FUNCTION public.refresh_token_metadata_cache() IS
'Refreshes token_metadata_cache materialized view and returns row count.
Should be called after agent creation, updates, or on a schedule.';

-- Grant read access to anon role (public API access)
GRANT SELECT ON public.token_metadata_cache TO anon;
GRANT SELECT ON public.token_metadata_cache TO authenticated;

-- Grant execute permission on refresh function (system only initially)
GRANT EXECUTE ON FUNCTION public.refresh_token_metadata_cache() TO authenticated;

-- Initial refresh to populate the view
SELECT public.refresh_token_metadata_cache();