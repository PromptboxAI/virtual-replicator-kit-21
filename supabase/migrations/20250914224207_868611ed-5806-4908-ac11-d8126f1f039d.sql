-- Fix RLS policies for admin_settings table
-- The issue is that the client query is returning empty array despite data existing
-- Let's ensure the read policy is properly configured

DROP POLICY IF EXISTS "Everyone can read admin settings" ON public.admin_settings;

-- Create a more explicit read policy
CREATE POLICY "Anyone can read admin settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Also check that RLS is enabled (it should be)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;