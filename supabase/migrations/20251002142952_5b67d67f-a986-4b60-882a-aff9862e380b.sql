-- =====================================================
-- Phase 1 & 2: Fix V4 Pricing Functions
-- =====================================================

-- Create V4 pricing function that reads agent-specific parameters
CREATE OR REPLACE FUNCTION get_agent_current_price_v4(p_agent_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_tokens_sold NUMERIC;
  v_p0 NUMERIC;
  v_p1 NUMERIC;
  v_curve_supply NUMERIC := 800000000; -- 800M tokens
  v_slope NUMERIC;
  v_current_price NUMERIC;
BEGIN
  -- Get agent's V4 pricing parameters from the agents table
  SELECT
    COALESCE(bonding_curve_supply, 0),
    COALESCE(created_p0, 0.00004),  -- Use agent-specific P0
    COALESCE(created_p1, 0.0001)    -- Use agent-specific P1
  INTO v_tokens_sold, v_p0, v_p1
  FROM agents
  WHERE id = p_agent_id;

  -- If agent not found, return 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate slope for linear bonding curve
  v_slope := (v_p1 - v_p0) / v_curve_supply;

  -- Linear pricing formula: P(S) = P0 + slope * S
  v_current_price := v_p0 + (v_slope * v_tokens_sold);

  RETURN v_current_price;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update get_agent_ohlcv_data to use correct pricing based on agent's pricing_model
CREATE OR REPLACE FUNCTION get_agent_ohlcv_data(
  p_agent_id uuid,
  p_interval text DEFAULT '1m',
  p_start_time timestamp with time zone DEFAULT NULL,
  p_end_time timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  time_bucket timestamp with time zone,
  open_price numeric,
  high_price numeric,
  low_price numeric,
  close_price numeric,
  volume numeric,
  trade_count integer
) AS $$
DECLARE
  interval_seconds INTEGER;
  agent_pricing_model TEXT;
BEGIN
  -- Get agent's pricing model
  SELECT pricing_model INTO agent_pricing_model
  FROM agents
  WHERE id = p_agent_id;

  -- Convert interval to seconds
  interval_seconds := CASE p_interval
    WHEN '1m' THEN 60
    WHEN '5m' THEN 300
    WHEN '15m' THEN 900
    WHEN '1h' THEN 3600
    WHEN '4h' THEN 14400
    WHEN '1d' THEN 86400
    ELSE 60
  END;

  -- Set default times if not provided
  IF p_start_time IS NULL THEN
    p_start_time := NOW() - INTERVAL '7 days';
  END IF;
  
  IF p_end_time IS NULL THEN
    p_end_time := NOW();
  END IF;

  -- Return query based on pricing model
  IF agent_pricing_model = 'linear_v4' THEN
    -- Use V4 pricing from bonding_curve_price stored in trades
    RETURN QUERY
    WITH all_trades AS (
      SELECT 
        bt.created_at,
        bt.bonding_curve_price as price,
        bt.token_amount as trade_volume
      FROM agent_token_buy_trades bt
      WHERE bt.agent_id = p_agent_id 
        AND bt.created_at >= p_start_time 
        AND bt.created_at <= p_end_time
      
      UNION ALL
      
      SELECT 
        st.created_at,
        st.bonding_curve_price as price,
        st.token_amount as trade_volume
      FROM agent_token_sell_trades st
      WHERE st.agent_id = p_agent_id 
        AND st.created_at >= p_start_time 
        AND st.created_at <= p_end_time
    ),
    bucketed_trades AS (
      SELECT 
        to_timestamp(floor(extract(epoch from at.created_at) / interval_seconds) * interval_seconds) as bucket,
        at.price,
        at.trade_volume,
        at.created_at
      FROM all_trades at
    ),
    aggregated_data AS (
      SELECT 
        bt.bucket,
        MIN(bt.created_at) as first_time,
        MAX(bt.created_at) as last_time,
        MIN(bt.price) as low_price,
        MAX(bt.price) as high_price,
        SUM(bt.trade_volume) as total_volume,
        COUNT(*) as trade_count
      FROM bucketed_trades bt
      GROUP BY bt.bucket
    )
    SELECT 
      ad.bucket as time_bucket,
      (SELECT bt1.price FROM bucketed_trades bt1 WHERE bt1.bucket = ad.bucket AND bt1.created_at = ad.first_time LIMIT 1) as open_price,
      ad.high_price,
      ad.low_price,
      (SELECT bt2.price FROM bucketed_trades bt2 WHERE bt2.bucket = ad.bucket AND bt2.created_at = ad.last_time LIMIT 1) as close_price,
      ad.total_volume as volume,
      ad.trade_count::INTEGER as trade_count
    FROM aggregated_data ad
    ORDER BY ad.bucket ASC;
  ELSE
    -- Use legacy AMM pricing for V3 and older agents
    RETURN QUERY
    WITH all_trades AS (
      SELECT 
        bt.created_at,
        bt.bonding_curve_price as price,
        bt.token_amount as trade_volume
      FROM agent_token_buy_trades bt
      WHERE bt.agent_id = p_agent_id 
        AND bt.created_at >= p_start_time 
        AND bt.created_at <= p_end_time
      
      UNION ALL
      
      SELECT 
        st.created_at,
        st.bonding_curve_price as price,
        st.token_amount as trade_volume
      FROM agent_token_sell_trades st
      WHERE st.agent_id = p_agent_id 
        AND st.created_at >= p_start_time 
        AND st.created_at <= p_end_time
    ),
    bucketed_trades AS (
      SELECT 
        to_timestamp(floor(extract(epoch from at.created_at) / interval_seconds) * interval_seconds) as bucket,
        at.price,
        at.trade_volume,
        at.created_at
      FROM all_trades at
    ),
    aggregated_data AS (
      SELECT 
        bt.bucket,
        MIN(bt.created_at) as first_time,
        MAX(bt.created_at) as last_time,
        MIN(bt.price) as low_price,
        MAX(bt.price) as high_price,
        SUM(bt.trade_volume) as total_volume,
        COUNT(*) as trade_count
      FROM bucketed_trades bt
      GROUP BY bt.bucket
    )
    SELECT 
      ad.bucket as time_bucket,
      (SELECT bt1.price FROM bucketed_trades bt1 WHERE bt1.bucket = ad.bucket AND bt1.created_at = ad.first_time LIMIT 1) as open_price,
      ad.high_price,
      ad.low_price,
      (SELECT bt2.price FROM bucketed_trades bt2 WHERE bt2.bucket = ad.bucket AND bt2.created_at = ad.last_time LIMIT 1) as close_price,
      ad.total_volume as volume,
      ad.trade_count::INTEGER as trade_count
    FROM aggregated_data ad
    ORDER BY ad.bucket ASC;
  END IF;
END;
$$ LANGUAGE plpgsql;