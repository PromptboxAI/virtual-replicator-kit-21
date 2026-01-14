-- Fix agent_runtime_status RLS Policy
-- The current policy blocks ALL operations including service role inserts

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Only system can modify runtime status" ON public.agent_runtime_status;

-- Allow service role (edge functions) to manage all runtime status
CREATE POLICY "Service role can manage runtime status"
ON public.agent_runtime_status
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view their own agents' runtime status
CREATE POLICY "Users can view their agents runtime status"
ON public.agent_runtime_status
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents a 
    WHERE a.id = agent_id 
    AND a.creator_id = auth.uid()::text
  )
);

-- Allow public read access for runtime status (needed for agent pages)
CREATE POLICY "Public can view runtime status"
ON public.agent_runtime_status
FOR SELECT
TO anon
USING (true);