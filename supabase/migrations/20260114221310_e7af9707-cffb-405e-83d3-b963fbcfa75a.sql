-- Fix profiles table security vulnerability
-- The profiles table contains sensitive data (Twitter OAuth tokens, wallet addresses, portfolio values)
-- that is currently publicly accessible due to overly permissive RLS policies.

-- Step 1: Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on profiles for now" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Step 2: Create a public view that excludes sensitive fields
-- This view can be used by edge functions and public queries to get display information
-- without exposing OAuth tokens and other sensitive data
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  username,
  display_name,
  avatar_url,
  bio,
  wallet_address,
  ens_name,
  twitter_username,
  twitter_display_name,
  twitter_avatar_url,
  created_at
FROM public.profiles;

-- Step 3: Create secure RLS policies for the base profiles table

-- Users can view their own profile (full access including sensitive fields)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.jwt() ->> 'sub'));

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.jwt() ->> 'sub'))
WITH CHECK (user_id = (SELECT auth.jwt() ->> 'sub'));

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.jwt() ->> 'sub'));

-- Service role can do everything (for edge functions)
-- Note: service_role bypasses RLS by default, but this is explicit documentation
CREATE POLICY "Service role has full access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 4: Grant appropriate permissions on the view
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.profiles_public IS 'Public view of profiles excluding sensitive data like OAuth tokens. Use this for displaying user info in comments, trades, etc.';
COMMENT ON TABLE public.profiles IS 'User profiles containing sensitive data. Direct access restricted to own profile only. Edge functions use service_role to access other profiles when needed.';