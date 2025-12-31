
-- Add UPDATE policy for agents table
-- Allow creators to update their own agents

-- Policy for updating agents: creators can update their own agents
CREATE POLICY "Creators can update their own agents" 
ON public.agents 
FOR UPDATE 
USING (creator_id = (SELECT auth.uid()::text) OR creator_id = (SELECT (auth.jwt() ->> 'sub')::text))
WITH CHECK (creator_id = (SELECT auth.uid()::text) OR creator_id = (SELECT (auth.jwt() ->> 'sub')::text));

-- Also add a policy for service role / anon key updates (for edge functions and initial setup)
-- This is needed because the initial update happens right after creation
CREATE POLICY "Allow update during deployment setup" 
ON public.agents 
FOR UPDATE 
USING (
  -- Allow update if agent was created in the last hour and has no token address yet
  (created_at > NOW() - INTERVAL '1 hour' AND token_address IS NULL)
  -- Or if it's still in ACTIVATING/deploying status
  OR status = 'ACTIVATING' 
  OR deployment_status = 'deploying'
);
