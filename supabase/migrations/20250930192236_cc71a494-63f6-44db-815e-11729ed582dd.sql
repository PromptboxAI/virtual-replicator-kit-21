-- Add dynamic pricing fields to agents table for USD-based bonding curves
-- These fields capture the PROMPT price and bonding curve parameters at agent creation time

ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS created_prompt_usd_rate DECIMAL(10, 6) DEFAULT 0.10,
ADD COLUMN IF NOT EXISTS created_p0 DECIMAL(20, 10) DEFAULT 0.00004,
ADD COLUMN IF NOT EXISTS created_p1 DECIMAL(20, 10) DEFAULT 0.0001,
ADD COLUMN IF NOT EXISTS graduation_mode TEXT DEFAULT 'database' CHECK (graduation_mode IN ('database', 'smart_contract')),
ADD COLUMN IF NOT EXISTS target_market_cap_usd INTEGER DEFAULT 65000;

-- Add index for performance on pricing queries
CREATE INDEX IF NOT EXISTS idx_agents_pricing ON public.agents(created_prompt_usd_rate, graduation_mode);

-- Add comments for documentation
COMMENT ON COLUMN public.agents.created_prompt_usd_rate IS 'PROMPT USD price at agent creation time (e.g., 0.10 = $0.10 per PROMPT)';
COMMENT ON COLUMN public.agents.created_p0 IS 'Starting price (PROMPT per token) calculated at creation time';
COMMENT ON COLUMN public.agents.created_p1 IS 'Ending price at graduation calculated at creation time';
COMMENT ON COLUMN public.agents.graduation_mode IS 'Graduation mode: database (42K fixed) or smart_contract ($65K USD dynamic)';
COMMENT ON COLUMN public.agents.target_market_cap_usd IS 'Target market cap in USD for graduation (production: $65K, test: varies)';