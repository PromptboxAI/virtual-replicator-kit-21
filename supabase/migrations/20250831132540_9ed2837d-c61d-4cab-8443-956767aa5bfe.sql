-- Phase 4: Infrastructure Setup - Add pricing_model column and activate safety infrastructure

-- Add pricing_model column to agents table for feature flagging
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'legacy_amm';

-- Add safety and migration tracking columns
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS migration_validated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS migration_completed_at timestamp with time zone;

-- Create migration state tracking table
CREATE TABLE IF NOT EXISTS public.agent_migration_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id),
  migration_phase text NOT NULL DEFAULT 'pending',
  old_price numeric,
  new_price numeric,
  old_supply numeric,
  new_supply numeric,
  validation_passed boolean DEFAULT false,
  migration_started_at timestamp with time zone DEFAULT now(),
  migration_completed_at timestamp with time zone,
  rollback_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on migration state
ALTER TABLE public.agent_migration_state ENABLE ROW LEVEL SECURITY;

-- Create policies for migration state
CREATE POLICY "Migration state is viewable by everyone" 
ON public.agent_migration_state 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can manage migration state" 
ON public.agent_migration_state 
FOR ALL 
USING (false);

-- Activate safety settings for all existing agents
INSERT INTO public.agent_safety_settings (agent_id, max_single_trade_prompt, max_daily_trade_prompt, max_user_daily_prompt, trade_paused)
SELECT 
  id,
  1000::numeric as max_single_trade_prompt,
  5000::numeric as max_daily_trade_prompt, 
  2000::numeric as max_user_daily_prompt,
  false as trade_paused
FROM public.agents 
WHERE id NOT IN (SELECT agent_id FROM public.agent_safety_settings WHERE agent_id IS NOT NULL);

-- Add migration control functions
CREATE OR REPLACE FUNCTION public.validate_agent_migration(p_agent_id uuid)
RETURNS TABLE(is_valid boolean, validation_errors text[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  agent_record RECORD;
  validation_errors text[] := ARRAY[]::text[];
  config RECORD;
BEGIN
  -- Get agent data
  SELECT * INTO agent_record FROM public.agents WHERE id = p_agent_id;
  
  IF NOT FOUND THEN
    validation_errors := array_append(validation_errors, 'Agent not found');
    RETURN QUERY SELECT false, validation_errors;
    RETURN;
  END IF;
  
  -- Get config
  SELECT * INTO config FROM public.get_bonding_curve_config_v3();
  
  -- Validate agent is not already graduated
  IF agent_record.token_graduated = true THEN
    validation_errors := array_append(validation_errors, 'Agent already graduated');
  END IF;
  
  -- Validate prompt_raised is valid
  IF agent_record.prompt_raised < 0 THEN
    validation_errors := array_append(validation_errors, 'Invalid prompt_raised amount');
  END IF;
  
  -- Validate current_price makes sense
  IF agent_record.current_price <= 0 THEN
    validation_errors := array_append(validation_errors, 'Invalid current_price');
  END IF;
  
  RETURN QUERY SELECT array_length(validation_errors, 1) = 0, validation_errors;
END;
$function$;

-- Add dry-run migration function
CREATE OR REPLACE FUNCTION public.dry_run_agent_migration(p_agent_id uuid)
RETURNS TABLE(
  agent_id uuid,
  current_pricing_model text,
  current_prompt_raised numeric,
  current_price numeric,
  current_supply numeric,
  new_price numeric,
  new_supply numeric,
  price_change_percent numeric,
  validation_passed boolean,
  validation_errors text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  agent_record RECORD;
  new_calculated_supply numeric;
  new_calculated_price numeric;
  price_change_pct numeric;
  validation_result RECORD;
  config RECORD;
BEGIN
  -- Get agent data
  SELECT * INTO agent_record FROM public.agents WHERE id = p_agent_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get config
  SELECT * INTO config FROM public.get_bonding_curve_config_v3();
  
  -- Calculate new supply using V3 inverse formula
  -- For linear curve: prompt_raised = integral of price from 0 to s
  -- prompt_raised = p0*s + 0.5*m*s^2, where m = (p1-p0)/curve_supply
  -- Solve quadratic: 0.5*m*s^2 + p0*s - prompt_raised = 0
  
  IF config.curve_supply > 0 AND config.p1 != config.p0 THEN
    DECLARE
      slope_m numeric := (config.p1 - config.p0) / config.curve_supply;
      qa numeric := 0.5 * slope_m;
      qb numeric := config.p0;
      qc numeric := -agent_record.prompt_raised;
      discriminant numeric := qb*qb - 4*qa*qc;
    BEGIN
      IF discriminant >= 0 AND qa != 0 THEN
        new_calculated_supply := (-qb + sqrt(discriminant)) / (2*qa);
      ELSE
        new_calculated_supply := agent_record.prompt_raised / config.p0;
      END IF;
    END;
  ELSE
    new_calculated_supply := agent_record.prompt_raised / config.p0;
  END IF;
  
  -- Calculate new price using V3 formula
  IF config.curve_supply > 0 THEN
    new_calculated_price := config.p0 + ((config.p1 - config.p0) * new_calculated_supply / config.curve_supply);
  ELSE
    new_calculated_price := config.p0;
  END IF;
  
  -- Calculate price change percentage
  IF agent_record.current_price > 0 THEN
    price_change_pct := ABS((new_calculated_price - agent_record.current_price) / agent_record.current_price) * 100;
  ELSE
    price_change_pct := 0;
  END IF;
  
  -- Run validation
  SELECT * INTO validation_result FROM public.validate_agent_migration(p_agent_id);
  
  RETURN QUERY SELECT
    p_agent_id,
    COALESCE(agent_record.pricing_model, 'legacy_amm'),
    agent_record.prompt_raised,
    agent_record.current_price,
    COALESCE(agent_record.bonding_curve_supply, 0),
    new_calculated_price,
    new_calculated_supply,
    price_change_pct,
    validation_result.is_valid,
    validation_result.validation_errors;
END;
$function$;

-- Add rollback function
CREATE OR REPLACE FUNCTION public.rollback_agent_migration(p_agent_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  migration_record RECORD;
  rollback_data jsonb;
BEGIN
  -- Get latest migration record
  SELECT * INTO migration_record 
  FROM public.agent_migration_state 
  WHERE agent_id = p_agent_id 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No migration record found');
  END IF;
  
  rollback_data := migration_record.rollback_data;
  
  -- Restore agent to previous state
  UPDATE public.agents 
  SET 
    pricing_model = COALESCE(rollback_data->>'pricing_model', 'legacy_amm'),
    current_price = COALESCE((rollback_data->>'current_price')::numeric, current_price),
    bonding_curve_supply = COALESCE((rollback_data->>'bonding_curve_supply')::numeric, bonding_curve_supply),
    migration_validated = false,
    migration_completed_at = null,
    updated_at = now()
  WHERE id = p_agent_id;
  
  -- Mark migration as rolled back
  UPDATE public.agent_migration_state 
  SET 
    migration_phase = 'rolled_back',
    updated_at = now()
  WHERE id = migration_record.id;
  
  RETURN json_build_object(
    'success', true,
    'agent_id', p_agent_id,
    'rollback_data', rollback_data
  );
END;
$function$;