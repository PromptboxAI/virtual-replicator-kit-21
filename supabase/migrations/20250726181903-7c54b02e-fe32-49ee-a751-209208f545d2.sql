-- Add liquidity pool creation function for graduation
CREATE OR REPLACE FUNCTION public.complete_agent_graduation(
  p_graduation_event_id UUID,
  p_liquidity_pool_address TEXT,
  p_liquidity_tx_hash TEXT
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_graduation_event RECORD;
  v_agent RECORD;
BEGIN
  -- Get graduation event
  SELECT * INTO v_graduation_event 
  FROM agent_graduation_events 
  WHERE id = p_graduation_event_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Graduation event not found'
    );
  END IF;
  
  -- Get agent
  SELECT * INTO v_agent 
  FROM agents 
  WHERE id = v_graduation_event.agent_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Agent not found'
    );
  END IF;
  
  -- Update graduation event with liquidity pool details
  UPDATE agent_graduation_events 
  SET 
    graduation_status = 'completed',
    liquidity_pool_address = p_liquidity_pool_address,
    liquidity_tx_hash = p_liquidity_tx_hash,
    updated_at = now()
  WHERE id = p_graduation_event_id;
  
  -- Mark agent as fully graduated
  UPDATE agents 
  SET 
    token_graduated = true,
    updated_at = now()
  WHERE id = v_graduation_event.agent_id;
  
  -- Log graduation completion
  INSERT INTO graduation_transaction_logs (
    graduation_event_id,
    transaction_type,
    transaction_hash,
    status
  ) VALUES (
    p_graduation_event_id,
    'liquidity_creation',
    p_liquidity_tx_hash,
    'confirmed'
  );
  
  RETURN json_build_object(
    'success', true,
    'graduation_event_id', p_graduation_event_id,
    'agent_id', v_graduation_event.agent_id,
    'liquidity_pool_address', p_liquidity_pool_address,
    'status', 'completed'
  );
END;
$function$;