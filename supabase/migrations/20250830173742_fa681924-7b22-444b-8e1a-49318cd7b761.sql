-- Phase 0: Safety & Groundwork Implementation
-- Create agent safety settings table
CREATE TABLE public.agent_safety_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  max_single_trade_prompt NUMERIC NOT NULL DEFAULT 1000,
  max_daily_trade_prompt NUMERIC NOT NULL DEFAULT 5000,
  max_user_daily_prompt NUMERIC NOT NULL DEFAULT 2000,
  trade_paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trade rejections log table
CREATE TABLE public.trade_rejections_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  rejection_reason TEXT NOT NULL,
  trade_amount NUMERIC NOT NULL,
  trade_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create migration audit table
CREATE TABLE public.migration_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  migration_phase TEXT NOT NULL,
  old_data JSONB NOT NULL,
  new_data JSONB NOT NULL,
  validation_results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on safety tables
ALTER TABLE public.agent_safety_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_rejections_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_safety_settings
CREATE POLICY "Safety settings are viewable by everyone" 
ON public.agent_safety_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify safety settings" 
ON public.agent_safety_settings 
FOR ALL 
USING (has_role((auth.uid())::text, 'admin'::app_role));

-- RLS policies for trade_rejections_log
CREATE POLICY "Trade rejections are viewable by everyone" 
ON public.trade_rejections_log 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can insert trade rejections" 
ON public.trade_rejections_log 
FOR INSERT 
WITH CHECK (false);

-- RLS policies for migration_audit
CREATE POLICY "Migration audit is viewable by everyone" 
ON public.migration_audit 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can insert migration audit records" 
ON public.migration_audit 
FOR INSERT 
WITH CHECK (false);

-- Add updated_at trigger for safety settings
CREATE TRIGGER update_agent_safety_settings_updated_at
  BEFORE UPDATE ON public.agent_safety_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced bonding curve configuration with safety parameters
CREATE OR REPLACE FUNCTION public.get_bonding_curve_config_v3()
RETURNS TABLE(
  initial_prompt_reserve NUMERIC,
  initial_token_reserve NUMERIC,
  total_supply NUMERIC,
  graduation_threshold NUMERIC,
  trading_fee_percent NUMERIC,
  -- Linear curve parameters
  curve_supply NUMERIC,
  lp_supply NUMERIC,
  p0 NUMERIC,
  p1 NUMERIC,
  -- Safety parameters
  max_single_trade_default NUMERIC,
  max_daily_trade_default NUMERIC,
  max_user_daily_default NUMERIC,
  -- LP parameters
  lp_prompt_allocation_percent NUMERIC,
  lp_lock_duration_days INTEGER
)
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT 
    -- Legacy AMM parameters (for existing agents)
    30000::NUMERIC as initial_prompt_reserve,
    1000000::NUMERIC as initial_token_reserve,
    1000000000::NUMERIC as total_supply,
    42000::NUMERIC as graduation_threshold,
    1::NUMERIC as trading_fee_percent,
    
    -- Linear curve parameters
    800000000::NUMERIC as curve_supply,     -- 800M tokens for curve
    200000000::NUMERIC as lp_supply,        -- 200M tokens for LP
    0.000001::NUMERIC as p0,                -- Starting price
    0.000104::NUMERIC as p1,                -- Ending price at graduation
    
    -- Safety parameters
    1000::NUMERIC as max_single_trade_default,
    5000::NUMERIC as max_daily_trade_default,
    2000::NUMERIC as max_user_daily_default,
    
    -- LP parameters
    70::NUMERIC as lp_prompt_allocation_percent,  -- 70% of raised PROMPT
    365::INTEGER as lp_lock_duration_days         -- 1 year lock
$function$;

