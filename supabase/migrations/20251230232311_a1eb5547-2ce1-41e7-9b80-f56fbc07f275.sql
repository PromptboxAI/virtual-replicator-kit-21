-- Rate limits table for persistent rate limiting across instances
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, endpoint)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- Enable RLS but allow service role full access
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy for service role only (edge functions use service role)
CREATE POLICY "Service role full access" ON public.rate_limits
  FOR ALL USING (true) WITH CHECK (true);

-- RPC function to check and update rate limit atomically
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
  v_window_end TIMESTAMPTZ;
BEGIN
  -- Try to get existing record
  SELECT request_count, window_start INTO v_count, v_window_start
  FROM rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint
  FOR UPDATE;

  IF NOT FOUND THEN
    -- First request - create new record
    INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, v_now);
    
    RETURN json_build_object(
      'allowed', true,
      'remaining', p_max_requests - 1,
      'resetAt', extract(epoch from (v_now + (p_window_seconds || ' seconds')::interval)) * 1000
    );
  END IF;

  v_window_end := v_window_start + (p_window_seconds || ' seconds')::interval;

  IF v_now > v_window_end THEN
    -- Window expired - reset counter
    UPDATE rate_limits
    SET request_count = 1, window_start = v_now, updated_at = v_now
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
    
    RETURN json_build_object(
      'allowed', true,
      'remaining', p_max_requests - 1,
      'resetAt', extract(epoch from (v_now + (p_window_seconds || ' seconds')::interval)) * 1000
    );
  END IF;

  IF v_count >= p_max_requests THEN
    -- Rate limit exceeded
    RETURN json_build_object(
      'allowed', false,
      'remaining', 0,
      'resetAt', extract(epoch from v_window_end) * 1000
    );
  END IF;

  -- Increment counter
  UPDATE rate_limits
  SET request_count = request_count + 1, updated_at = v_now
  WHERE identifier = p_identifier AND endpoint = p_endpoint;

  RETURN json_build_object(
    'allowed', true,
    'remaining', p_max_requests - v_count - 1,
    'resetAt', extract(epoch from v_window_end) * 1000
  );
END;
$$;

-- Cleanup function for old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;