-- Fix creator_id column type to match Privy user ID format
ALTER TABLE public.agents 
ALTER COLUMN creator_id TYPE text;