-- Fix the status constraint to include 'ACTIVE'
ALTER TABLE agents DROP CONSTRAINT agents_status_check;

-- Add the new constraint with ACTIVE included
ALTER TABLE agents ADD CONSTRAINT agents_status_check 
CHECK (status = ANY (ARRAY['ACTIVATING'::text, 'ACTIVE'::text, 'AVAILABLE'::text, 'INACTIVE'::text]));

-- Now test updating an agent to ACTIVE status
UPDATE agents 
SET status = 'ACTIVE', updated_at = now() 
WHERE id = '439a06a4-a7e3-4f9b-b158-12e315be104a';

-- Verify the update worked
SELECT id, name, status, updated_at FROM agents WHERE id = '439a06a4-a7e3-4f9b-b158-12e315be104a';