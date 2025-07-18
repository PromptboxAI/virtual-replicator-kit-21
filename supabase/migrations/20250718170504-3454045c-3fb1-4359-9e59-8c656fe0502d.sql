-- Add bonding curve fields to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS prompt_raised INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS token_graduated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS graduation_threshold INTEGER DEFAULT 42000;

-- Add comment to explain the bonding curve mechanics
COMMENT ON COLUMN public.agents.prompt_raised IS 'Amount of PROMPT tokens pledged toward bonding curve';
COMMENT ON COLUMN public.agents.token_graduated IS 'Whether agent has graduated and is live on DEX';
COMMENT ON COLUMN public.agents.graduation_threshold IS 'PROMPT tokens needed for graduation (default 42k)';