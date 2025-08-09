-- Add deployment tracking columns to agents table
ALTER TABLE public.agents 
ADD COLUMN deployment_method TEXT,
ADD COLUMN deployment_tx_hash TEXT,
ADD COLUMN deployment_verified BOOLEAN DEFAULT false;

-- Update existing agents to mark them as verified (they already have token_address)
UPDATE public.agents 
SET deployment_verified = true,
    deployment_method = 'factory'
WHERE token_address IS NOT NULL;