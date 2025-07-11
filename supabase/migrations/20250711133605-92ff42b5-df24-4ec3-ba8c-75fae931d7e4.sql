-- Test updating one agent status manually to verify permissions
UPDATE agents 
SET status = 'ACTIVE', updated_at = now() 
WHERE id = '439a06a4-a7e3-4f9b-b158-12e315be104a';

-- Check if the update worked
SELECT id, name, status, updated_at FROM agents WHERE id = '439a06a4-a7e3-4f9b-b158-12e315be104a';