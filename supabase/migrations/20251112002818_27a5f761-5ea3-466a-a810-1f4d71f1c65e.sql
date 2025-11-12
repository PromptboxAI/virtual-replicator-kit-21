-- Add FAILED status to agent schema
ALTER TABLE public.agents 
  DROP CONSTRAINT IF EXISTS agents_status_check;

ALTER TABLE public.agents 
  ADD CONSTRAINT agents_status_check 
  CHECK (status IN ('ACTIVATING', 'ACTIVE', 'INACTIVE', 'FAILED', 'AVAILABLE'));

-- Add failure tracking columns
ALTER TABLE public.agents 
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add index for cleanup query performance
CREATE INDEX IF NOT EXISTS idx_agents_failed_cleanup 
  ON public.agents(status, failed_at) 
  WHERE status = 'FAILED';

-- Backfill existing failed agents (no tx hash, not active)
UPDATE public.agents 
SET 
  status = 'FAILED',
  is_active = false,
  failed_at = updated_at,
  failure_reason = 'Legacy failed deployment - no transaction hash'
WHERE 
  deployment_tx_hash IS NULL 
  AND status IN ('ACTIVATING', 'INACTIVE')
  AND is_active = false;