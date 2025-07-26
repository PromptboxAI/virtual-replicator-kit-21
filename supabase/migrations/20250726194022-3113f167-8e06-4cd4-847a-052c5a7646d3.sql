-- Fix the RLS policy for deployed_contracts to allow system operations
DROP POLICY IF EXISTS "Only system can manage deployed contracts" ON public.deployed_contracts;

-- Create a new policy that allows insertions for contract deployment
CREATE POLICY "System can insert deployed contracts" 
ON public.deployed_contracts 
FOR INSERT 
WITH CHECK (true);

-- Keep the viewing policy as is
-- The existing "Deployed contracts are viewable by everyone" policy is fine