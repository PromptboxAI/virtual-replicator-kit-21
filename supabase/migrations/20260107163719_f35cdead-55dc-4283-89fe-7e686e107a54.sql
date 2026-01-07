-- Add graduated_at column to agents table for V7 graduation tracking
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS graduated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for efficient queries on graduation status
CREATE INDEX IF NOT EXISTS idx_agents_graduated_at ON public.agents(graduated_at) WHERE graduated_at IS NOT NULL;