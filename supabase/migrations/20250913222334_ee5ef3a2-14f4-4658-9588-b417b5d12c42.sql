-- Update the update_admin_setting function to handle INSERT for new settings
CREATE OR REPLACE FUNCTION public.update_admin_setting(p_key text, p_value jsonb, p_changed_by text, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  old_value JSONB;
BEGIN
  -- Get old value for audit (if exists)
  SELECT value INTO old_value FROM public.admin_settings WHERE key = p_key;
  
  -- Insert or update setting
  INSERT INTO public.admin_settings (key, value, updated_by, updated_at)
  VALUES (p_key, p_value, p_changed_by, now())
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = p_value, 
    updated_at = now(), 
    updated_by = p_changed_by;
  
  -- Log the change
  INSERT INTO public.admin_audit_logs (setting_key, old_value, new_value, changed_by, change_reason)
  VALUES (p_key, old_value, p_value, p_changed_by, p_reason);
END;
$function$