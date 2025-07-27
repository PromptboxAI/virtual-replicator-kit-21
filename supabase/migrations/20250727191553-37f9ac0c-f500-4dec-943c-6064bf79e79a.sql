-- Fix the factory contract address - set the correct one as active
UPDATE deployed_contracts 
SET is_active = true 
WHERE contract_address = '0x4e9b560c31b9518d4d1fb7bbd51fab7613a200d9' 
  AND contract_type = 'factory';

-- Deactivate the reverted contract address
UPDATE deployed_contracts 
SET is_active = false 
WHERE contract_address = '0x0fe57068756dbf86ad8c19fbf711a8fcd4f08585' 
  AND contract_type = 'factory';