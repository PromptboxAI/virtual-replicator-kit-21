-- Add deployment mode indicators to agent cards
-- Update any missing columns for Phase 3.2 Smart Contract Integration

-- No schema changes needed - the creation_mode column already exists in agents table
-- This migration ensures any existing agents have a proper creation_mode value

UPDATE public.agents 
SET creation_mode = 'database' 
WHERE creation_mode IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.agents.creation_mode IS 'Indicates how the agent was deployed: database (traditional) or smart_contract (atomic MEV protection)';

-- Ensure factory_v2 contract type can be stored
-- This allows the new AgentTokenFactoryV2 contracts to be tracked
INSERT INTO public.deployed_contracts (contract_type, contract_address, network, is_active, name, symbol, version) 
VALUES ('factory_v2', '0x0000000000000000000000000000000000000000', 'base_sepolia', false, 'Placeholder Factory V2', 'FACT2', 'v2')
ON CONFLICT DO NOTHING;