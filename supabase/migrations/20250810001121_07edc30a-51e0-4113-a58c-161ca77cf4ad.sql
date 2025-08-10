-- Phase 4: Update agents table with new columns (if not existing)
-- Add new deployment tracking columns to agents table

-- Add deployment_method column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'agents' 
                   AND column_name = 'deployment_method') THEN
        ALTER TABLE public.agents ADD COLUMN deployment_method TEXT CHECK (deployment_method IN ('factory', 'direct', 'v2_migration'));
    END IF;
END $$;

-- Add deployment_verified column if it doesn't exist (already exists based on schema)
-- Add chain_id column if it doesn't exist (already exists based on schema) 
-- Add block_number column if it doesn't exist (already exists based on schema)

-- Update any existing deployment_tx_hash column constraint
-- (deployment_tx_hash column already exists based on schema)

-- Create function to sync agent data with audit table
CREATE OR REPLACE FUNCTION public.sync_agent_deployment_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a new audit record is created, update the agents table
  IF TG_OP = 'INSERT' THEN
    UPDATE public.agents 
    SET 
      deployment_method = NEW.deployment_method,
      deployment_tx_hash = NEW.deployment_tx_hash,
      deployment_verified = (NEW.verification_status = 'verified'),
      chain_id = NEW.chain_id,
      block_number = NEW.block_number,
      updated_at = NOW()
    WHERE id = NEW.agent_id;
  END IF;
  
  -- When verification status changes, update agent verification
  IF TG_OP = 'UPDATE' AND OLD.verification_status != NEW.verification_status THEN
    UPDATE public.agents 
    SET 
      deployment_verified = (NEW.verification_status = 'verified'),
      updated_at = NOW()
    WHERE id = NEW.agent_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to sync agent data
CREATE TRIGGER sync_agent_deployment_data_trigger
  AFTER INSERT OR UPDATE ON public.deployed_contracts_audit
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_agent_deployment_data();

-- Verification query to check if all tables exist
-- This will help verify the implementation is complete
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('deployed_contracts_audit', 'agent_chart_init', 'agent_realtime_updates', 'deployment_metrics')
ORDER BY tablename;