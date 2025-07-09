-- Add creator tracking to agents table
ALTER TABLE public.agents 
ADD COLUMN creator_id text REFERENCES auth.users(id);

-- Add status tracking for agent deployment
ALTER TABLE public.agents 
ADD COLUMN status text DEFAULT 'ACTIVATING' CHECK (status IN ('ACTIVATING', 'AVAILABLE', 'INACTIVE'));

-- Add index for faster creator queries
CREATE INDEX idx_agents_creator_id ON public.agents(creator_id);

-- Update existing agents to have a default status
UPDATE public.agents SET status = 'AVAILABLE' WHERE status IS NULL;