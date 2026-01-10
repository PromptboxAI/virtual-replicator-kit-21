CREATE OR REPLACE FUNCTION public.atomic_update_agent_state(p_agent_id uuid, p_shares_delta numeric, p_prompt_delta numeric, p_new_price numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_shares NUMERIC;
  v_new_prompt NUMERIC;
  v_graduation_threshold NUMERIC := 42160;  -- V7 graduation threshold
  v_should_graduate BOOLEAN := false;
BEGIN
  UPDATE agents
  SET
    shares_sold = COALESCE(shares_sold, 0) + p_shares_delta,
    prompt_raised = COALESCE(prompt_raised, 0) + p_prompt_delta,
    current_price = p_new_price,
    bonding_curve_supply = COALESCE(shares_sold, 0) + p_shares_delta,  -- Sync bonding_curve_supply
    circulating_supply = COALESCE(shares_sold, 0) + p_shares_delta,    -- Sync circulating_supply
    updated_at = NOW()
  WHERE id = p_agent_id
    AND (COALESCE(shares_sold, 0) + p_shares_delta) >= 0
    AND (COALESCE(prompt_raised, 0) + p_prompt_delta) >= 0
  RETURNING shares_sold, prompt_raised INTO v_new_shares, v_new_prompt;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid state update or agent not found'
    );
  END IF;

  -- Check graduation threshold
  IF v_new_prompt >= v_graduation_threshold THEN
    v_should_graduate := true;
    UPDATE agents SET bonding_curve_phase = 'graduating' WHERE id = p_agent_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'shares_sold', v_new_shares,
    'prompt_raised', v_new_prompt,
    'current_price', p_new_price,
    'should_graduate', v_should_graduate
  );
END;
$function$