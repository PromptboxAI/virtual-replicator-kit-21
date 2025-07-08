-- Step 2b: Drop all triggers and constraints that might cause issues

-- Drop triggers that use updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_user_agent_holdings_updated_at ON public.user_agent_holdings;

-- Drop unique constraints that might cause issues
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
ALTER TABLE public.user_follows DROP CONSTRAINT IF EXISTS user_follows_follower_id_following_id_key;

-- Drop check constraints
ALTER TABLE public.user_follows DROP CONSTRAINT IF EXISTS user_follows_check;