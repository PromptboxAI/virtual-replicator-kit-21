
-- Fix the agent with the confirmed contract address from Basescan
UPDATE agents
SET 
  token_contract_address = '0x45b260Eed41805daF4627Ce04d541f3132d8e47F',
  token_address = '0x45b260Eed41805daF4627Ce04d541f3132d8e47F',
  deployment_tx_hash = '0xe585b59ec60d070fc8183311a16c2d41b114c9b02a9e3e4a4281f96cd057d2ec',
  deployment_status = 'deployed'
WHERE id = '18058db4-cad2-4a7f-ba56-8aa3c3ff045e';
