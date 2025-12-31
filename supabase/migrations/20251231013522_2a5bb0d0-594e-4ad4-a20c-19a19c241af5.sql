-- Fix token_holders count for PLTEST2 agent (using allowed deployment_method value)
UPDATE public.agents 
SET 
  token_holders = 1,
  deployment_method = 'factory',
  creator_wallet_address = '0x23d03610584b0f0988a6f9c281a37094d5611388'
WHERE id = '18058db4-cad2-4a7f-ba56-8aa3c3ff045e';

-- Sync position to agent_token_holders table
INSERT INTO public.agent_token_holders (agent_id, user_id, token_balance, total_invested, average_buy_price)
SELECT 
  agent_id,
  holder_address as user_id,
  token_balance,
  50 as total_invested,
  0.00004039199189224356 as average_buy_price
FROM public.agent_database_positions
WHERE agent_id = '18058db4-cad2-4a7f-ba56-8aa3c3ff045e'
ON CONFLICT (agent_id, user_id) DO UPDATE SET
  token_balance = EXCLUDED.token_balance,
  total_invested = EXCLUDED.total_invested;