-- Drop and recreate get_ohlc_with_fx with correct column names
DROP FUNCTION IF EXISTS get_ohlc_with_fx(uuid, text, int);

CREATE OR REPLACE FUNCTION get_ohlc_with_fx(
  p_agent_id uuid,
  p_timeframe text,
  p_limit int default 300
)
RETURNS TABLE(
  bucket_time timestamptz,
  open_prompt numeric,
  high_prompt numeric,
  low_prompt numeric,
  close_prompt numeric,
  volume_agent numeric,
  fx_rate numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    o.bucket_time,
    o.open_prompt,
    o.high_prompt,
    o.low_prompt,
    o.close_prompt,
    o.volume_agent,
    COALESCE(a.created_prompt_usd_rate, 0.10) as fx_rate
  FROM agent_ohlcv o
  CROSS JOIN agents a
  WHERE o.agent_id = p_agent_id
    AND o.timeframe = p_timeframe
    AND a.id = p_agent_id
  ORDER BY o.bucket_time DESC
  LIMIT p_limit;
$$;