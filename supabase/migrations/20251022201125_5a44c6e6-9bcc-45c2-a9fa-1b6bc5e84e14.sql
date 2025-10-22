-- Phase 1 (Fixed): Add deployment tracking fields to agents table

-- Add deployment status tracking
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS deployment_status TEXT DEFAULT 'not_deployed';

-- Add network environment tracking
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS network_environment TEXT DEFAULT 'testnet';

-- Add contract deployment timestamp
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMP WITH TIME ZONE;

-- Add integer chain_id for faster API queries (84532 = Base Sepolia, 8453 = Base Mainnet)
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS chain_id INTEGER DEFAULT 84532;

-- Update existing agents with token_address to have proper deployment status
-- Don't modify deployment_method to avoid check constraint violation
UPDATE agents 
SET 
  deployment_status = 'deployed',
  deployment_verified = true,
  deployed_at = COALESCE(deployed_at, created_at),
  network_environment = 'testnet',
  chain_id = 84532
WHERE token_address IS NOT NULL AND token_address != '' AND deployment_status IS NULL;

-- Mark DB-only agents clearly
UPDATE agents 
SET 
  deployment_status = 'not_deployed',
  network_environment = 'testnet',
  chain_id = 84532
WHERE (token_address IS NULL OR token_address = '') AND deployment_status IS NULL;

-- Add indexes for faster API queries
CREATE INDEX IF NOT EXISTS idx_agents_deployment_status ON agents(deployment_status);
CREATE INDEX IF NOT EXISTS idx_agents_network_environment ON agents(network_environment);
CREATE INDEX IF NOT EXISTS idx_agents_chain_id ON agents(chain_id);
CREATE INDEX IF NOT EXISTS idx_agents_token_address_lower ON agents(LOWER(token_address));
CREATE INDEX IF NOT EXISTS idx_agents_deployed_at ON agents(deployed_at DESC);

-- Add deployment_modes to admin_settings
INSERT INTO admin_settings (key, value, description)
VALUES (
  'deployment_modes',
  '{"allow_database_only": true, "allow_contract_deployment": true, "default_mode": "contract"}'::jsonb,
  'Controls which deployment methods are available for agent creation'
) ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;

-- Add comments for documentation
COMMENT ON COLUMN agents.deployment_status IS 'Tracks the deployment state: not_deployed (DB only), deploying (in progress), deployed (on-chain), deployment_failed';
COMMENT ON COLUMN agents.network_environment IS 'Network where agent is deployed: testnet (Base Sepolia) or mainnet (Base Mainnet)';
COMMENT ON COLUMN agents.chain_id IS 'Chain ID for quick filtering: 84532 (Base Sepolia), 8453 (Base Mainnet)';
COMMENT ON COLUMN agents.deployed_at IS 'Timestamp when contract was successfully deployed on-chain';