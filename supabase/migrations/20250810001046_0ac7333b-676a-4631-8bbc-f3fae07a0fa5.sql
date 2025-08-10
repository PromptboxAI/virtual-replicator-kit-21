-- Phase 3: Monitoring Views, Functions and Triggers

-- Create deployment monitoring view with hourly aggregations
CREATE VIEW public.deployment_monitoring AS
SELECT 
  DATE_TRUNC('hour', dm.recorded_at) as hour,
  dm.function_name,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE dm.success = true) as successful_executions,
  COUNT(*) FILTER (WHERE dm.success = false) as failed_executions,
  ROUND(AVG(dm.execution_time_ms)::numeric, 2) as avg_execution_time_ms,
  ROUND(MIN(dm.execution_time_ms)::numeric, 2) as min_execution_time_ms,
  ROUND(MAX(dm.execution_time_ms)::numeric, 2) as max_execution_time_ms,
  ROUND((COUNT(*) FILTER (WHERE dm.success = true)::float / COUNT(*) * 100)::numeric, 2) as success_rate_percent
FROM public.deployment_metrics dm
WHERE dm.recorded_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', dm.recorded_at), dm.function_name
ORDER BY hour DESC, function_name;

-- Function to verify pending deployments (security definer for system operations)
CREATE OR REPLACE FUNCTION public.verify_pending_deployments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  -- Count pending verifications
  SELECT COUNT(*) INTO pending_count
  FROM public.deployed_contracts_audit
  WHERE verification_status = 'pending'
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- This function would be called by edge functions to trigger verification
  -- The actual verification logic would be in the edge function
  RETURN pending_count;
END;
$$;

-- Function to calculate deployment cost in USD (helper for cost tracking)
CREATE OR REPLACE FUNCTION public.calculate_deployment_cost_usd(
  gas_used_param BIGINT,
  gas_price_param BIGINT,
  eth_price_usd_param NUMERIC DEFAULT 2000.00
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Convert wei to ETH, then to USD
  -- gas_used * gas_price = total_wei
  -- total_wei / 10^18 = ETH
  -- ETH * eth_price = USD
  RETURN ROUND(
    (gas_used_param * gas_price_param)::NUMERIC / POWER(10, 18) * eth_price_usd_param,
    4
  );
END;
$$;

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_deployment_audit_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add triggers for timestamp updates
CREATE TRIGGER update_deployed_contracts_audit_updated_at
  BEFORE UPDATE ON public.deployed_contracts_audit
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deployment_audit_timestamp();

CREATE TRIGGER update_agent_chart_init_updated_at
  BEFORE UPDATE ON public.agent_chart_init
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.deployed_contracts_audit IS 'Immutable audit trail for all contract deployments with comprehensive tracking';
COMMENT ON TABLE public.agent_chart_init IS 'Track chart initialization status for deployed agent tokens';
COMMENT ON TABLE public.agent_realtime_updates IS 'Event queue for realtime notifications and updates';
COMMENT ON TABLE public.deployment_metrics IS 'Performance monitoring and analytics for deployment operations';

COMMENT ON COLUMN public.deployed_contracts_audit.deployment_cost_wei IS 'Calculated field: gas_used * effective_gas_price';
COMMENT ON COLUMN public.deployed_contracts_audit.token_symbol IS 'Must be 1-11 uppercase alphanumeric characters';
COMMENT ON COLUMN public.deployed_contracts_audit.verification_status IS 'Tracks bytecode verification status';

-- Enable realtime for agent_realtime_updates table
ALTER TABLE public.agent_realtime_updates REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_realtime_updates;