-- Deactivate the failed PROMPT token deployment that was incorrectly marked as successful
UPDATE deployed_contracts 
SET is_active = false,
    updated_at = now()
WHERE contract_address = '0x4bfa02f8d386e5a1a6089e83a2d77b5c1995958d'
  AND contract_type = 'prompt_token'
  AND network = 'base_sepolia';

-- Add a note about why this was deactivated
INSERT INTO contract_deployment_logs (
  contract_address,
  transaction_hash,
  deployment_status,
  error_message,
  metadata
) VALUES (
  '0x4bfa02f8d386e5a1a6089e83a2d77b5c1995958d',
  'unknown', 
  'failed_retroactive',
  'Deployment was incorrectly marked as successful but contract verification failed',
  '{"deactivated_at": "' || now()::text || '", "reason": "Failed contract validation"}'
) 
ON CONFLICT (contract_address, transaction_hash) DO UPDATE SET
  error_message = EXCLUDED.error_message,
  metadata = EXCLUDED.metadata;