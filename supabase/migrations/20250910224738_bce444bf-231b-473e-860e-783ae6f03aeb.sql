-- Enforce unique agent symbols with case-insensitive protection
-- 1) Case-sensitive UNIQUE constraint as an explicit table constraint (matches original plan)
-- 2) Case-insensitive UNIQUE index on lower(symbol) to prevent "ABC" vs "abc" duplicates

-- Ensure there are no case-insensitive duplicates before applying (verified separately)

-- Add the case-sensitive UNIQUE constraint
ALTER TABLE public.agents
ADD CONSTRAINT agents_symbol_unique UNIQUE (symbol);

-- Add case-insensitive UNIQUE index (covers mixed-case collisions)
CREATE UNIQUE INDEX IF NOT EXISTS ux_agents_symbol_ci ON public.agents (lower(symbol));