-- Complete Agent Cleanup SQL Script
-- Use this to completely reset an agent's graduation state

-- Variables (replace with actual agent ID)
-- SET @agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125';

BEGIN;

-- Step 1: Clear agent references first to avoid foreign key issues
UPDATE agents 
SET 
  graduation_event_id = NULL,
  token_address = NULL,
  token_graduated = false,
  status = 'PENDING',
  prompt_raised = 7003  -- Reset to test value
WHERE id = '30d130d1-7da2-4174-a577-bbb5a57f9125';

-- Step 2: Get all graduation event IDs for this agent
-- (We'll use this to clean up related logs)

-- Step 3: Delete graduation transaction logs first (child records)
DELETE FROM graduation_transaction_logs 
WHERE graduation_event_id IN (
  SELECT id FROM agent_graduation_events 
  WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125'
);

-- Step 4: Delete agent graduation events
DELETE FROM agent_graduation_events 
WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125';

-- Step 5: Clean up any deployed contracts for this agent
UPDATE deployed_contracts 
SET is_active = false
WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125';

-- Step 6: Reset any revenue events (optional)
DELETE FROM revenue_events 
WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125';

-- Step 7: Reset revenue distributions (optional)
DELETE FROM revenue_distributions 
WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125';

-- Step 8: Clean up any revenue failures (optional)
DELETE FROM revenue_failures 
WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125';

COMMIT;

-- Verification queries (run after cleanup)
SELECT 
  'agents' as table_name,
  COUNT(*) as count,
  'token_graduated=' || COALESCE(token_graduated::text, 'NULL') as status
FROM agents 
WHERE id = '30d130d1-7da2-4174-a577-bbb5a57f9125'

UNION ALL

SELECT 
  'graduation_events' as table_name,
  COUNT(*) as count,
  'events_remaining' as status
FROM agent_graduation_events 
WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125'

UNION ALL

SELECT 
  'graduation_logs' as table_name,
  COUNT(*) as count,
  'logs_remaining' as status
FROM graduation_transaction_logs 
WHERE graduation_event_id IN (
  SELECT id FROM agent_graduation_events 
  WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125'
)

UNION ALL

SELECT 
  'deployed_contracts' as table_name,
  COUNT(*) as count,
  'active_contracts' as status
FROM deployed_contracts 
WHERE agent_id = '30d130d1-7da2-4174-a577-bbb5a57f9125' 
AND is_active = true;