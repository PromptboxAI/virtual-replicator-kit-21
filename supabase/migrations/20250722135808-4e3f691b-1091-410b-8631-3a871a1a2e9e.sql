-- This migration was already created in the previous message
-- The file 20250722012000-fix-ohlcv-volume-ambiguity.sql should already exist
-- Let me create a function to generate agent token addresses

-- Create function to generate deterministic token addresses for agents
CREATE OR REPLACE FUNCTION generate_agent_token_address(p_agent_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_address TEXT;
BEGIN
  -- Generate a deterministic address based on agent ID
  -- This is a placeholder - in production you'd deploy actual ERC20 contracts
  SELECT '0x' || SUBSTRING(REPLACE(p_agent_id::TEXT, '-', '') || '0000000000000000000000000000000000000000', 1, 40)
  INTO token_address;
  
  -- Update the agent with the generated address
  UPDATE agents 
  SET token_address = token_address
  WHERE id = p_agent_id;
  
  RETURN token_address;
END;
$$;