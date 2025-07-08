-- Update profiles table to use TEXT for user_id instead of UUID
-- This allows Privy's DID format: "did:privy:cmcv31k3o029jjs0mgixqhmvz"

-- First, drop the foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Change user_id column type from UUID to TEXT
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;

-- Update other tables that reference user_id to also use TEXT
ALTER TABLE public.user_agent_holdings DROP CONSTRAINT IF EXISTS user_agent_holdings_user_id_fkey;
ALTER TABLE public.user_agent_holdings ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.transactions ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE public.user_follows DROP CONSTRAINT IF EXISTS user_follows_follower_id_fkey;
ALTER TABLE public.user_follows DROP CONSTRAINT IF EXISTS user_follows_following_id_fkey;
ALTER TABLE public.user_follows ALTER COLUMN follower_id TYPE TEXT;
ALTER TABLE public.user_follows ALTER COLUMN following_id TYPE TEXT;

-- Update the trigger function to handle the new user_id format
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Note: Since we're using Privy instead of Supabase auth, we don't need the auth trigger anymore