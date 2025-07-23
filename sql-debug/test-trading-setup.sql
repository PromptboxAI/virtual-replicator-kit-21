
-- SQL Debug Script for Trading Interface
-- Replace YOUR_WALLET_ADDRESS with your actual wallet address from the debug panel

-- 1. Check if user exists and has balance
SELECT 
  user_id, 
  balance, 
  test_mode, 
  created_at, 
  updated_at
FROM user_token_balances 
WHERE user_id = 'YOUR_WALLET_ADDRESS';

-- 2. Check agent state
SELECT 
  id,
  name,
  symbol,
  prompt_raised,
  current_price,
  market_cap,
  token_graduated,
  graduation_threshold,
  test_mode,
  is_active
FROM agents 
WHERE id = '30d130d1-7da2-4174-a577-bbb5a57f9125';

-- 3. Test the bonding curve function directly
SELECT * FROM execute_bonding_curve_trade(
  '30d130d1-7da2-4174-a577-bbb5a57f9125'::uuid,
  'YOUR_WALLET_ADDRESS',
  100,
  'buy',
  0,
  30.0,
  0.5
);

-- 4. Check if there are any existing trades for this agent
SELECT * FROM agent_token_buy_trades 
WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125' 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check token holders for this agent
SELECT * FROM agent_token_holders 
WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125';
