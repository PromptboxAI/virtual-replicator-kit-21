-- Update treasury_config to use the deployed vault address
UPDATE treasury_config 
SET 
  treasury_address = '0xbafe4e2c27f1c0bb8e562262dd54e3f1bb959140',
  platform_vault_address = '0xbafe4e2c27f1c0bb8e562262dd54e3f1bb959140',
  vault_deployed_at = now(),
  vault_notes = 'Testnet vault deployed - creation fees route here',
  updated_at = now()
WHERE network = 'testnet';