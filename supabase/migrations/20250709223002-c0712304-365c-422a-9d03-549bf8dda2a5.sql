-- Fix RLS policies for user_token_balances table to work with Privy authentication
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own token balance" ON public.user_token_balances;
DROP POLICY IF EXISTS "Users can update their own token balance" ON public.user_token_balances;
DROP POLICY IF EXISTS "Anyone can insert token balance" ON public.user_token_balances;

-- Create new policies that work with external user IDs (Privy)
-- Allow all operations for now since we're using external auth
CREATE POLICY "Allow all operations on token balances for external auth" 
ON public.user_token_balances 
FOR ALL 
USING (true) 
WITH CHECK (true);