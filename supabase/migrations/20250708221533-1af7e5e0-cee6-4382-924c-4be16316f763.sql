-- Step 5: Create simple RLS policies for development
-- Since we're using Privy auth, we'll create permissive policies for now
-- In production, you'd integrate Privy JWTs with Supabase RLS

-- Policies for user_agent_holdings
CREATE POLICY "Allow all operations on holdings for now" 
ON public.user_agent_holdings FOR ALL USING (true) WITH CHECK (true);

-- Policies for transactions  
CREATE POLICY "Allow all operations on transactions for now" 
ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- Policies for user_follows
CREATE POLICY "Allow all operations on follows for now" 
ON public.user_follows FOR ALL USING (true) WITH CHECK (true);

-- Update profiles policies to be permissive for development
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Allow all operations on profiles for now" 
ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Recreate indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);
CREATE INDEX idx_user_agent_holdings_user_id ON public.user_agent_holdings(user_id);
CREATE INDEX idx_user_agent_holdings_agent_id ON public.user_agent_holdings(agent_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_agent_id ON public.transactions(agent_id);
CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);

-- Recreate triggers
CREATE TRIGGER update_user_agent_holdings_updated_at
BEFORE UPDATE ON public.user_agent_holdings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();