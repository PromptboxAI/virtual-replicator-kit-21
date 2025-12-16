-- Create seconds-based step function for all interval granularities
CREATE OR REPLACE FUNCTION public.tf_step_seconds(tf text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE LOWER(tf)
    -- Seconds
    WHEN '1s' THEN 1
    WHEN '5s' THEN 5
    WHEN '15s' THEN 15
    WHEN '30s' THEN 30
    -- Minutes (converted to seconds)
    WHEN '1m' THEN 60
    WHEN '3m' THEN 180
    WHEN '5m' THEN 300
    WHEN '15m' THEN 900
    WHEN '30m' THEN 1800
    -- Hours (converted to seconds)
    WHEN '1h' THEN 3600
    WHEN '2h' THEN 7200
    WHEN '4h' THEN 14400
    WHEN '6h' THEN 21600
    WHEN '12h' THEN 43200
    -- Days/Weeks/Months (converted to seconds)
    WHEN '1d' THEN 86400
    WHEN '3d' THEN 259200
    WHEN '1w' THEN 604800
    WHEN '1M' THEN 2592000  -- 30 days approximation
    ELSE 300  -- default 5m
  END
$$;

-- Drop existing function to allow parameter rename
DROP FUNCTION IF EXISTS public.get_ohlc_from_trades(uuid, text, integer);

-- Recreate get_ohlc_from_trades with seconds-based bucketing
CREATE FUNCTION public.get_ohlc_from_trades(
  p_agent_id uuid,
  p_timeframe text DEFAULT '5m',
  p_limit integer DEFAULT 300
)
RETURNS TABLE (
  bucket_time timestamptz,
  open_prompt numeric,
  high_prompt numeric,
  low_prompt numeric,
  close_prompt numeric,
  volume_agent numeric
)
LANGUAGE sql
STABLE
AS $$
  WITH step AS (
    SELECT tf_step_seconds(p_timeframe) AS secs
  ),
  all_trades AS (
    SELECT 
      created_at AS ts,
      bonding_curve_price AS price,
      token_amount AS vol
    FROM agent_token_buy_trades
    WHERE agent_id = p_agent_id
    UNION ALL
    SELECT 
      created_at AS ts,
      bonding_curve_price AS price,
      token_amount AS vol
    FROM agent_token_sell_trades
    WHERE agent_id = p_agent_id
  ),
  bucketed AS (
    SELECT
      to_timestamp(floor(extract(epoch from ts) / step.secs) * step.secs) AT TIME ZONE 'UTC' AS bucket_time,
      price,
      vol,
      ts
    FROM all_trades, step
  ),
  agg AS (
    SELECT
      bucket_time,
      (array_agg(price ORDER BY ts ASC))[1] AS open_prompt,
      MAX(price) AS high_prompt,
      MIN(price) AS low_prompt,
      (array_agg(price ORDER BY ts DESC))[1] AS close_prompt,
      SUM(vol) AS volume_agent
    FROM bucketed
    GROUP BY bucket_time
    ORDER BY bucket_time DESC
    LIMIT p_limit
  )
  SELECT * FROM agg ORDER BY bucket_time ASC;
$$;