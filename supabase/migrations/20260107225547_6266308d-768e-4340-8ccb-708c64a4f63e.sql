-- Force price recalculation for V7 agents by touching shares_sold
-- This triggers the update_agent_price_on_prompt_change function
UPDATE agents 
SET 
  shares_sold = shares_sold,
  -- Also fix metadata fields that weren't set during creation/deployment
  deployed_at = COALESCE(deployed_at, created_at),
  deployment_verified = CASE 
    WHEN deployment_status = 'deployed' AND token_contract_address IS NOT NULL 
    THEN true 
    ELSE deployment_verified 
  END
WHERE pricing_model = 'linear_v7';

-- Note on the fields you asked about:
-- migration_validated/migration_completed_at: These are for V3→V4 migration, not V7. 
--   V7 agents are created fresh, so migration_validated=true is just a default.
-- creator_prebuy_amount: This should be set during agent creation - it's a tracking field, 
--   not used by V7 trading engine (prebuy goes through normal buy flow)