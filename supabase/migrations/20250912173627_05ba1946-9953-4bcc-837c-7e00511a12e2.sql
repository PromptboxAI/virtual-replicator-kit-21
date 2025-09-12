-- COMPLETE PATCH MIGRATION: Phase 1 Completion + Phase 3 Preparation
-- This migration fixes all remaining issues and prepares for MEV protection

BEGIN;

-- STEP 1: Fix ALPHA2 bonding_curve_supply (complete Phase 1.4 cleanup)
UPDATE agents 
SET bonding_curve_supply = 0
WHERE id = '1d43a77d-44a0-48da-8f5a-1bea56bc8eff';

-- STEP 2: Add Phase 3 MEV Protection Columns
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS creation_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS creation_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS creator_prebuy_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS creation_mode TEXT DEFAULT 'database';

-- STEP 3: Migrate ALL agents to V3 pricing model
UPDATE agents 
SET pricing_model = 'linear_v3'
WHERE pricing_model != 'linear_v3' OR pricing_model IS NULL;

-- STEP 4: Recalculate current_price using V3 formula for all agents
UPDATE agents 
SET current_price = get_price_from_prompt_v3(prompt_raised)
WHERE pricing_model = 'linear_v3';

-- STEP 5: Recalculate market_cap based on new V3 prices
UPDATE agents 
SET market_cap = current_price * 1000000000  -- 1B total supply
WHERE pricing_model = 'linear_v3';

-- STEP 6: Recalculate bonding_curve_supply using V3 inverse formula
UPDATE agents 
SET bonding_curve_supply = tokens_sold_from_prompt_v3(prompt_raised)
WHERE pricing_model = 'linear_v3';

-- STEP 7: Add V3 helper functions for Phase 3 MEV protection
CREATE OR REPLACE FUNCTION public.can_trade_agent(p_agent_id uuid, p_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_record RECORD;
BEGIN
  SELECT * INTO agent_record FROM public.agents WHERE id = p_agent_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If agent is not creation locked, allow trading
  IF NOT COALESCE(agent_record.creation_locked, false) THEN
    RETURN true;
  END IF;
  
  -- If creation lock expired, allow trading
  IF agent_record.creation_expires_at IS NOT NULL 
     AND agent_record.creation_expires_at <= now() THEN
    RETURN true;
  END IF;
  
  -- If user is the creator, allow trading during lock period
  IF agent_record.creator_id = p_user_id THEN
    RETURN true;
  END IF;
  
  -- Otherwise, block trading during creation lock
  RETURN false;
END;
$$;

-- STEP 8: Add cleanup function for expired creation locks
CREATE OR REPLACE FUNCTION public.unlock_expired_agents()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unlocked_count integer;
BEGIN
  UPDATE public.agents 
  SET 
    creation_locked = false,
    creation_expires_at = null
  WHERE creation_locked = true
    AND creation_expires_at IS NOT NULL
    AND creation_expires_at <= now();
    
  GET DIAGNOSTICS unlocked_count = ROW_COUNT;
  
  RETURN unlocked_count;
END;
$$;

-- STEP 9: Add indexes for Phase 3 performance
CREATE INDEX IF NOT EXISTS idx_agents_creation_expires_at 
ON agents(creation_expires_at) 
WHERE creation_locked = true;

CREATE INDEX IF NOT EXISTS idx_agents_pricing_model 
ON agents(pricing_model);

CREATE INDEX IF NOT EXISTS idx_agents_creation_locked 
ON agents(creation_locked) 
WHERE creation_locked = true;

-- STEP 10: Add constraint to ensure data consistency
ALTER TABLE agents 
ADD CONSTRAINT chk_creation_lock_consistency 
CHECK (
  (creation_locked = false AND creation_expires_at IS NULL) OR
  (creation_locked = true AND creation_expires_at IS NOT NULL)
);

COMMIT;

-- Verification queries
SELECT 
  'Migration Summary' as section,
  COUNT(*) as total_agents,
  COUNT(*) FILTER (WHERE pricing_model = 'linear_v3') as v3_agents,
  COUNT(*) FILTER (WHERE creation_locked = true) as locked_agents,
  COUNT(*) FILTER (WHERE prompt_raised > 0 AND current_price <= 0) as price_errors
FROM agents
WHERE is_active = true;

SELECT 
  'ALPHA2 Status' as section,
  name,
  prompt_raised,
  current_price,
  bonding_curve_supply,
  pricing_model,
  creation_locked
FROM agents 
WHERE id = '1d43a77d-44a0-48da-8f5a-1bea56bc8eff';

SELECT 
  'Function Check' as section,
  CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'can_trade_agent') 
    THEN 'can_trade_agent: EXISTS' 
    ELSE 'can_trade_agent: MISSING' 
  END as function_status;