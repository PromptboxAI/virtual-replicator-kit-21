-- Enhanced Phase 5 Database Cleanup - Fixed Status Values
-- =====================================================================

BEGIN;

-- PHASE 5A: Create Backup Tables
-- =====================================================================
CREATE TABLE deployed_contracts_backup AS SELECT * FROM deployed_contracts;
CREATE TABLE agents_backup AS SELECT * FROM agents;
CREATE TABLE agent_graduation_events_backup AS SELECT * FROM agent_graduation_events;
CREATE TABLE agent_token_holders_backup AS SELECT * FROM agent_token_holders;

-- PHASE 5B: Deactivate ALL Phantom Contracts
-- =====================================================================
-- Mark all deployed contracts as inactive (will reactivate verified ones later)
UPDATE deployed_contracts 
SET is_active = false,
    updated_at = now()
WHERE is_active = true;

-- PHASE 5C: Clear ALL Contract References from Agents
-- =====================================================================
UPDATE agents 
SET 
  token_address = NULL,
  token_graduated = false,
  graduation_event_id = NULL,
  status = 'ACTIVATING',  -- Use valid status value
  prompt_raised = GREATEST(prompt_raised, 0),  -- Keep existing progress but ensure non-negative
  bonding_curve_supply = 0,
  current_price = 30,  -- Reset to base price
  updated_at = now()
WHERE token_address IS NOT NULL 
   OR token_graduated = true 
   OR graduation_event_id IS NOT NULL;

-- PHASE 5D: Clean Trading History References
-- =====================================================================
-- Clear agent token holders for agents that no longer have valid contracts
DELETE FROM agent_token_holders 
WHERE agent_id IN (
  SELECT id FROM agents WHERE token_address IS NULL
);

-- PHASE 5E: Clean Graduation Events & Logs
-- =====================================================================
-- Delete graduation transaction logs first (child records)
DELETE FROM graduation_transaction_logs 
WHERE graduation_event_id IN (
  SELECT id FROM agent_graduation_events
);

-- Delete all graduation events
DELETE FROM agent_graduation_events;

-- PHASE 5F: Reset Revenue Events for Clean State
-- =====================================================================
-- Clean revenue events for agents without valid contracts
DELETE FROM revenue_events 
WHERE agent_id IN (
  SELECT id FROM agents WHERE token_address IS NULL
);

DELETE FROM revenue_distributions 
WHERE agent_id IN (
  SELECT id FROM agents WHERE token_address IS NULL
);

DELETE FROM revenue_failures 
WHERE agent_id IN (
  SELECT id FROM agents WHERE token_address IS NULL
);

COMMIT;

-- Verification Queries
-- =====================================================================
SELECT 
  'Backup Tables Created' as status,
  'deployed_contracts_backup, agents_backup, agent_graduation_events_backup, agent_token_holders_backup' as tables;

SELECT 
  'Active Contracts After Cleanup' as metric,
  COUNT(*) as count
FROM deployed_contracts 
WHERE is_active = true;

SELECT 
  'Agents with Token Addresses' as metric,
  COUNT(*) as count
FROM agents 
WHERE token_address IS NOT NULL;

SELECT 
  'Graduated Agents' as metric,
  COUNT(*) as count
FROM agents 
WHERE token_graduated = true;

SELECT 
  'Graduation Events Remaining' as metric,
  COUNT(*) as count
FROM agent_graduation_events;

SELECT 
  'Agent Token Holders Remaining' as metric,
  COUNT(*) as count
FROM agent_token_holders;