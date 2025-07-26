-- Reset failed graduation state for agent 30d130d1-7da2-4174-a577-bbb5a57f9125

-- Delete any transaction logs associated with the failed graduation event
DELETE FROM graduation_transaction_logs 
WHERE graduation_event_id = '99b1168d-b58c-4163-bdb0-3f5a9722ddc9';

-- Delete the failed graduation event
DELETE FROM agent_graduation_events 
WHERE id = '99b1168d-b58c-4163-bdb0-3f5a9722ddc9';

-- Reset the agent graduation status to allow fresh attempts
UPDATE agents 
SET 
  token_graduated = false,
  graduation_event_id = NULL
WHERE id = '30d130d1-7da2-4174-a577-bbb5a57f9125';