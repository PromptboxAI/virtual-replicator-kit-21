-- Fix the agent's is_active status
-- This agent should be active since it has trading activity
UPDATE public.agents
SET is_active = true
WHERE id = '31794238-7b77-4eec-91e7-f7be6bdcf91a';

-- Add comment explaining the status
COMMENT ON COLUMN public.agents.is_active IS 
'Indicates if the agent is active and available for trading. Set to true when agent is ready for use.';