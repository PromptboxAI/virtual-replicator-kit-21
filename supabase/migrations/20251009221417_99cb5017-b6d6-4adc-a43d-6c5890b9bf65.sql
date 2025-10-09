-- Step 1: Fix TestToken14 and all V4 agents with wrong constants
UPDATE agents 
SET 
  created_p0 = 0.0000075,
  created_p1 = 0.00075,
  updated_at = NOW()
WHERE pricing_model = 'linear_v4'
  AND (created_p0 != 0.0000075 OR created_p1 != 0.00075);

-- Step 2: Force price recalculation for all updated V4 agents
UPDATE agents 
SET prompt_raised = prompt_raised
WHERE pricing_model = 'linear_v4';

-- Step 3: Add CHECK constraint to prevent future incorrect constants
ALTER TABLE agents
ADD CONSTRAINT check_v4_constants 
CHECK (
  pricing_model != 'linear_v4' OR 
  (created_p0 = 0.0000075 AND created_p1 = 0.00075)
);

-- Step 4: Update get_ohlc_with_fx to use latest FX instead of hardcoded 0.10 fallback
DROP FUNCTION IF EXISTS get_ohlc_with_fx(uuid, text, int);

CREATE OR REPLACE FUNCTION get_ohlc_with_fx(
  p_agent_id uuid,
  p_timeframe text,
  p_limit int DEFAULT 300
)
RETURNS TABLE(t text, o text, h text, l text, c text, v text, fx text)
LANGUAGE sql STABLE AS $$
  WITH latest_fx AS (
    SELECT fx_rate_usd 
    FROM prompt_fx 
    ORDER BY asof DESC 
    LIMIT 1
  )
  SELECT
    to_char(ohlc.bucket_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS t,
    ohlc.open_prompt::text  AS o,
    ohlc.high_prompt::text  AS h,
    ohlc.low_prompt::text   AS l,
    ohlc.close_prompt::text AS c,
    ohlc.volume_agent::text AS v,
    -- Use per-bucket FX, fallback to latest instead of hardcoded 0.10
    COALESCE(fx.fx_rate_usd, (SELECT fx_rate_usd FROM latest_fx))::text AS fx
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

-- Step 5: Update get_ohlc_from_trades to compute price from amounts as fallback
DROP FUNCTION IF EXISTS get_ohlc_from_trades(uuid, text, int);

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
  -- BUY trades with computed price fallback
  SELECT
    created_at AS ts,
    -- Prefer bonding_curve_price, fallback to computed from amounts
    COALESCE(
      NULLIF(bonding_curve_price, 0),
      NULLIF(prompt_amount, 0) / NULLIF(token_amount / 1e9, 0)
    )::numeric AS price,
    token_amount AS amount
  FROM agent_token_buy_trades
  WHERE agent_id = p_agent_id
    AND token_amount > 0
  
  UNION ALL
  
  -- SELL trades with computed price fallback
  SELECT
    created_at AS ts,
    COALESCE(
      NULLIF(bonding_curve_price, 0),
      NULLIF(prompt_amount, 0) / NULLIF(token_amount / 1e9, 0)
    )::numeric AS price,
    token_amount AS amount
  FROM agent_token_sell_trades
  WHERE agent_id = p_agent_id
    AND token_amount > 0
),
buck AS (
  SELECT
    ts, price, amount,
    (date_trunc('minute', ts)
      - make_interval(mins => (extract(minute from ts)::int % (SELECT step FROM p)))
    ) AS bucket_time
  FROM trades
  WHERE price IS NOT NULL AND price > 0 AND amount IS NOT NULL AND amount > 0
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