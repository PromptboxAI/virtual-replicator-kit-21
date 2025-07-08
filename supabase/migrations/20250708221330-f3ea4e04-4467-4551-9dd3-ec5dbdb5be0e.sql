-- Step 2: Change user_id columns from UUID to TEXT

-- First, drop any remaining foreign key constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.user_agent_holdings DROP CONSTRAINT IF EXISTS user_agent_holdings_user_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.user_follows DROP CONSTRAINT IF EXISTS user_follows_follower_id_fkey;
ALTER TABLE public.user_follows DROP CONSTRAINT IF EXISTS user_follows_following_id_fkey;

-- Change user_id column types from UUID to TEXT
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_agent_holdings ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.transactions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_follows ALTER COLUMN follower_id TYPE TEXT;
ALTER TABLE public.user_follows ALTER COLUMN following_id TYPE TEXT;