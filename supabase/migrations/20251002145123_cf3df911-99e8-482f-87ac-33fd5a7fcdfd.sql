-- Add supply tracking to trades for accurate V4 price recalculation
-- This allows us to recalculate V4 prices retroactively

-- Add tokens_sold_before column to buy trades
ALTER TABLE agent_token_buy_trades 
ADD COLUMN IF NOT EXISTS tokens_sold_before NUMERIC DEFAULT 0;

-- Add tokens_sold_before column to sell trades  
ALTER TABLE agent_token_sell_trades
ADD COLUMN IF NOT EXISTS tokens_sold_before NUMERIC DEFAULT 0;

-- Update get_agent_ohlcv_data to recalculate V4 prices from supply history
CREATE OR REPLACE FUNCTION public.get_agent_ohlcv_data(
  p_agent_id uuid,
  p_interval text DEFAULT '1m'::text,
  p_start_time timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_end_time timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS TABLE(
  time_bucket timestamp with time zone,
  open_price numeric,
  high_price numeric,
  low_price numeric,
  close_price numeric,
  volume numeric,
  trade_count integer
)
LANGUAGE plpgsql
AS $function$
DECLARE
  interval_seconds INTEGER;
  agent_pricing_model TEXT;
  agent_p0 NUMERIC;
  agent_p1 NUMERIC;
  curve_supply CONSTANT NUMERIC := 800000000;
BEGIN
  -- Get agent's pricing model and V4 parameters
  SELECT pricing_model, created_p0, created_p1
  INTO agent_pricing_model, agent_p0, agent_p1
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

  -- Return query with V4 price recalculation for linear_v4 agents
  IF agent_pricing_model = 'linear_v4' THEN
    RETURN QUERY
    WITH all_trades AS (
      SELECT 
        bt.created_at,
        -- Recalculate V4 price from supply at trade time
        CASE 
          WHEN bt.tokens_sold_before IS NOT NULL THEN
            agent_p0 + ((agent_p1 - agent_p0) / curve_supply) * bt.tokens_sold_before
          ELSE
            bt.bonding_curve_price
        END as price,
        bt.token_amount as trade_volume
      FROM agent_token_buy_trades bt
      WHERE bt.agent_id = p_agent_id 
        AND bt.created_at >= p_start_time 
        AND bt.created_at <= p_end_time
      
      UNION ALL
      
      SELECT 
        st.created_at,
        -- Recalculate V4 price from supply at trade time
        CASE 
          WHEN st.tokens_sold_before IS NOT NULL THEN
            agent_p0 + ((agent_p1 - agent_p0) / curve_supply) * st.tokens_sold_before
          ELSE
            st.bonding_curve_price
        END as price,
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
    -- Use legacy AMM pricing for V3 and older agents (unchanged)
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
$function$;