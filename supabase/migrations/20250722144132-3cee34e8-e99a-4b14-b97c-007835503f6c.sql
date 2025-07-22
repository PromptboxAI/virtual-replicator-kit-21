-- Fix the get_agent_ohlcv_data function to resolve column ambiguity
DROP FUNCTION IF EXISTS public.get_agent_ohlcv_data(uuid, text, timestamp with time zone, timestamp with time zone);

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
BEGIN
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

  RETURN QUERY
  WITH all_trades AS (
    SELECT 
      bt.created_at,
      bt.bonding_curve_price as price,
      bt.token_amount as trade_volume,
      'buy' as trade_type
    FROM agent_token_buy_trades bt
    WHERE bt.agent_id = p_agent_id 
      AND bt.created_at >= p_start_time 
      AND bt.created_at <= p_end_time
    
    UNION ALL
    
    SELECT 
      st.created_at,
      st.bonding_curve_price as price,
      st.token_amount as trade_volume,
      'sell' as trade_type
    FROM agent_token_sell_trades st
    WHERE st.agent_id = p_agent_id 
      AND st.created_at >= p_start_time 
      AND st.created_at <= p_end_time
  ),
  bucketed_trades AS (
    SELECT 
      date_trunc('epoch', at.created_at) + INTERVAL '1 second' * (EXTRACT(epoch FROM at.created_at)::int / interval_seconds * interval_seconds) as bucket,
      at.price,
      at.trade_volume,
      at.created_at,
      ROW_NUMBER() OVER (PARTITION BY date_trunc('epoch', at.created_at) + INTERVAL '1 second' * (EXTRACT(epoch FROM at.created_at)::int / interval_seconds * interval_seconds) ORDER BY at.created_at ASC) as first_trade,
      ROW_NUMBER() OVER (PARTITION BY date_trunc('epoch', at.created_at) + INTERVAL '1 second' * (EXTRACT(epoch FROM at.created_at)::int / interval_seconds * interval_seconds) ORDER BY at.created_at DESC) as last_trade
    FROM all_trades at
  )
  SELECT 
    bt.bucket as time_bucket,
    FIRST_VALUE(bt.price) OVER (PARTITION BY bt.bucket ORDER BY bt.created_at ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as open_price,
    MAX(bt.price) as high_price,
    MIN(bt.price) as low_price,
    FIRST_VALUE(bt.price) OVER (PARTITION BY bt.bucket ORDER BY bt.created_at DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as close_price,
    SUM(bt.trade_volume) as volume,
    COUNT(*)::INTEGER as trade_count
  FROM bucketed_trades bt
  GROUP BY bt.bucket
  ORDER BY bt.bucket ASC;
END;
$function$;