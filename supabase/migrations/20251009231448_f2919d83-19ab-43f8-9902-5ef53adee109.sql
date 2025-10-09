-- ============================================================================
-- PHASE 5: Historical Price Correction for TestToken14
-- Recalculate all bonding_curve_price values using correct V4 constants
-- ============================================================================

-- Step 1: Recalculate bonding_curve_price for all BUY trades using V4 formula
UPDATE agent_token_buy_trades
SET bonding_curve_price = 0.0000075 + ((0.00075 - 0.0000075) / 800000000.0) * COALESCE(tokens_sold_before, 0)
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'
  AND tokens_sold_before IS NOT NULL;

-- Step 2: Recalculate bonding_curve_price for all SELL trades using V4 formula
UPDATE agent_token_sell_trades
SET bonding_curve_price = 0.0000075 + ((0.00075 - 0.0000075) / 800000000.0) * COALESCE(tokens_sold_before, 0)
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'
  AND tokens_sold_before IS NOT NULL;

-- Step 3: Also recalculate price_per_token to match
UPDATE agent_token_buy_trades
SET price_per_token = bonding_curve_price
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'
  AND tokens_sold_before IS NOT NULL;

UPDATE agent_token_sell_trades
SET price_per_token = bonding_curve_price
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'
  AND tokens_sold_before IS NOT NULL;

-- Step 4: Verify the correction
SELECT 
  'Buy Trades' as trade_type,
  COUNT(*) as total_trades,
  MIN(bonding_curve_price) as min_price,
  MAX(bonding_curve_price) as max_price,
  AVG(bonding_curve_price) as avg_price
FROM agent_token_buy_trades
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf'

UNION ALL

SELECT 
  'Sell Trades' as trade_type,
  COUNT(*) as total_trades,
  MIN(bonding_curve_price) as min_price,
  MAX(bonding_curve_price) as max_price,
  AVG(bonding_curve_price) as avg_price
FROM agent_token_sell_trades
WHERE agent_id = 'd43cf556-40fd-445b-9424-4e7da41a1abf';

-- Step 5: Add comment documenting the correction
COMMENT ON TABLE agent_token_buy_trades IS 'Buy trades - bonding_curve_price recalculated for TestToken14 on 2025-01-09 using corrected V4 constants (p0=0.0000075, p1=0.00075)';
COMMENT ON TABLE agent_token_sell_trades IS 'Sell trades - bonding_curve_price recalculated for TestToken14 on 2025-01-09 using corrected V4 constants (p0=0.0000075, p1=0.00075)';