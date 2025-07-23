
-- Create a fresh test token for debugging
INSERT INTO agents (
  name, 
  symbol, 
  description, 
  category, 
  current_price, 
  test_mode, 
  is_active, 
  prompt_raised, 
  token_graduated, 
  graduation_threshold,
  market_cap,
  volume_24h,
  price_change_24h,
  token_holders,
  creator_id
) VALUES (
  'Debug Test Agent', 
  'DEBUG', 
  'Fresh agent created for debugging trading interface', 
  'Testing', 
  30.0, 
  true, 
  true, 
  0, 
  false, 
  42000,
  0,
  0,
  0,
  0,
  'debug-creator'
)
RETURNING id, name, symbol, prompt_raised, current_price;

-- Also create a test user balance if needed
INSERT INTO user_token_balances (user_id, balance, test_mode)
VALUES ('YOUR_WALLET_ADDRESS', 10000, true)
ON CONFLICT (user_id) 
DO UPDATE SET 
  balance = GREATEST(user_token_balances.balance, 10000),
  updated_at = now();
