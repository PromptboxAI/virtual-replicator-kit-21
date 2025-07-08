-- Step 1: Drop all RLS policies that use user_id columns

-- Drop policies on profiles table
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Drop policies on user_agent_holdings table  
DROP POLICY IF EXISTS "Users can view their own holdings" ON public.user_agent_holdings;
DROP POLICY IF EXISTS "Users can update their own holdings" ON public.user_agent_holdings;
DROP POLICY IF EXISTS "Users can insert their own holdings" ON public.user_agent_holdings;

-- Drop policies on transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;

-- Drop policies on user_follows table
DROP POLICY IF EXISTS "Users can manage their own follows" ON public.user_follows;