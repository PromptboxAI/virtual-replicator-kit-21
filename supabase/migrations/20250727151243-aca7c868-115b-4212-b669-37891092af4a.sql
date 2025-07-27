-- Insert the new factory contract address
INSERT INTO deployed_contracts (
  contract_address,
  contract_type,
  network,
  version,
  name,
  is_active
) VALUES (
  '0x4e9b560c31b9518d4d1fb7bbd51fab7613a200d9',
  'factory',
  'base_sepolia',
  'v2',
  'AgentTokenFactory',
  true
);

-- Deactivate the old factory contract
UPDATE deployed_contracts 
SET is_active = false 
WHERE contract_address = '0x0fe57068756dbf86ad8c19fbf711a8fcd4f08585' 
  AND contract_type = 'factory';