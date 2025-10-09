-- ============================================================================
-- PHASE 6: Rebuild tokens_sold_before and recalculate prices correctly
-- This fixes the issue where all trades had the same price
-- ============================================================================

-- Step 1: Calculate cumulative tokens_sold_before for BUY trades
WITH ranked_buys AS (
  SELECT 
    id,
    token_amount,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at) as trade_order,
    SUM(token_amount) OVER (ORDER BY created_at ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) as cumulative_tokens_before
  FROM agent_token_buy_trades
  WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'
  ORDER BY created_at
)
UPDATE agent_token_buy_trades bt
SET tokens_sold_before = COALESCE(rb.cumulative_tokens_before, 0)
FROM ranked_buys rb
WHERE bt.id = rb.id
  AND bt.agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf';

-- Step 2: Calculate cumulative tokens_sold_before for SELL trades
WITH ranked_sells AS (
  SELECT 
    id,
    token_amount,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at) as trade_order,
    -- For sells, we need to account for buys that happened before
    (
      SELECT COALESCE(SUM(token_amount), 0)
      FROM agent_token_buy_trades
      WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'
        AND created_at < st.created_at
    ) - (
      SELECT COALESCE(SUM(token_amount), 0)
      FROM agent_token_sell_trades
      WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'
        AND created_at < st.created_at
    ) as cumulative_tokens_before
  FROM agent_token_sell_trades st
  WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'
  ORDER BY created_at
)
UPDATE agent_token_sell_trades st
SET tokens_sold_before = GREATEST(rs.cumulative_tokens_before, 0)
FROM ranked_sells rs
WHERE st.id = rs.id
  AND st.agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf';

-- Step 3: Now recalculate bonding_curve_price using correct tokens_sold_before
UPDATE agent_token_buy_trades
SET bonding_curve_price = 0.0000075 + ((0.00075 - 0.0000075) / 800000000.0) * tokens_sold_before
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf';

UPDATE agent_token_sell_trades
SET bonding_curve_price = 0.0000075 + ((0.00075 - 0.0000075) / 800000000.0) * tokens_sold_before
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf';

-- Step 4: Update price_per_token to match
UPDATE agent_token_buy_trades
SET price_per_token = bonding_curve_price
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf';

UPDATE agent_token_sell_trades
SET price_per_token = bonding_curve_price
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf';

-- Step 5: Verify the results show progressive pricing
SELECT 
  'Buy Trades' as trade_type,
  COUNT(*) as total_trades,
  MIN(tokens_sold_before) as min_tokens_before,
  MAX(tokens_sold_before) as max_tokens_before,
  MIN(bonding_curve_price) as min_price,
  MAX(bonding_curve_price) as max_price,
  AVG(bonding_curve_price) as avg_price
FROM agent_token_buy_trades
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'

UNION ALL

SELECT 
  'Sell Trades' as trade_type,
  COUNT(*) as total_trades,
  MIN(tokens_sold_before) as min_tokens_before,
  MAX(tokens_sold_before) as max_tokens_before,
  MIN(bonding_curve_price) as min_price,
  MAX(bonding_curve_price) as max_price,
  AVG(bonding_curve_price) as avg_price
FROM agent_token_sell_trades
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf';

-- Step 6: Show trade-by-trade progression for verification
SELECT 
  created_at,
  'buy' as trade_type,
  token_amount,
  tokens_sold_before,
  bonding_curve_price,
  prompt_amount
FROM agent_token_buy_trades
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'

UNION ALL

SELECT 
  created_at,
  'sell' as trade_type,
  token_amount,
  tokens_sold_before,
  bonding_curve_price,
  prompt_amount
FROM agent_token_sell_trades
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'

ORDER BY created_at;