-- Phase 2: Fix Database Constraints and Market Cap Calculation (Fixed)

-- Drop the problematic constraint that's causing deployment issues
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agent_deploy_consistency;
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agent_deploy_consisten;

-- Fix market cap calculation: market_cap = current_price * 1B total supply
-- This ensures ALPHA11 shows $520 instead of $32.7M
UPDATE agents
SET market_cap = current_price * 1000000000
WHERE pricing_model = 'linear_v3' OR pricing_model IS NULL;

-- Add columns for USD tracking (optional for future use)
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS prompt_usd_rate DECIMAL DEFAULT 0.10,
ADD COLUMN IF NOT EXISTS market_cap_usd DECIMAL GENERATED ALWAYS AS (market_cap * prompt_usd_rate) STORED;