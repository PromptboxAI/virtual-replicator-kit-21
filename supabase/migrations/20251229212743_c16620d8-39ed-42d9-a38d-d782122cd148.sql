-- Drop and recreate token_metadata_cache materialized view to include token_contract_address
DROP MATERIALIZED VIEW IF EXISTS token_metadata_cache;

CREATE MATERIALIZED VIEW token_metadata_cache AS
SELECT 
    a.id,
    a.name,
    a.symbol,
    a.description,
    a.category,
    a.token_address,
    a.token_contract_address,
    a.creator_id,
    a.creator_wallet_address,
    a.creator_ens_name,
    a.is_active,
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
FROM agents a
LEFT JOIN agent_marketing am ON a.id = am.agent_id;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_token_metadata_cache_id ON token_metadata_cache (id);
CREATE INDEX IF NOT EXISTS idx_token_metadata_cache_creator_id ON token_metadata_cache (creator_id);
CREATE INDEX IF NOT EXISTS idx_token_metadata_cache_is_active ON token_metadata_cache (is_active);