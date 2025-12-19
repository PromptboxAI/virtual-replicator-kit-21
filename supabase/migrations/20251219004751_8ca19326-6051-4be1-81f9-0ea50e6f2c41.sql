-- ============================================ --
-- Bonding Curve V6.1 Database Schema --
-- ============================================ --

-- 1. Add new columns to agents table
ALTER TABLE agents 
  ADD COLUMN IF NOT EXISTS token_contract_address TEXT,
  ADD COLUMN IF NOT EXISTS bonding_curve_phase TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS shares_sold NUMERIC DEFAULT 0;

-- 2. Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_agents_token_address ON agents(token_contract_address);
CREATE INDEX IF NOT EXISTS idx_agents_phase ON agents(bonding_curve_phase);

-- 3. Create database positions table (pre-graduation trading)
CREATE TABLE IF NOT EXISTS agent_database_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  holder_address TEXT NOT NULL,
  token_balance NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, holder_address)
);

CREATE INDEX IF NOT EXISTS idx_database_positions_agent ON agent_database_positions(agent_id);
CREATE INDEX IF NOT EXISTS idx_database_positions_holder ON agent_database_positions(holder_address);

-- Enable RLS on agent_database_positions
ALTER TABLE agent_database_positions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view positions (public data)
CREATE POLICY "Anyone can view database positions"
  ON agent_database_positions FOR SELECT
  USING (true);

-- Policy: Only system can insert/update positions (via edge functions with service role)
CREATE POLICY "Service role can manage positions"
  ON agent_database_positions FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Create holder rewards table (5% allocation)
CREATE TABLE IF NOT EXISTS agent_holder_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  holder_address TEXT NOT NULL,
  total_reward_amount NUMERIC NOT NULL,
  claimed_amount NUMERIC DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  vest_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, holder_address)
);

CREATE INDEX IF NOT EXISTS idx_holder_rewards_agent ON agent_holder_rewards(agent_id);
CREATE INDEX IF NOT EXISTS idx_holder_rewards_holder ON agent_holder_rewards(holder_address);

-- Enable RLS on agent_holder_rewards
ALTER TABLE agent_holder_rewards ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view rewards (public data)
CREATE POLICY "Anyone can view holder rewards"
  ON agent_holder_rewards FOR SELECT
  USING (true);

-- Policy: Only system can manage rewards
CREATE POLICY "Service role can manage rewards"
  ON agent_holder_rewards FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Create team vesting table (10% allocation)
CREATE TABLE IF NOT EXISTS agent_team_vesting (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  beneficiary_address TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  claimed_amount NUMERIC DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  cliff_1_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 3 months
  cliff_2_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 6 months
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on agent_team_vesting
ALTER TABLE agent_team_vesting ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view vesting (public data)
CREATE POLICY "Anyone can view team vesting"
  ON agent_team_vesting FOR SELECT
  USING (true);

-- Policy: Only system can manage vesting
CREATE POLICY "Service role can manage vesting"
  ON agent_team_vesting FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Create LP info table
CREATE TABLE IF NOT EXISTS agent_lp_info (
  agent_id UUID PRIMARY KEY REFERENCES agents(id),
  lp_pair_address TEXT NOT NULL,
  total_lp_tokens NUMERIC NOT NULL,
  lp_locked NUMERIC NOT NULL,
  lp_to_vault NUMERIC NOT NULL,
  lock_id INTEGER NOT NULL,
  unlock_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on agent_lp_info
ALTER TABLE agent_lp_info ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view LP info (public data)
CREATE POLICY "Anyone can view LP info"
  ON agent_lp_info FOR SELECT
  USING (true);

-- Policy: Only system can manage LP info
CREATE POLICY "Service role can manage LP info"
  ON agent_lp_info FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE agent_database_positions IS 'Tracks database positions pre-graduation (shares, not real tokens)';
COMMENT ON TABLE agent_holder_rewards IS 'Stores 5% holder rewards with 1-month vesting';
COMMENT ON TABLE agent_team_vesting IS 'Stores 10% team allocation with cliff vesting (3mo/6mo)';
COMMENT ON TABLE agent_lp_info IS 'Stores LP creation details after agent graduation';
COMMENT ON COLUMN agents.token_contract_address IS 'On-chain ERC-20 token address (set at graduation)';
COMMENT ON COLUMN agents.bonding_curve_phase IS 'active = pre-graduation, graduated = post-graduation';
COMMENT ON COLUMN agents.shares_sold IS 'Total database shares sold pre-graduation';