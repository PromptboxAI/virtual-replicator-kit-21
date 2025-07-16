-- Drop existing RLS policies for agent_configurations that rely on auth.uid()
DROP POLICY IF EXISTS "Users can view their own agent configurations" ON agent_configurations;
DROP POLICY IF EXISTS "Users can create configurations for their own agents" ON agent_configurations;
DROP POLICY IF EXISTS "Users can update configurations for their own agents" ON agent_configurations;
DROP POLICY IF EXISTS "Users can delete configurations for their own agents" ON agent_configurations;

-- Create new RLS policies that work with external auth (Privy)
-- We'll rely on the application to ensure proper access control at the application layer
CREATE POLICY "Allow read access to agent configurations" 
ON agent_configurations FOR SELECT 
USING (true);

CREATE POLICY "Allow insert access to agent configurations" 
ON agent_configurations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update access to agent configurations" 
ON agent_configurations FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete access to agent configurations" 
ON agent_configurations FOR DELETE 
USING (true);