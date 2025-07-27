-- Database Cleanup for Multiple Factory Contracts
-- This script handles multiple factory deployments and ensures only working ones remain active

BEGIN;

-- Step 1: Find all factory contracts and their status
SELECT 
  id,
  contract_address,
  is_active,
  created_at,
  transaction_hash
FROM deployed_contracts 
WHERE contract_type = 'factory' 
  AND network = 'base_sepolia'
ORDER BY created_at DESC;

-- Step 2: Deactivate all factory contracts except the most recent successful one
UPDATE deployed_contracts 
SET is_active = false,
    updated_at = now()
WHERE contract_type = 'factory' 
  AND network = 'base_sepolia'
  AND id NOT IN (
    SELECT id 
    FROM deployed_contracts 
    WHERE contract_type = 'factory' 
      AND network = 'base_sepolia'
      AND transaction_hash IS NOT NULL
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- Step 3: Clean up orphaned agent tokens (tokens without valid factory reference)
UPDATE agents 
SET token_address = NULL,
    token_graduated = false,
    graduation_event_id = NULL,
    status = 'PENDING'
WHERE token_address IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT agent_id 
    FROM agent_graduation_events 
    WHERE graduation_status = 'completed'
      AND v2_contract_address IS NOT NULL
  );

-- Step 4: Clean up graduation events for failed deployments
DELETE FROM graduation_transaction_logs 
WHERE graduation_event_id IN (
  SELECT id FROM agent_graduation_events 
  WHERE graduation_status != 'completed'
    OR v2_contract_address IS NULL
);

DELETE FROM agent_graduation_events 
WHERE graduation_status != 'completed'
  OR v2_contract_address IS NULL;

COMMIT;

-- Verification queries
SELECT 
  'Active Factories' as table_name,
  COUNT(*) as count
FROM deployed_contracts 
WHERE contract_type = 'factory' 
  AND network = 'base_sepolia'
  AND is_active = true

UNION ALL

SELECT 
  'Graduated Agents' as table_name,
  COUNT(*) as count
FROM agents 
WHERE token_graduated = true
  AND token_address IS NOT NULL

UNION ALL

SELECT 
  'Pending Agents' as table_name,
  COUNT(*) as count
FROM agents 
WHERE token_graduated = false
  AND status = 'PENDING';