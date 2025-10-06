-- Phase 0: Graduation Policy Module
-- ========================================

-- 0.1: Create Graduation Policy Registry
CREATE TABLE IF NOT EXISTS graduation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  rules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ FIX: Enforce single default policy
CREATE UNIQUE INDEX IF NOT EXISTS uq_graduation_policies_default
  ON graduation_policies (is_default) WHERE is_default = true;

-- 0.2: Create Per-Agent Graduation State Table
CREATE TABLE IF NOT EXISTS agent_graduation (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pre_grad','graduated')),
  policy_id UUID REFERENCES graduation_policies(id),
  triggered_at TIMESTAMPTZ,
  reason TEXT,
  snapshot JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE graduation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_graduation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Graduation policies viewable by everyone"
  ON graduation_policies FOR SELECT USING (true);

CREATE POLICY "Graduation status viewable by everyone"
  ON agent_graduation FOR SELECT USING (true);

CREATE POLICY "Only system can modify graduation"
  ON agent_graduation FOR ALL USING (false);

-- 0.3: Create USD Raised View (buy trades only)
CREATE OR REPLACE VIEW agent_usd_raised AS
WITH buy_trades AS (
  SELECT 
    t.agent_id, 
    t.prompt_amount, 
    t.created_at,
    fx.fx_rate_usd
  FROM agent_token_buy_trades t
  JOIN LATERAL (
    SELECT fx_rate_usd 
    FROM prompt_fx
    WHERE asof <= t.created_at
    ORDER BY asof DESC 
    LIMIT 1
  ) fx ON true
)
SELECT
  agent_id,
  SUM(prompt_amount * fx_rate_usd) AS usd_raised_total,
  SUM(prompt_amount) AS prompt_raised_total
FROM buy_trades
GROUP BY agent_id;

GRANT SELECT ON agent_usd_raised TO authenticated, anon;

-- 0.4: Create Graduation Evaluation RPC
CREATE OR REPLACE FUNCTION evaluate_graduation(p_agent_id UUID)
RETURNS TABLE(
  should_graduate BOOLEAN,
  met JSONB,
  policy_id UUID,
  policy_name TEXT,
  thresholds JSONB
) LANGUAGE SQL STABLE AS $$
  WITH metrics AS (
    SELECT 
      a.id AS agent_id,
      COALESCE(r.usd_raised_total, 0) AS usd_raised_total,
      COALESCE(r.prompt_raised_total, 0) AS prompt_raised_total,
      COALESCE(a.bonding_curve_supply, 0) AS tokens_sold,
      COALESCE(m.price_usd, 0) AS price_usd,
      COALESCE(m.fdv_usd, 0) AS fdv_usd
    FROM agents a
    LEFT JOIN agent_usd_raised r ON r.agent_id = a.id
    LEFT JOIN agent_metrics_normalized m ON m.agent_id = a.id
    WHERE a.id = p_agent_id
  ),
  pol AS (
    SELECT id, name, rules
    FROM graduation_policies
    WHERE is_default = true
    LIMIT 1
  )
  SELECT
    false AS should_graduate,
    jsonb_build_object(
      'usd_raised_total', m.usd_raised_total,
      'prompt_raised_total', m.prompt_raised_total,
      'tokens_sold', m.tokens_sold,
      'price_usd', m.price_usd,
      'fdv_usd', m.fdv_usd
    ) AS met,
    pol.id AS policy_id,
    pol.name AS policy_name,
    pol.rules AS thresholds
  FROM metrics m, pol;
$$;

-- 0.5: Seed Default Policy (upsert by name)
INSERT INTO graduation_policies (name, is_default, rules)
VALUES (
  'DEFAULT_USD_RAISED_80K', 
  true,
  '{"logic":"ANY","rules":[{"metric":"usd_raised_total","op":">=","value":80000}]}'::JSONB
)
ON CONFLICT (name) DO UPDATE
  SET is_default = EXCLUDED.is_default, 
      rules = EXCLUDED.rules;

-- 0.6: Backfill existing agents to pre_grad
INSERT INTO agent_graduation (agent_id, status)
SELECT id, 'pre_grad' FROM agents
WHERE NOT EXISTS (
  SELECT 1 FROM agent_graduation WHERE agent_id = agents.id
);