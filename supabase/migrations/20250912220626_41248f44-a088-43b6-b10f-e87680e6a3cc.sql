-- Create admin settings table for centralized system configuration
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by TEXT -- User ID who last updated this setting
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Only admins can manage admin settings"
ON public.admin_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role))
WITH CHECK (has_role(auth.uid()::text, 'admin'::app_role));

-- Everyone can read settings (for UI display)
CREATE POLICY "Everyone can read admin settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (true);

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value, description) VALUES
('deployment_mode', '"database"'::jsonb, 'Global deployment mode: database or smart_contract'),
('allowed_lock_durations', '[15, 60, 240]'::jsonb, 'Allowed MEV lock durations in minutes'),
('allowed_frameworks', '["PROMPT", "Eliza", "LangChain", "Custom"]'::jsonb, 'Whitelisted frameworks for agent creation'),
('max_prebuy_amount', '5000'::jsonb, 'Maximum prebuy amount in PROMPT tokens'),
('creation_fee', '100'::jsonb, 'Agent creation fee in PROMPT tokens'),
('test_mode_enabled', 'true'::jsonb, 'Whether test mode is globally enabled'),
('trading_fee_percent', '1'::jsonb, 'Trading fee percentage'),
('graduation_threshold', '42000'::jsonb, 'PROMPT threshold for agent graduation'),
('mev_protection_enabled', 'true'::jsonb, 'Whether MEV protection features are enabled'),
('emergency_pause', 'false'::jsonb, 'Emergency pause for all agent creation');

-- Create audit table for admin setting changes
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  changed_by TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid()::text, 'admin'::app_role));

-- Function to update admin settings with audit trail
CREATE OR REPLACE FUNCTION public.update_admin_setting(
  p_key TEXT,
  p_value JSONB,
  p_changed_by TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  old_value JSONB;
BEGIN
  -- Get old value for audit
  SELECT value INTO old_value FROM public.admin_settings WHERE key = p_key;
  
  -- Update setting
  UPDATE public.admin_settings 
  SET value = p_value, updated_at = now(), updated_by = p_changed_by
  WHERE key = p_key;
  
  -- Log the change
  INSERT INTO public.admin_audit_logs (setting_key, old_value, new_value, changed_by, change_reason)
  VALUES (p_key, old_value, p_value, p_changed_by, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin setting value
CREATE OR REPLACE FUNCTION public.get_admin_setting(p_key TEXT)
RETURNS JSONB AS $$
BEGIN
  RETURN (SELECT value FROM public.admin_settings WHERE key = p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update timestamps
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();