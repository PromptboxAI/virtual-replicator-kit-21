-- V8 On-Chain Trading Schema Updates

-- 1. Add V8-specific columns to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS prototype_token_address TEXT,
ADD COLUMN IF NOT EXISTS final_token_address TEXT,
ADD COLUMN IF NOT EXISTS graduation_phase TEXT DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS airdrop_batches_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_chain_supply NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_chain_reserve NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS snapshot_block_number BIGINT,
ADD COLUMN IF NOT EXISTS snapshot_hash TEXT;

-- 2. Create on_chain_trades table for tracking trades
CREATE TABLE IF NOT EXISTS public.on_chain_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  transaction_hash TEXT NOT NULL UNIQUE,
  block_number BIGINT NOT NULL,
  trader_address TEXT NOT NULL,
  is_buy BOOLEAN NOT NULL,
  prompt_amount_gross NUMERIC NOT NULL,
  prompt_amount_net NUMERIC NOT NULL,
  token_amount NUMERIC NOT NULL,
  fee NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  supply_after NUMERIC NOT NULL,
  reserve_after NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_on_chain_trades_agent ON on_chain_trades(agent_id);
CREATE INDEX IF NOT EXISTS idx_on_chain_trades_trader ON on_chain_trades(trader_address);
CREATE INDEX IF NOT EXISTS idx_on_chain_trades_block ON on_chain_trades(block_number);

-- Enable RLS
ALTER TABLE public.on_chain_trades ENABLE ROW LEVEL SECURITY;

-- Public read access for on_chain_trades
CREATE POLICY "Anyone can view on_chain_trades"
ON public.on_chain_trades FOR SELECT
USING (true);

-- 3. Create indexed_holder_balances table (SOURCE OF TRUTH for graduation snapshots)
CREATE TABLE IF NOT EXISTS public.indexed_holder_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  token_balance NUMERIC NOT NULL DEFAULT 0,
  token_type TEXT NOT NULL CHECK (token_type IN ('prototype', 'final')),
  last_block_indexed BIGINT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, wallet_address, token_type)
);

CREATE INDEX IF NOT EXISTS idx_indexed_holders_agent ON indexed_holder_balances(agent_id);
CREATE INDEX IF NOT EXISTS idx_indexed_holders_wallet ON indexed_holder_balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_indexed_holders_type ON indexed_holder_balances(token_type);

-- Enable RLS
ALTER TABLE public.indexed_holder_balances ENABLE ROW LEVEL SECURITY;

-- Public read access for indexed_holder_balances
CREATE POLICY "Anyone can view indexed_holder_balances"
ON public.indexed_holder_balances FOR SELECT
USING (true);

-- 4. Create graduation_batches table for tracking airdrop batches
CREATE TABLE IF NOT EXISTS public.graduation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  batch_index INTEGER NOT NULL,
  transaction_hash TEXT NOT NULL,
  holders_count INTEGER NOT NULL,
  tokens_distributed NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graduation_batches_agent ON graduation_batches(agent_id);

-- Enable RLS
ALTER TABLE public.graduation_batches ENABLE ROW LEVEL SECURITY;

-- Public read access for graduation_batches
CREATE POLICY "Anyone can view graduation_batches"
ON public.graduation_batches FOR SELECT
USING (true);

-- 5. Create function for atomic balance updates (used by event indexer)
CREATE OR REPLACE FUNCTION update_indexed_balance(
  p_agent_id UUID,
  p_wallet TEXT,
  p_delta NUMERIC,
  p_block BIGINT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO indexed_holder_balances (agent_id, wallet_address, token_balance, token_type, last_block_indexed)
  VALUES (p_agent_id, LOWER(p_wallet), p_delta, 'prototype', p_block)
  ON CONFLICT (agent_id, wallet_address, token_type)
  DO UPDATE SET
    token_balance = indexed_holder_balances.token_balance + p_delta,
    last_block_indexed = GREATEST(indexed_holder_balances.last_block_indexed, p_block),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;