-- Fix security warning: Add search_path to evaluate_graduation function
CREATE OR REPLACE FUNCTION evaluate_graduation(p_agent_id UUID)
RETURNS TABLE(
  should_graduate BOOLEAN,
  met JSONB,
  policy_id UUID,
  policy_name TEXT,
  thresholds JSONB
) 
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
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