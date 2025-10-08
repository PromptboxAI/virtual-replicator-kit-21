-- Hot-fix: Aggregate OHLC directly from trades instead of empty agent_ohlcv table

-- Helper: Map timeframe to step minutes
CREATE OR REPLACE FUNCTION tf_step_minutes(tf text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE LOWER(tf)
    WHEN '1m' THEN 1
    WHEN '5m' THEN 5
    WHEN '15m' THEN 15
    WHEN '1h' THEN 60
    WHEN '4h' THEN 240
    WHEN '1d' THEN 1440
    ELSE 5
  END
$$;

-- Aggregate OHLCV on-the-fly from trades (buys + sells)
CREATE OR REPLACE FUNCTION get_ohlc_from_trades(
  p_agent_id uuid,
  p_tf text,
  p_limit int DEFAULT 300
)
RETURNS TABLE (
  bucket_time timestamptz,
  open_prompt  numeric,
  high_prompt  numeric,
  low_prompt   numeric,
  close_prompt numeric,
  volume_agent numeric
)
LANGUAGE sql STABLE AS $$
WITH p AS (SELECT tf_step_minutes(p_tf) AS step),
trades AS (
  -- BUY trades
  SELECT
    created_at AS ts,
    bonding_curve_price AS price,
    token_amount AS amount
  FROM agent_token_buy_trades
  WHERE agent_id = p_agent_id
    AND bonding_curve_price IS NOT NULL
    AND token_amount > 0
  
  UNION ALL
  
  -- SELL trades
  SELECT
    created_at AS ts,
    bonding_curve_price AS price,
    token_amount AS amount
  FROM agent_token_sell_trades
  WHERE agent_id = p_agent_id
    AND bonding_curve_price IS NOT NULL
    AND token_amount > 0
),
buck AS (
  SELECT
    ts, price, amount,
    (date_trunc('minute', ts)
      - make_interval(mins => (extract(minute from ts)::int % (SELECT step FROM p)))
    ) AS bucket_time
  FROM trades
  WHERE price IS NOT NULL AND amount IS NOT NULL AND amount > 0
),
agg AS (
  SELECT
    bucket_time,
    max(price) AS high,
    min(price) AS low,
    sum(amount) AS volume
  FROM buck
  GROUP BY bucket_time
),
op AS (
  SELECT DISTINCT ON (bucket_time) bucket_time, price AS open
  FROM buck
  ORDER BY bucket_time, ts
),
cl AS (
  SELECT DISTINCT ON (bucket_time) bucket_time, price AS close
  FROM buck
  ORDER BY bucket_time, ts DESC
)
SELECT a.bucket_time, o.open, a.high, a.low, c.close, a.volume
FROM agg a
JOIN op o USING (bucket_time)
JOIN cl c USING (bucket_time)
ORDER BY a.bucket_time DESC
LIMIT p_limit;
$$;

-- Replace get_ohlc_with_fx to use trade aggregation
CREATE OR REPLACE FUNCTION public.get_ohlc_with_fx(
  p_agent_id uuid,
  p_timeframe text,
  p_limit integer DEFAULT 300
)
RETURNS TABLE(t text, o text, h text, l text, c text, v text, fx text)
LANGUAGE sql STABLE AS $$
  SELECT
    to_char(ohlc.bucket_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS t,
    ohlc.open_prompt::text  AS o,
    ohlc.high_prompt::text  AS h,
    ohlc.low_prompt::text   AS l,
    ohlc.close_prompt::text AS c,
    ohlc.volume_agent::text AS v,
    COALESCE(fx.fx_rate_usd, 0.10)::text AS fx
  FROM get_ohlc_from_trades(p_agent_id, p_timeframe, p_limit) ohlc
  LEFT JOIN LATERAL (
    SELECT fx_rate_usd
    FROM prompt_fx
    WHERE asof <= ohlc.bucket_time
    ORDER BY asof DESC
    LIMIT 1
  ) fx ON true
  ORDER BY ohlc.bucket_time ASC;
$$;