-- Migration: Update gas fields to NUMERIC for overflow protection
-- This prevents overflow issues when gas_used * gas_price exceeds BIGINT limits

-- 1. Drop the generated column first (can't alter type of generated columns)
ALTER TABLE public.deployed_contracts_audit
DROP COLUMN deployment_cost_wei;

-- 2. Update deployed_contracts_audit gas fields to NUMERIC
ALTER TABLE public.deployed_contracts_audit
  ALTER COLUMN gas_used TYPE NUMERIC(78,0),
  ALTER COLUMN effective_gas_price TYPE NUMERIC(78,0);

-- 3. Re-add the generated column with NUMERIC type
ALTER TABLE public.deployed_contracts_audit
ADD COLUMN deployment_cost_wei NUMERIC(78,0)
GENERATED ALWAYS AS (gas_used * effective_gas_price) STORED;

-- 4. Update deployment_metrics gas field
ALTER TABLE public.deployment_metrics
  ALTER COLUMN gas_used TYPE NUMERIC(78,0);

-- 5. Update the calculate_deployment_cost_usd function to handle NUMERIC
DROP FUNCTION IF EXISTS public.calculate_deployment_cost_usd(BIGINT, BIGINT, NUMERIC);

CREATE OR REPLACE FUNCTION public.calculate_deployment_cost_usd(
  gas_used_param NUMERIC(78,0),
  gas_price_param NUMERIC(78,0),
  eth_price_usd_param NUMERIC DEFAULT 2000.00
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Convert wei to ETH, then to USD
  RETURN ROUND(
    (gas_used_param * gas_price_param) / POWER(10::NUMERIC, 18) * eth_price_usd_param,
    4
  );
END;
$$;

-- Add comments explaining why NUMERIC is used
COMMENT ON COLUMN public.deployed_contracts_audit.gas_used IS 'NUMERIC(78,0) to prevent overflow with high gas prices (max wei value)';
COMMENT ON COLUMN public.deployed_contracts_audit.effective_gas_price IS 'NUMERIC(78,0) to handle extreme gas price scenarios';
COMMENT ON COLUMN public.deployed_contracts_audit.deployment_cost_wei IS 'NUMERIC(78,0) generated column: gas_used * effective_gas_price';
COMMENT ON COLUMN public.deployment_metrics.gas_used IS 'NUMERIC(78,0) to prevent overflow with high gas prices';

-- Verification query to check the change
-- Expected result: All should show numeric with precision 78
SELECT
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name IN ('deployed_contracts_audit', 'deployment_metrics')
  AND column_name IN ('gas_used', 'effective_gas_price', 'deployment_cost_wei')
ORDER BY table_name, column_name;