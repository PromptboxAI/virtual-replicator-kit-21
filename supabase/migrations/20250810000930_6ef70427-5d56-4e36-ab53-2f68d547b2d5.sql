-- Phase 1: Core Infrastructure Tables
-- deployed_contracts_audit: Primary audit table for all contract deployments
CREATE TABLE public.deployed_contracts_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id),
  token_address TEXT NOT NULL,
  token_address_checksum TEXT NOT NULL,
  deployer_address TEXT NOT NULL,
  deployment_method TEXT NOT NULL CHECK (deployment_method IN ('factory', 'direct')),
  deployment_tx_hash TEXT NOT NULL UNIQUE,
  chain_id INTEGER NOT NULL DEFAULT 84532,
  block_number BIGINT NOT NULL,
  block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Gas tracking
  gas_used BIGINT,
  effective_gas_price BIGINT,
  deployment_cost_wei BIGINT GENERATED ALWAYS AS (gas_used * effective_gas_price) STORED,
  deployment_cost_usd NUMERIC(10,2),
  
  -- Bytecode verification
  bytecode_length INTEGER,
  bytecode_hash TEXT,
  runtime_bytecode_hash TEXT,
  
  -- Factory metadata
  factory_address TEXT,
  factory_version TEXT,
  factory_parse_method TEXT,
  
  -- Verification
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_method TEXT CHECK (verification_method IN ('automatic', 'manual', 'failed')),
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'failed')) DEFAULT 'pending',
  
  -- Token metadata
  token_name TEXT,
  token_symbol TEXT CHECK (token_symbol ~ '^[A-Z0-9]{1,11}$'),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case-insensitive unique constraint on token addresses
CREATE UNIQUE INDEX idx_deployed_contracts_audit_token_address_unique 
ON public.deployed_contracts_audit (UPPER(token_address));

-- Performance indexes
CREATE INDEX idx_deployed_contracts_audit_agent_id ON public.deployed_contracts_audit(agent_id);
CREATE INDEX idx_deployed_contracts_audit_deployment_tx_hash ON public.deployed_contracts_audit(deployment_tx_hash);
CREATE INDEX idx_deployed_contracts_audit_block_number ON public.deployed_contracts_audit(block_number);
CREATE INDEX idx_deployed_contracts_audit_chain_id ON public.deployed_contracts_audit(chain_id);

-- Partial indexes for pending verifications
CREATE INDEX idx_deployed_contracts_audit_pending_verification 
ON public.deployed_contracts_audit(created_at) 
WHERE verification_status = 'pending';

-- agent_chart_init: Track chart initialization for deployed tokens
CREATE TABLE public.agent_chart_init (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  token_address TEXT NOT NULL,
  initialized BOOLEAN NOT NULL DEFAULT false,
  initial_price NUMERIC(20,8),
  initial_supply NUMERIC(20,0),
  initialization_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_chart_init_agent_id ON public.agent_chart_init(agent_id);
CREATE INDEX idx_agent_chart_init_token_address ON public.agent_chart_init(token_address);

-- agent_realtime_updates: Event queue for realtime notifications
CREATE TABLE public.agent_realtime_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'token_deployed', 'token_verified', 'deployment_failed', 
    'graduation_triggered', 'liquidity_added', 'trade_executed', 
    'metrics_updated'
  )),
  event_data JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_realtime_updates_agent_id ON public.agent_realtime_updates(agent_id);
CREATE INDEX idx_agent_realtime_updates_event_type ON public.agent_realtime_updates(event_type);
CREATE INDEX idx_agent_realtime_updates_created_at ON public.agent_realtime_updates(created_at);

-- Partial index for unprocessed events
CREATE INDEX idx_agent_realtime_updates_unprocessed 
ON public.agent_realtime_updates(created_at) 
WHERE processed = false;

-- deployment_metrics: Performance monitoring for deployment operations
CREATE TABLE public.deployment_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deployment_id UUID REFERENCES public.deployed_contracts_audit(id),
  function_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  method_used TEXT,
  gas_used BIGINT,
  rpc_used TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_deployment_metrics_deployment_id ON public.deployment_metrics(deployment_id);
CREATE INDEX idx_deployment_metrics_function_name ON public.deployment_metrics(function_name);
CREATE INDEX idx_deployment_metrics_recorded_at ON public.deployment_metrics(recorded_at);
CREATE INDEX idx_deployment_metrics_success ON public.deployment_metrics(success);