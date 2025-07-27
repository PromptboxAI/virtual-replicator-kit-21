-- Deactivate the failed PROMPT token deployment that was incorrectly marked as successful
UPDATE deployed_contracts 
SET is_active = false,
    updated_at = now()
WHERE contract_address = '0x4bfa02f8d386e5a1a6089e83a2d77b5c1995958d'
  AND contract_type = 'prompt_token'
  AND network = 'base_sepolia';