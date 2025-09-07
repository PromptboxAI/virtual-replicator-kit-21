-- Boost user balance to 200,000 PROMPT tokens for comprehensive testing
UPDATE user_token_balances 
SET 
  balance = 200000,
  updated_at = now()
WHERE user_id = '0x23d03610584B0f0988A6F9C281a37094D5611388';

-- If user doesn't exist, create with 200K balance
INSERT INTO user_token_balances (user_id, balance, test_mode)
VALUES ('0x23d03610584B0f0988A6F9C281a37094D5611388', 200000, true)
ON CONFLICT (user_id) 
DO UPDATE SET 
  balance = 200000,
  updated_at = now();