-- Phase 1: Add missing V8 columns to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS lp_pair_address TEXT,
ADD COLUMN IF NOT EXISTS airdrop_batches_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_chain_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_v8 BOOLEAN DEFAULT false;

-- Create indexes for V8 queries
CREATE INDEX IF NOT EXISTS idx_agents_v8 ON agents(is_v8) WHERE is_v8 = true;
CREATE INDEX IF NOT EXISTS idx_agents_graduation_phase ON agents(graduation_phase);

-- Add block_timestamp column to on_chain_trades (required for OHLC)
ALTER TABLE public.on_chain_trades
ADD COLUMN IF NOT EXISTS block_timestamp TIMESTAMPTZ;

-- Phase 1.5: Create event_indexer_state table for tracking indexed blocks
CREATE TABLE IF NOT EXISTS public.event_indexer_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT NOT NULL,
  event_type TEXT NOT NULL,
  last_block_indexed BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_address, event_type)
);

-- Enable RLS on event_indexer_state
ALTER TABLE public.event_indexer_state ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role can manage event_indexer_state"
ON public.event_indexer_state
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_indexer_state_lookup 
ON public.event_indexer_state(contract_address, event_type);

-- Add indexes on on_chain_trades
CREATE INDEX IF NOT EXISTS idx_on_chain_trades_agent ON public.on_chain_trades(agent_id);
CREATE INDEX IF NOT EXISTS idx_on_chain_trades_trader ON public.on_chain_trades(trader_address);
CREATE INDEX IF NOT EXISTS idx_on_chain_trades_block ON public.on_chain_trades(block_number);
CREATE INDEX IF NOT EXISTS idx_on_chain_trades_block_timestamp ON public.on_chain_trades(block_timestamp);

-- Add indexes on indexed_holder_balances
CREATE INDEX IF NOT EXISTS idx_indexed_holders_agent ON public.indexed_holder_balances(agent_id);
CREATE INDEX IF NOT EXISTS idx_indexed_holders_wallet ON public.indexed_holder_balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_indexed_holders_positive ON public.indexed_holder_balances(agent_id, token_type)
  WHERE token_balance > 0;