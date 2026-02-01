-- ============================================
-- PHASE 1: PRODUCTION SECURITY FIXES
-- ============================================

-- 1. Enable RLS on trade tables (already have policies but let's ensure RLS is enabled)
ALTER TABLE agent_token_buy_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_token_sell_trades ENABLE ROW LEVEL SECURITY;

-- 2. Fix dangerous user_token_balances policy (allows users to modify their own balances)
-- First drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on token balances for external auth" ON user_token_balances;

-- Create proper policies: Users can only VIEW their balances
CREATE POLICY "Users can view their own token balances"
  ON user_token_balances
  FOR SELECT
  USING (true); -- Anyone can view for transparency

-- Service role manages all modifications (via edge functions)
CREATE POLICY "Service role can manage all token balances"
  ON user_token_balances
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Fix agent_token_holders - Remove dangerous UPDATE policy that lets users modify balances
DROP POLICY IF EXISTS "Users can update their own holdings" ON agent_token_holders;

-- Create proper policy: Only service role can modify holdings
CREATE POLICY "Service role can manage all holdings"
  ON agent_token_holders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Add validation trigger for user_id in agent_token_holders
-- This prevents invalid user IDs from being inserted
CREATE OR REPLACE FUNCTION public.validate_user_id_format()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that user_id looks like a valid identifier (not empty, reasonable length)
  IF NEW.user_id IS NULL OR LENGTH(NEW.user_id) < 10 OR LENGTH(NEW.user_id) > 100 THEN
    RAISE EXCEPTION 'Invalid user_id format: %', NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS validate_agent_token_holders_user ON agent_token_holders;
CREATE TRIGGER validate_agent_token_holders_user
  BEFORE INSERT ON agent_token_holders
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_id_format();

-- 5. Fix search_path on existing functions that need it
-- (These are the functions flagged by the linter for search_path issues)
-- Update update_updated_at_column to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6. Ensure deployed_contracts table has proper RLS
ALTER TABLE IF EXISTS deployed_contracts ENABLE ROW LEVEL SECURITY;

-- Anyone can view deployed contracts (they're public blockchain data)
DROP POLICY IF EXISTS "Anyone can view deployed contracts" ON deployed_contracts;
CREATE POLICY "Anyone can view deployed contracts"
  ON deployed_contracts
  FOR SELECT
  USING (true);

-- Only service role can insert/update (via edge functions)
DROP POLICY IF EXISTS "Service role can manage deployed contracts" ON deployed_contracts;
CREATE POLICY "Service role can manage deployed contracts"
  ON deployed_contracts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);