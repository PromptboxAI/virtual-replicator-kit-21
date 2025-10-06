-- Phase 1: OHLCV Infrastructure (PROMPT-only candles)

-- Create agent_ohlcv table for storing PROMPT-based candlestick data
CREATE TABLE IF NOT EXISTS agent_ohlcv (
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('1m','5m','15m','1h','4h','1d')),
  bucket_time TIMESTAMPTZ NOT NULL,
  open_prompt NUMERIC NOT NULL,
  high_prompt NUMERIC NOT NULL,
  low_prompt NUMERIC NOT NULL,
  close_prompt NUMERIC NOT NULL,
  volume_agent NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (agent_id, timeframe, bucket_time)
);

CREATE INDEX IF NOT EXISTS idx_ohlcv_agent_tf_time
  ON agent_ohlcv (agent_id, timeframe, bucket_time DESC);

ALTER TABLE agent_ohlcv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candles readable by all" 
  ON agent_ohlcv 
  FOR SELECT 
  USING (true);

-- RPC: Get 24h change (PROMPT-based, returns percentage)
CREATE OR REPLACE FUNCTION get_24h_change(p_agent_id UUID, p_timeframe TEXT DEFAULT '1h')
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_price NUMERIC;
  v_price_24h_ago NUMERIC;
  v_change_percent NUMERIC;
BEGIN
  -- Get current price from latest candle
  SELECT close_prompt INTO v_current_price
  FROM agent_ohlcv
  WHERE agent_id = p_agent_id
    AND timeframe = p_timeframe
  ORDER BY bucket_time DESC
  LIMIT 1;

  -- Get price from 24 hours ago
  SELECT close_prompt INTO v_price_24h_ago
  FROM agent_ohlcv
  WHERE agent_id = p_agent_id
    AND timeframe = p_timeframe
    AND bucket_time <= NOW() - INTERVAL '24 hours'
  ORDER BY bucket_time DESC
  LIMIT 1;

  -- Calculate percentage change
  IF v_current_price IS NULL OR v_price_24h_ago IS NULL OR v_price_24h_ago = 0 THEN
    RETURN 0;
  END IF;

  v_change_percent := ((v_current_price - v_price_24h_ago) / v_price_24h_ago) * 100;
  RETURN ROUND(v_change_percent, 2);
END;
$$;

-- RPC: Get OHLC with FX (per-bucket FX via as-of lateral join)
CREATE OR REPLACE FUNCTION get_ohlc_with_fx(
  p_agent_id UUID,
  p_timeframe TEXT DEFAULT '1h',
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  bucket_time TIMESTAMPTZ,
  open_prompt NUMERIC,
  high_prompt NUMERIC,
  low_prompt NUMERIC,
  close_prompt NUMERIC,
  volume_agent NUMERIC,
  fx_rate NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.bucket_time,
    o.open_prompt,
    o.high_prompt,
    o.low_prompt,
    o.close_prompt,
    o.volume_agent,
    -- Use agent's created FX rate as fallback (or default 0.10)
    COALESCE(
      (SELECT created_prompt_usd_rate FROM agents WHERE id = p_agent_id),
      0.10
    ) AS fx_rate
  FROM agent_ohlcv o
  WHERE o.agent_id = p_agent_id
    AND o.timeframe = p_timeframe
  ORDER BY o.bucket_time DESC
  LIMIT p_limit;
END;
$$;