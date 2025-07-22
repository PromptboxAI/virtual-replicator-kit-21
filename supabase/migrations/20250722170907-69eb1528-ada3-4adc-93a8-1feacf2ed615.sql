-- Fix the generate_agent_token_address function to resolve ambiguous column reference
CREATE OR REPLACE FUNCTION public.generate_agent_token_address(p_agent_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_token_address TEXT;
BEGIN
  -- Generate a deterministic address based on agent ID
  -- This is a placeholder - in production you'd deploy actual ERC20 contracts
  SELECT '0x' || SUBSTRING(REPLACE(p_agent_id::TEXT, '-', '') || '0000000000000000000000000000000000000000', 1, 40)
  INTO v_token_address;
  
  -- Update the agent with the generated address
  UPDATE public.agents 
  SET token_address = v_token_address
  WHERE id = p_agent_id;
  
  RETURN v_token_address;
END;
$function$