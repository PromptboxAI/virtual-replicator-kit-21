-- Add DB constraints for deployment consistency
ALTER TABLE agents ADD CONSTRAINT agent_deploy_consistency
CHECK (
  (token_address IS NULL AND deployment_verified = false)
  OR
  (token_address IS NOT NULL AND deployment_verified = true AND deployment_method IN ('factory','direct'))
);

-- Add unique index for case-insensitive token addresses
CREATE UNIQUE INDEX ux_agents_token_address_ci ON agents (lower(token_address)) 
WHERE token_address IS NOT NULL;

-- Add check constraint for deployment_method enum
ALTER TABLE agents ADD CONSTRAINT agent_deployment_method_check
CHECK (deployment_method IN ('factory', 'direct') OR deployment_method IS NULL);

-- Add columns for chain safety
ALTER TABLE agents ADD COLUMN chain_id INTEGER DEFAULT 84532; -- Base Sepolia
ALTER TABLE agents ADD COLUMN block_number BIGINT;