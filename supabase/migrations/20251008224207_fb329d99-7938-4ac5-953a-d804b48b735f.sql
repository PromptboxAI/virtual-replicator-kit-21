-- Liquidity Summary RPC: Returns liquidity info (projected or actual) based on graduation status and mode
-- Corrected to use actual schema: prompt_raised (not prompt_raised_prompt), config from get_bonding_curve_config_v4()

CREATE OR REPLACE FUNCTION public.get_liquidity_summary(p_agent_id uuid)
RETURNS TABLE (
  agent_id uuid,
  creation_mode text,
  graduation_mode text,
  status text,           -- 'pre_grad' | 'post_grad'
  lp_percent text,       -- stringified percent (e.g. "70")
  source text,           -- 'actual' | 'projected'
  lp_prompt text,        -- PROMPT amount (string)
  lp_usd text,           -- USD valuation (string)
  lp_pair_symbol text,   -- only for actual, else null
  lp_pair_amount text,   -- only for actual, else null
  asof text,             -- ISO timestamp used for FX
  fx text                -- USD/PROMPT at 'asof'
)
LANGUAGE sql STABLE
AS $$
WITH config AS (
  SELECT lp_prompt_allocation_percent FROM get_bonding_curve_config_v4()
),
A AS (
  SELECT
    a.id,
    a.creation_mode,
    a.graduation_mode,
    a.prompt_raised,                        -- CORRECTED: use prompt_raised (not prompt_raised_prompt)
    (SELECT lp_prompt_allocation_percent FROM config) as lp_pct,  -- CORRECTED: from config function
    CASE
      WHEN COALESCE(a.token_graduated, false) THEN 'post_grad'
      ELSE 'pre_grad'
    END as status
  FROM agents a
  WHERE a.id = p_agent_id
),
G AS (
  SELECT
    e.agent_id,
    e.created_at,
    e.metadata->>'lp_prompt'      as lp_prompt_str,
    e.metadata->>'lp_pair_symbol' as lp_pair_symbol,
    e.metadata->>'lp_pair_amount' as lp_pair_amount_str,
    COALESCE((e.metadata->>'asof')::timestamptz, e.created_at) as asof
  FROM agent_graduation_events e
  WHERE e.agent_id = p_agent_id
  ORDER BY e.created_at DESC
  LIMIT 1
),
CHOICE AS (
  SELECT
    A.id as agent_id,
    A.creation_mode,
    A.graduation_mode,
    A.status,
    A.lp_pct,
    A.prompt_raised,
    CASE
      WHEN A.status = 'post_grad'
       AND A.graduation_mode = 'smart_contract'
       AND NULLIF(G.lp_prompt_str,'') IS NOT NULL
      THEN 'actual' ELSE 'projected'
    END as source,
    CASE
      WHEN A.status = 'post_grad'
       AND A.graduation_mode = 'smart_contract'
       AND NULLIF(G.lp_prompt_str,'') IS NOT NULL
      THEN (G.lp_prompt_str)::numeric
      ELSE (A.prompt_raised * (A.lp_pct/100.0))
    END as lp_prompt_num,
    CASE
      WHEN A.status = 'post_grad'
       AND A.graduation_mode = 'smart_contract'
      THEN G.lp_pair_symbol ELSE NULL END as lp_pair_symbol,
    CASE
      WHEN A.status = 'post_grad'
       AND A.graduation_mode = 'smart_contract'
       AND NULLIF(G.lp_pair_amount_str,'') IS NOT NULL
      THEN (G.lp_pair_amount_str)::numeric ELSE NULL END as lp_pair_amount_num,
    CASE
      WHEN A.status = 'post_grad'
       AND A.graduation_mode = 'smart_contract'
       AND NULLIF(G.lp_prompt_str,'') IS NOT NULL
      THEN G.asof ELSE NOW()
    END as asof_ts
  FROM A
  LEFT JOIN G ON true
),
FX AS (
  SELECT c.*, (SELECT fx FROM get_fx_asof(c.asof_ts)) as fx_rate
  FROM CHOICE c
)
SELECT
  agent_id,
  creation_mode,
  graduation_mode,
  status,
  lp_pct::text as lp_percent,
  source,
  lp_prompt_num::text as lp_prompt,
  (lp_prompt_num * COALESCE(fx_rate, 0))::text as lp_usd,
  lp_pair_symbol,
  lp_pair_amount_num::text as lp_pair_amount,
  TO_CHAR(asof_ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as asof,
  COALESCE(fx_rate, 0)::text as fx
FROM FX;
$$;

GRANT EXECUTE ON FUNCTION public.get_liquidity_summary(uuid) TO anon, authenticated;