-- Function to get agent safety settings with defaults
CREATE OR REPLACE FUNCTION public.get_agent_safety_settings(p_agent_id UUID)
RETURNS TABLE(
  max_single_trade_prompt NUMERIC,
  max_daily_trade_prompt NUMERIC,
  max_user_daily_prompt NUMERIC,
  trade_paused BOOLEAN
)
LANGUAGE plpgsql
AS $function$
DECLARE
  config RECORD;
BEGIN
  -- Get default config
  SELECT * INTO config FROM get_bonding_curve_config_v3();
  
  -- Return agent-specific settings or defaults
  RETURN QUERY
  SELECT 
    COALESCE(ass.max_single_trade_prompt, config.max_single_trade_default) as max_single_trade_prompt,
    COALESCE(ass.max_daily_trade_prompt, config.max_daily_trade_default) as max_daily_trade_prompt,
    COALESCE(ass.max_user_daily_prompt, config.max_user_daily_default) as max_user_daily_prompt,
    COALESCE(ass.trade_paused, false) as trade_paused
  FROM (SELECT 1) dummy
  LEFT JOIN public.agent_safety_settings ass ON ass.agent_id = p_agent_id;
END;
$function$;

-- Function to validate trade safety
CREATE OR REPLACE FUNCTION public.validate_trade_safety(
  p_agent_id UUID,
  p_user_id TEXT,
  p_prompt_amount NUMERIC,
  p_trade_type TEXT
)
RETURNS TABLE(
  is_valid BOOLEAN,
  rejection_reason TEXT
)
LANGUAGE plpgsql
AS $function$
DECLARE
  safety_settings RECORD;
  daily_agent_volume NUMERIC;
  daily_user_volume NUMERIC;
BEGIN
  -- Get safety settings
  SELECT * INTO safety_settings FROM get_agent_safety_settings(p_agent_id);
  
  -- Check if trading is paused
  IF safety_settings.trade_paused THEN
    RETURN QUERY SELECT false, 'Trading is temporarily paused for this agent';
    RETURN;
  END IF;
  
  -- Check single trade limit
  IF p_prompt_amount > safety_settings.max_single_trade_prompt THEN
    RETURN QUERY SELECT false, 
      'Trade amount (' || p_prompt_amount || ') exceeds maximum single trade limit (' || safety_settings.max_single_trade_prompt || ')';
    RETURN;
  END IF;
  
  -- Check daily agent volume
  SELECT COALESCE(SUM(prompt_amount), 0) INTO daily_agent_volume
  FROM (
    SELECT prompt_amount FROM agent_token_buy_trades 
    WHERE agent_id = p_agent_id AND created_at >= CURRENT_DATE
    UNION ALL
    SELECT prompt_amount FROM agent_token_sell_trades 
    WHERE agent_id = p_agent_id AND created_at >= CURRENT_DATE
  ) combined_trades;
  
  IF daily_agent_volume + p_prompt_amount > safety_settings.max_daily_trade_prompt THEN
    RETURN QUERY SELECT false, 
      'Daily agent volume limit exceeded. Current: ' || daily_agent_volume || ', Limit: ' || safety_settings.max_daily_trade_prompt;
    RETURN;
  END IF;
  
  -- Check daily user volume
  SELECT COALESCE(SUM(prompt_amount), 0) INTO daily_user_volume
  FROM (
    SELECT prompt_amount FROM agent_token_buy_trades 
    WHERE agent_id = p_agent_id AND user_id = p_user_id AND created_at >= CURRENT_DATE
    UNION ALL
    SELECT prompt_amount FROM agent_token_sell_trades 
    WHERE agent_id = p_agent_id AND user_id = p_user_id AND created_at >= CURRENT_DATE
  ) user_trades;
  
  IF daily_user_volume + p_prompt_amount > safety_settings.max_user_daily_prompt THEN
    RETURN QUERY SELECT false, 
      'Daily user volume limit exceeded. Current: ' || daily_user_volume || ', Limit: ' || safety_settings.max_user_daily_prompt;
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT true, NULL::TEXT;
END;
$function$;