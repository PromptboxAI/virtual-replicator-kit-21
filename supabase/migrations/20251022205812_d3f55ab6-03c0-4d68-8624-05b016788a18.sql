-- Phase 2.6: Update token_metadata_cache with Phase 1-2 Fields
-- Adds deployment_status, network_environment, deployed_at to materialized view

-- ============================================================================
-- 1. DROP EXISTING VIEW (Will be recreated with new fields)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.token_metadata_cache;

-- ============================================================================
-- 2. RECREATE MATERIALIZED VIEW WITH PHASE 1-2 FIELDS
-- ============================================================================

CREATE MATERIALIZED VIEW public.token_metadata_cache AS
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
  LOWER(a.token_address) as token_address_normalized,
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
  
  -- PHASE 1-2 ADDITIONS
  a.deployment_status,
  a.network_environment,
  a.deployed_at,
  
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
-- 3. RECREATE ALL EXISTING INDEXES
-- ============================================================================

CREATE UNIQUE INDEX idx_token_metadata_cache_id 
ON public.token_metadata_cache(id);

CREATE INDEX idx_token_metadata_cache_address 
ON public.token_metadata_cache(token_address_normalized);

CREATE INDEX idx_token_metadata_cache_address_chain 
ON public.token_metadata_cache(token_address_normalized, chain_id);

CREATE INDEX idx_token_metadata_cache_test_mode 
ON public.token_metadata_cache(test_mode);

CREATE INDEX idx_token_metadata_cache_category 
ON public.token_metadata_cache(category) 
WHERE category IS NOT NULL;

CREATE INDEX idx_token_metadata_cache_graduated 
ON public.token_metadata_cache(token_graduated);

-- ============================================================================
-- 4. ADD NEW INDEXES FOR PHASE 1-2 FIELDS
-- ============================================================================

CREATE INDEX idx_token_metadata_cache_deployment_status
ON public.token_metadata_cache(deployment_status);

CREATE INDEX idx_token_metadata_cache_network_env
ON public.token_metadata_cache(network_environment);

CREATE INDEX idx_token_metadata_cache_deployed_at
ON public.token_metadata_cache(deployed_at DESC NULLS LAST);

CREATE INDEX idx_token_metadata_cache_status_network
ON public.token_metadata_cache(deployment_status, network_environment, chain_id);

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

ALTER MATERIALIZED VIEW public.token_metadata_cache OWNER TO postgres;

GRANT SELECT ON public.token_metadata_cache TO anon;
GRANT SELECT ON public.token_metadata_cache TO authenticated;

-- ============================================================================
-- 6. REFRESH VIEW WITH CURRENT DATA
-- ============================================================================

SELECT public.refresh_token_metadata_cache();