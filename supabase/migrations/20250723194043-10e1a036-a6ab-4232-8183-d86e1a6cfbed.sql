-- Reset test agent graduation status to be consistent with bonding curve logic
UPDATE public.agents 
SET 
  token_graduated = false,
  token_address = null,
  updated_at = now()
WHERE id = '17c298e6-9d68-46d5-b973-4fadba3666b5';

-- Ensure all agents follow bonding curve graduation logic
-- Set token_graduated = true only if prompt_raised >= graduation_threshold
UPDATE public.agents 
SET 
  token_graduated = (prompt_raised >= graduation_threshold),
  updated_at = now()
WHERE prompt_raised < graduation_threshold AND token_graduated = true;