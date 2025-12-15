-- Refresh the token_metadata_cache materialized view if it exists
-- First check if it's a materialized view and refresh it
DO $$
BEGIN
  -- Try to refresh as materialized view
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'token_metadata_cache'
  ) THEN
    REFRESH MATERIALIZED VIEW token_metadata_cache;
    RAISE NOTICE 'Materialized view refreshed';
  ELSE
    RAISE NOTICE 'token_metadata_cache is not a materialized view';
  END IF;
END $$;