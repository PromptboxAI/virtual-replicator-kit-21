-- Remove is_active filter from token_metadata_cache materialized view
DROP MATERIALIZED VIEW IF EXISTS public.token_metadata_cache;

CREATE MATERIALIZED VIEW public.token_metadata_cache AS
SELECT 
  a.id,
  a.name,
  a.symbol,
  a.description,
  a.category,
  a.token_address,
  a.creator_id,
  a.creator_wallet_address,
  a.creator_ens_name,
  a.is_active, -- Keep column for client-side filtering
  a.status,
  a.test_mode,
  a.token_graduated,
  a.current_price,
  a.market_cap,
  a.volume_24h,
  a.price_change_24h,
  a.token_holders,
  a.prompt_raised,
  a.bonding_curve_supply,
  a.framework,
  a.deployment_status,
  a.deployment_tx_hash,
  a.deployment_verified,
  a.chain_id,
  a.network_environment,
  a.created_at,
  a.deployed_at,
  a.updated_at,
  a.avatar_url,
  a.twitter_username,
  a.twitter_url,
  a.website_url,
  am.telegram_url,
  am.discord_url,
  am.youtube_url,
  am.whitepaper_url,
  am.screenshots,
  am.demo_videos
FROM public.agents a
LEFT JOIN public.agent_marketing am ON a.id = am.agent_id;
-- Removed: WHERE a.is_active = true

-- Recreate indexes
CREATE UNIQUE INDEX IF NOT EXISTS token_metadata_cache_id_idx ON public.token_metadata_cache(id);
CREATE INDEX IF NOT EXISTS token_metadata_cache_symbol_idx ON public.token_metadata_cache(symbol);
CREATE INDEX IF NOT EXISTS token_metadata_cache_test_mode_idx ON public.token_metadata_cache(test_mode);
CREATE INDEX IF NOT EXISTS token_metadata_cache_created_at_idx ON public.token_metadata_cache(created_at DESC);

-- Refresh the view
REFRESH MATERIALIZED VIEW public.token_metadata_cache;