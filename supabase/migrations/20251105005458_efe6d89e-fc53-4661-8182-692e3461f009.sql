-- Day 6: Add indices on token_metadata_cache for faster symbol/address lookups
-- These indices dramatically improve performance for the /resolve-token endpoint

-- Index on symbol column for fast symbol-based lookups
CREATE INDEX IF NOT EXISTS idx_token_metadata_cache_symbol 
  ON public.token_metadata_cache(symbol);

-- Index on token_address column for fast address-based lookups
CREATE INDEX IF NOT EXISTS idx_token_metadata_cache_token_address 
  ON public.token_metadata_cache(token_address);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Day 6 indices created successfully on token_metadata_cache';
END $$;