-- Phase 1: Activate Factory V2 in Database
-- Activate the real factory deployed on July 27, 2024
UPDATE deployed_contracts
SET is_active = true, updated_at = NOW()
WHERE contract_address = '0x09cbe197c98070eba3707be52f552f3a50aae749'
  AND contract_type = 'factory'
  AND network = 'base_sepolia';

-- Deactivate all other factories
UPDATE deployed_contracts
SET is_active = false, updated_at = NOW()
WHERE contract_type IN ('factory', 'factory_v2')
  AND network = 'base_sepolia'
  AND contract_address != '0x09cbe197c98070eba3707be52f552f3a50aae749';