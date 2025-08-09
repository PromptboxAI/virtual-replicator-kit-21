-- Create the pg_try_advisory_xact_lock wrapper function for edge functions
CREATE OR REPLACE FUNCTION pg_try_advisory_xact_lock(key bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pg_try_advisory_xact_lock(key);
$$;