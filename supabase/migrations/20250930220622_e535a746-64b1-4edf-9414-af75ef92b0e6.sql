-- Backfill V4 dynamic pricing data for existing agents
-- This migration sets default values for agents created before V4 implementation

-- Update all existing agents with default V4 pricing fields
UPDATE public.agents
SET 
  created_prompt_usd_rate = 0.10,              -- Default $0.10 per PROMPT
  created_p0 = 0.00004,                        -- Default P0 (matches V3)
  created_p1 = 0.0001,                         -- Default P1 (matches V3)
  graduation_mode = 'database',                -- All existing agents use database mode (42K fixed)
  target_market_cap_usd = NULL                 -- NULL for database mode (not USD-based)
WHERE created_prompt_usd_rate IS NULL         -- Only update agents without pricing data
  OR graduation_mode IS NULL;

-- Add comment for audit trail
COMMENT ON COLUMN public.agents.created_prompt_usd_rate IS 'PROMPT USD price at agent creation time - backfilled to 0.10 for legacy agents';
COMMENT ON COLUMN public.agents.graduation_mode IS 'Graduation mode - backfilled to database for legacy agents (42K fixed threshold)';

-- Log the migration
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM public.agents 
  WHERE created_prompt_usd_rate = 0.10 AND graduation_mode = 'database';
  RAISE NOTICE 'V4 Pricing Data Backfill: Updated % agents with default pricing configuration', updated_count;
END $$;