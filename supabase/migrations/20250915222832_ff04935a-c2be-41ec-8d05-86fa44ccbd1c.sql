-- Phase 2: Fix Database Constraints and Market Cap Calculation

-- Drop the problematic constraint that's causing deployment issues
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agent_deploy_consistency;
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agent_deploy_consisten;

-- Add flexible constraint that allows proper deployment states
ALTER TABLE agents
ADD CONSTRAINT agent_deploy_check CHECK (
  (deployment_status IS NULL) OR
  (deployment_status = 'not_deployed') OR
  (deployment_status = 'pending') OR
  (deployment_status = 'deployed' AND token_address IS NOT NULL) OR
  (deployment_status = 'failed')
);

-- Fix market cap calculation: market_cap = current_price * 1B total supply
-- This ensures ALPHA11 shows $520 instead of $32.7M
UPDATE agents
SET market_cap = current_price * 1000000000
WHERE pricing_model = 'linear_v3' OR pricing_model IS NULL;

-- Add columns for USD tracking (optional for future use)
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS prompt_usd_rate DECIMAL DEFAULT 0.10,
ADD COLUMN IF NOT EXISTS market_cap_usd DECIMAL GENERATED ALWAYS AS (market_cap * prompt_usd_rate) STORED;