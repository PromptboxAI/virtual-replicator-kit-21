-- Clean up the failed factory deployment
UPDATE deployed_contracts 
SET is_active = false 
WHERE contract_address = '0x09cbe197c98070eba3707be52f552f3a50aae749' 
  AND transaction_hash = '0x2b491f8889b5f58db5174af1e89803b479176d29819b9b4c1a561642adb661cc';