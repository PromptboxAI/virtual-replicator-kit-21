-- Drop the existing non-unique index on id
DROP INDEX IF EXISTS idx_token_metadata_cache_id;

-- Create a UNIQUE index on id - required for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_token_metadata_cache_id_unique ON public.token_metadata_cache (id);

-- Also update the refresh function to handle the case where concurrent refresh fails
-- by falling back to non-concurrent refresh
CREATE OR REPLACE FUNCTION public.refresh_token_metadata_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Try concurrent refresh first (doesn't block reads)
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.token_metadata_cache;
  EXCEPTION WHEN OTHERS THEN
    -- Fall back to non-concurrent refresh if concurrent fails
    REFRESH MATERIALIZED VIEW public.token_metadata_cache;
  END;
  
  -- Get count of rows
  SELECT COUNT(*) INTO row_count FROM public.token_metadata_cache;
  
  RETURN row_count;
END;
$$;