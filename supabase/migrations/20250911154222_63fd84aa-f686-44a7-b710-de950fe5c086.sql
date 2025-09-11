-- Fix default for new agents to use V3
ALTER TABLE public.agents
ALTER COLUMN pricing_model SET DEFAULT 'linear_v3';

-- Fix recently created agents that got wrong default
UPDATE public.agents
SET
  pricing_model = 'linear_v3',
  bonding_curve_supply = COALESCE(bonding_curve_supply, 0),
  migration_validated = true
WHERE
  created_at > NOW() - INTERVAL '7 days'
  AND pricing_model = 'legacy_amm'
  AND prompt_raised = 0;  -- Only fix agents that haven't traded yet

-- Add comment for clarity
COMMENT ON COLUMN public.agents.pricing_model IS 'Pricing model: linear_v3 (new standard) or legacy_amm (old quadratic)';