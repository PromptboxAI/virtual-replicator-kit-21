
-- Fix the ambiguous volume column reference in get_agent_ohlcv_data function
CREATE OR REPLACE FUNCTION get_agent_ohlcv_data(
  p_agent_id UUID,
  p_interval TEXT DEFAULT '1m',
  p_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  time_bucket TIMESTAMP WITH TIME ZONE,
  open_price NUMERIC,
  high_price NUMERIC,
  low_price NUMERIC,
  close_price NUMERIC,
  volume NUMERIC,
  trade_count INTEGER
) AS $$
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
    ELSE 300 -- Default to 5m
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
      created_at,
      bonding_curve_price as price,
      token_amount as trade_volume,
      'buy' as trade_type
    FROM agent_token_buy_trades 
    WHERE agent_id = p_agent_id 
      AND created_at >= p_start_time 
      AND created_at <= p_end_time
    
    UNION ALL
    
    SELECT 
      created_at,
      bonding_curve_price as price,
      token_amount as trade_volume,
      'sell' as trade_type
    FROM agent_token_sell_trades 
    WHERE agent_id = p_agent_id 
      AND created_at >= p_start_time 
      AND created_at <= p_end_time
  ),
  bucketed_trades AS (
    SELECT 
      date_trunc('epoch', created_at) + INTERVAL '1 second' * (EXTRACT(epoch FROM created_at)::int / interval_seconds * interval_seconds) as bucket,
      price,
      trade_volume,
      created_at,
      ROW_NUMBER() OVER (PARTITION BY date_trunc('epoch', created_at) + INTERVAL '1 second' * (EXTRACT(epoch FROM created_at)::int / interval_seconds * interval_seconds) ORDER BY created_at ASC) as rn_asc,
      ROW_NUMBER() OVER (PARTITION BY date_trunc('epoch', created_at) + INTERVAL '1 second' * (EXTRACT(epoch FROM created_at)::int / interval_seconds * interval_seconds) ORDER BY created_at DESC) as rn_desc
    FROM all_trades
  ),
  aggregated_data AS (
    SELECT 
      bucket,
      MIN(CASE WHEN rn_asc = 1 THEN price END) as open_price,
      MAX(price) as high_price,
      MIN(price) as low_price,
      MIN(CASE WHEN rn_desc = 1 THEN price END) as close_price,
      SUM(trade_volume) as total_volume,
      COUNT(*) as trade_count
    FROM bucketed_trades
    GROUP BY bucket
  )
  SELECT 
    ad.bucket as time_bucket,
    COALESCE(ad.open_price, ad.close_price, 0) as open_price,
    COALESCE(ad.high_price, 0) as high_price,
    COALESCE(ad.low_price, 0) as low_price,
    COALESCE(ad.close_price, ad.open_price, 0) as close_price,
    COALESCE(ad.total_volume, 0) as volume,
    ad.trade_count::INTEGER as trade_count
  FROM aggregated_data ad
  WHERE ad.open_price IS NOT NULL OR ad.close_price IS NOT NULL
  ORDER BY ad.bucket ASC;
END;
$$ LANGUAGE plpgsql;

-- Add function to generate placeholder token addresses for pre-graduated agents
CREATE OR REPLACE FUNCTION generate_agent_token_address(p_agent_id UUID)
RETURNS TEXT AS $$
DECLARE
  agent_name TEXT;
  agent_symbol TEXT;
  token_address TEXT;
BEGIN
  -- Get agent details
  SELECT name, symbol INTO agent_name, agent_symbol
  FROM agents 
  WHERE id = p_agent_id;
  
  -- Generate a deterministic placeholder address based on agent ID
  -- This simulates what virtuals.io does with pre-graduation tokens
  token_address := '0x' || UPPER(SUBSTRING(MD5(p_agent_id::text || agent_name || agent_symbol) FROM 1 FOR 40));
  
  -- Update the agent with the placeholder token address
  UPDATE agents 
  SET token_address = token_address
  WHERE id = p_agent_id AND token_address IS NULL;
  
  RETURN token_address;
END;
$$ LANGUAGE plpgsql;

-- Update existing agents without token addresses
UPDATE agents 
SET token_address = generate_agent_token_address(id)
WHERE token_address IS NULL;
