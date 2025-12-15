-- Update 2 agents to deployed status with mock data for trade app testing
UPDATE agents 
SET 
  deployment_status = 'deployed',
  token_address = '0x' || SUBSTRING(REPLACE(id::text, '-', ''), 1, 40),
  prompt_raised = CASE 
    WHEN id = 'b3b72377-66e8-44ec-8c13-1a07091dc35a' THEN 5000
    WHEN id = '2a66ff34-1a88-4075-b932-9d064e9ca26d' THEN 15000
    ELSE prompt_raised
  END,
  bonding_curve_supply = CASE 
    WHEN id = 'b3b72377-66e8-44ec-8c13-1a07091dc35a' THEN 125000000
    WHEN id = '2a66ff34-1a88-4075-b932-9d064e9ca26d' THEN 375000000
    ELSE bonding_curve_supply
  END,
  circulating_supply = CASE 
    WHEN id = 'b3b72377-66e8-44ec-8c13-1a07091dc35a' THEN 125000000
    WHEN id = '2a66ff34-1a88-4075-b932-9d064e9ca26d' THEN 375000000
    ELSE circulating_supply
  END,
  current_price = CASE 
    WHEN id = 'b3b72377-66e8-44ec-8c13-1a07091dc35a' THEN 0.00005
    WHEN id = '2a66ff34-1a88-4075-b932-9d064e9ca26d' THEN 0.00007
    ELSE current_price
  END,
  token_holders = CASE 
    WHEN id = 'b3b72377-66e8-44ec-8c13-1a07091dc35a' THEN 3
    WHEN id = '2a66ff34-1a88-4075-b932-9d064e9ca26d' THEN 5
    ELSE token_holders
  END,
  deployed_at = NOW(),
  status = 'ACTIVE'
WHERE id IN ('b3b72377-66e8-44ec-8c13-1a07091dc35a', '2a66ff34-1a88-4075-b932-9d064e9ca26d');