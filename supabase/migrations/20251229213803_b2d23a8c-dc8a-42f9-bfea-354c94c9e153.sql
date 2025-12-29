-- Refresh the token_metadata_cache to exclude FAILED agents
REFRESH MATERIALIZED VIEW token_metadata_cache;