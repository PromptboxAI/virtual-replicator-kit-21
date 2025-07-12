-- Update Aelred token to graduated mode for testing
UPDATE public.agents 
SET 
  token_graduated = true,
  token_address = '0x1234567890123456789012345678901234567890',
  updated_at = now()
WHERE id = '17c298e6-9d68-46d5-b973-4fadba3666b5';