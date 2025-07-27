-- Add transaction_hash field to deployed_contracts table
ALTER TABLE deployed_contracts 
ADD COLUMN transaction_hash TEXT;