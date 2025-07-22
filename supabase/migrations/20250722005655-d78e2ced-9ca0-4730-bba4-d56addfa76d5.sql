
-- Create tables for agent token trades
CREATE TABLE IF NOT EXISTS public.agent_token_buy_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  token_amount NUMERIC NOT NULL,
  prompt_amount NUMERIC NOT NULL,
  price_per_token NUMERIC NOT NULL,
  bonding_curve_price NUMERIC NOT NULL,
  transaction_hash TEXT,
  block_number BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_token_sell_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  token_amount NUMERIC NOT NULL,
  prompt_amount NUMERIC NOT NULL,
  price_per_token NUMERIC NOT NULL,
  bonding_curve_price NUMERIC NOT NULL,
  transaction_hash TEXT,
  block_number BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_buy_trades_agent_time ON public.agent_token_buy_trades(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sell_trades_agent_time ON public.agent_token_sell_trades(agent_id, created_at);

-- Enable RLS for trade tables
ALTER TABLE public.agent_token_buy_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_token_sell_trades ENABLE ROW LEVEL SECURITY;

-- Create policies for trade tables
CREATE POLICY "Buy trades are viewable by everyone" 
  ON public.agent_token_buy_trades 
  FOR SELECT 
  USING (true);

CREATE POLICY "Sell trades are viewable by everyone" 
  ON public.agent_token_sell_trades 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own buy trades" 
  ON public.agent_token_buy_trades 
  FOR INSERT 
  WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "Users can insert their own sell trades" 
  ON public.agent_token_sell_trades 
  FOR INSERT 
  WITH CHECK (user_id = (auth.uid())::text);

-- Function to generate OHLCV data from bonding curve trades
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
      created_at,
      bonding_curve_price as price,
      token_amount as volume,
      'buy' as trade_type
    FROM agent_token_buy_trades 
    WHERE agent_id = p_agent_id 
      AND created_at >= p_start_time 
      AND created_at <= p_end_time
    
    UNION ALL
    
    SELECT 
      created_at,
      bonding_curve_price as price,
      token_amount as volume,
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
      volume,
      created_at,
      ROW_NUMBER() OVER (PARTITION BY date_trunc('epoch', created_at) + INTERVAL '1 second' * (EXTRACT(epoch FROM created_at)::int / interval_seconds * interval_seconds) ORDER BY created_at ASC) as first_trade,
      ROW_NUMBER() OVER (PARTITION BY date_trunc('epoch', created_at) + INTERVAL '1 second' * (EXTRACT(epoch FROM created_at)::int / interval_seconds * interval_seconds) ORDER BY created_at DESC) as last_trade
    FROM all_trades
  )
  SELECT 
    bucket as time_bucket,
    FIRST_VALUE(price) OVER (PARTITION BY bucket ORDER BY created_at ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as open_price,
    MAX(price) as high_price,
    MIN(price) as low_price,
    FIRST_VALUE(price) OVER (PARTITION BY bucket ORDER BY created_at DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as close_price,
    SUM(volume) as volume,
    COUNT(*)::INTEGER as trade_count
  FROM bucketed_trades
  GROUP BY bucket
  ORDER BY bucket ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to simulate price impact for ghost bars
CREATE OR REPLACE FUNCTION simulate_price_impact(
  p_agent_id UUID,
  p_prompt_amount NUMERIC,
  p_trade_type TEXT DEFAULT 'buy'
)
RETURNS TABLE (
  current_price NUMERIC,
  impact_price NUMERIC,
  price_impact_percent NUMERIC,
  estimated_tokens NUMERIC
) AS $$
DECLARE
  current_prompt_raised NUMERIC;
  graduation_threshold NUMERIC := 42000;
BEGIN
  -- Get current prompt raised for the agent
  SELECT COALESCE(prompt_raised, 0) INTO current_prompt_raised
  FROM agents 
  WHERE id = p_agent_id;

  -- Calculate bonding curve prices (simplified version)
  -- This should match the logic in your bondingCurve.ts file
  RETURN QUERY
  SELECT 
    -- Current price calculation (simplified)
    (30 + current_prompt_raised * 0.001)::NUMERIC as current_price,
    -- Impact price after trade
    (30 + (current_prompt_raised + CASE WHEN p_trade_type = 'buy' THEN p_prompt_amount ELSE -p_prompt_amount END) * 0.001)::NUMERIC as impact_price,
    -- Price impact percentage
    (((30 + (current_prompt_raised + CASE WHEN p_trade_type = 'buy' THEN p_prompt_amount ELSE -p_prompt_amount END) * 0.001) - (30 + current_prompt_raised * 0.001)) / (30 + current_prompt_raised * 0.001) * 100)::NUMERIC as price_impact_percent,
    -- Estimated tokens (simplified)
    (p_prompt_amount / (30 + current_prompt_raised * 0.001))::NUMERIC as estimated_tokens;
END;
$$ LANGUAGE plpgsql;
