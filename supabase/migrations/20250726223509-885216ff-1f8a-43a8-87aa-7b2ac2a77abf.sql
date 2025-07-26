-- Reset failed graduation state for agent 30d130d1-7da2-4174-a577-bbb5a57f9125
-- First clear the foreign key reference, then delete the graduation event

-- Step 1: Reset the agent graduation status and clear the foreign key reference
UPDATE agents 
SET 
  token_graduated = false,
  graduation_event_id = NULL
WHERE id = '30d130d1-7da2-4174-a577-bbb5a57f9125';

-- Step 2: Delete any transaction logs associated with the failed graduation event
DELETE FROM graduation_transaction_logs 
WHERE graduation_event_id = '99b1168d-b58c-4163-bdb0-3f5a9722ddc9';

-- Step 3: Delete the failed graduation event (now safe to delete)
DELETE FROM agent_graduation_events 
WHERE id = '99b1168d-b58c-4163-bdb0-3f5a9722ddc9';