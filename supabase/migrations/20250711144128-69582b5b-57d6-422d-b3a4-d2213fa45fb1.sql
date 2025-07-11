-- Add token-related columns to agents table
ALTER TABLE agents 
ADD COLUMN token_address TEXT,
ADD COLUMN token_graduated BOOLEAN DEFAULT FALSE,
ADD COLUMN prompt_raised NUMERIC DEFAULT 0,
ADD COLUMN token_holders INTEGER DEFAULT 0,
ADD COLUMN bonding_curve_supply NUMERIC DEFAULT 0;

-- Create agent_token_transactions table for tracking buys/sells
CREATE TABLE agent_token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  prompt_amount NUMERIC NOT NULL,
  token_amount NUMERIC NOT NULL,
  price_per_token NUMERIC NOT NULL,
  transaction_hash TEXT,
  block_number BIGINT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create agent_token_holders table for tracking user holdings
CREATE TABLE agent_token_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  token_balance NUMERIC NOT NULL DEFAULT 0,
  average_buy_price NUMERIC DEFAULT 0,
  total_invested NUMERIC DEFAULT 0,
  realized_profit_loss NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agent_id, user_id)
);

-- Create agent_price_snapshots table for historical price tracking
CREATE TABLE agent_price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  market_cap NUMERIC,
  volume_24h NUMERIC DEFAULT 0,
  holders_count INTEGER DEFAULT 0,
  prompt_raised NUMERIC DEFAULT 0,
  circulating_supply NUMERIC DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE agent_token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_token_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_price_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_token_transactions
CREATE POLICY "Users can view their own transactions"
ON agent_token_transactions FOR SELECT
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own transactions"
ON agent_token_transactions FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Everyone can view transaction history"
ON agent_token_transactions FOR SELECT
USING (true);

-- RLS Policies for agent_token_holders
CREATE POLICY "Users can view their own holdings"
ON agent_token_holders FOR SELECT
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own holdings"
ON agent_token_holders FOR ALL
USING (user_id = auth.uid()::text);

CREATE POLICY "Everyone can view holder counts"
ON agent_token_holders FOR SELECT
USING (true);

-- RLS Policies for agent_price_snapshots
CREATE POLICY "Price snapshots are viewable by everyone"
ON agent_price_snapshots FOR SELECT
USING (true);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_agent_token_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_agent_token_transactions_updated_at
  BEFORE UPDATE ON agent_token_transactions
  FOR EACH ROW EXECUTE FUNCTION update_agent_token_updated_at();

CREATE TRIGGER update_agent_token_holders_updated_at
  BEFORE UPDATE ON agent_token_holders
  FOR EACH ROW EXECUTE FUNCTION update_agent_token_updated_at();