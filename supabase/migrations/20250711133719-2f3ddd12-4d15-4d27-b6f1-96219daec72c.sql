-- Update all ACTIVATING agents to ACTIVE status
UPDATE agents 
SET status = 'ACTIVE', updated_at = now() 
WHERE status = 'ACTIVATING';

-- Show the results
SELECT id, name, framework, status, updated_at 
FROM agents 
WHERE status = 'ACTIVE' 
ORDER BY updated_at DESC;