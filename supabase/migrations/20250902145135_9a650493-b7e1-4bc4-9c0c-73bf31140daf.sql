-- Add platform vault configuration to treasury_config
ALTER TABLE public.treasury_config
ADD COLUMN IF NOT EXISTS platform_vault_address TEXT,
ADD COLUMN IF NOT EXISTS platform_allocation_percent NUMERIC DEFAULT 0.02,
ADD COLUMN IF NOT EXISTS vault_deploy_tx TEXT,
ADD COLUMN IF NOT EXISTS vault_deployed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vault_notes TEXT;

-- Create table to track platform token allocations
CREATE TABLE IF NOT EXISTS public.platform_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) NOT NULL,
  token_address TEXT NOT NULL,
  platform_amount NUMERIC NOT NULL DEFAULT 4000000, -- 2% of 200M LP allocation
  vault_address TEXT NOT NULL,
  allocation_tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_allocations_agent_id ON public.platform_allocations(agent_id);
CREATE INDEX IF NOT EXISTS idx_platform_allocations_status ON public.platform_allocations(status);

-- Enable RLS
ALTER TABLE public.platform_allocations ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform_allocations
CREATE POLICY "Platform allocations are viewable by everyone"
ON public.platform_allocations FOR SELECT
USING (true);

CREATE POLICY "Only system can modify platform allocations"
ON public.platform_allocations FOR ALL
USING (false);