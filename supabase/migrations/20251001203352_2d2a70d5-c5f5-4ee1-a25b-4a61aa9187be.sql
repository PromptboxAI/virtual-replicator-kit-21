-- Update default pricing model to v4 for new agents
ALTER TABLE public.agents 
ALTER COLUMN pricing_model SET DEFAULT 'linear_v4';

-- Update graduation threshold default to match v4 config (750k)
ALTER TABLE public.agents
ALTER COLUMN graduation_threshold SET DEFAULT 750000;

-- Optional: Update existing non-graduated agents to v4 if desired
-- Uncomment the lines below to migrate existing agents
-- UPDATE public.agents 
-- SET pricing_model = 'linear_v4',
--     graduation_threshold = 750000
-- WHERE pricing_model = 'linear_v3' 
--   AND token_graduated = false
--   AND prompt_raised < 100;