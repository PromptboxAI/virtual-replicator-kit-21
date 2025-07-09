-- Add framework column to agents table
ALTER TABLE public.agents 
ADD COLUMN framework text DEFAULT 'G.A.M.E.';