-- Create a trigger function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_token_cache_on_agent_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refresh the materialized view concurrently (non-blocking)
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.token_metadata_cache;
  RETURN NULL;
END;
$$;

-- Create trigger on agents table for INSERT, UPDATE, DELETE
DROP TRIGGER IF EXISTS trigger_refresh_token_cache ON public.agents;

CREATE TRIGGER trigger_refresh_token_cache
AFTER INSERT OR UPDATE OR DELETE ON public.agents
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_token_cache_on_agent_change();