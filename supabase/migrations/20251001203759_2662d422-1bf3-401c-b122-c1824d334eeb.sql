-- Revert graduation threshold back to 42k for database mode (test tokens)
-- The 750k threshold only applies when PROMPT has real USD value
ALTER TABLE public.agents
ALTER COLUMN graduation_threshold SET DEFAULT 42000;

-- Comment explaining the logic
COMMENT ON COLUMN public.agents.graduation_threshold IS 
'Graduation threshold in PROMPT tokens. Default 42k for database/test mode. In production with real USD-backed PROMPT, this would be ~750k to reach target market cap.';