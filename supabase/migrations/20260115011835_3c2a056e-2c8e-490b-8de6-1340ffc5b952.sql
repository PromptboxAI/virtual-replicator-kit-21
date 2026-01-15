-- ============================================
-- Fix remaining Security Definer Views
-- ============================================

-- Drop and recreate agent_usd_raised with security_invoker
DROP VIEW IF EXISTS public.agent_usd_raised;

CREATE VIEW public.agent_usd_raised
WITH (security_invoker=on) AS
WITH buy_trades AS (
  SELECT t.agent_id,
    t.prompt_amount,
    t.created_at,
    fx.fx_rate_usd
  FROM agent_token_buy_trades t
  JOIN LATERAL (
    SELECT prompt_fx.fx_rate_usd
    FROM prompt_fx
    WHERE prompt_fx.asof <= t.created_at
    ORDER BY prompt_fx.asof DESC
    LIMIT 1
  ) fx ON true
)
SELECT agent_id,
  sum(prompt_amount * fx_rate_usd) AS usd_raised_total,
  sum(prompt_amount) AS prompt_raised_total
FROM buy_trades
GROUP BY agent_id;

-- Drop and recreate deployment_monitoring with security_invoker
DROP VIEW IF EXISTS public.deployment_monitoring;

CREATE VIEW public.deployment_monitoring
WITH (security_invoker=on) AS
SELECT date_trunc('hour'::text, recorded_at) AS hour,
  function_name,
  count(*) AS total_executions,
  count(*) FILTER (WHERE success = true) AS successful_executions,
  count(*) FILTER (WHERE success = false) AS failed_executions,
  round(avg(execution_time_ms), 2) AS avg_execution_time_ms,
  round(min(execution_time_ms)::numeric, 2) AS min_execution_time_ms,
  round(max(execution_time_ms)::numeric, 2) AS max_execution_time_ms,
  round((count(*) FILTER (WHERE success = true)::double precision / count(*)::double precision * 100::double precision)::numeric, 2) AS success_rate_percent
FROM deployment_metrics dm
WHERE recorded_at >= (now() - '7 days'::interval)
GROUP BY (date_trunc('hour'::text, recorded_at)), function_name
ORDER BY (date_trunc('hour'::text, recorded_at)) DESC, function_name;