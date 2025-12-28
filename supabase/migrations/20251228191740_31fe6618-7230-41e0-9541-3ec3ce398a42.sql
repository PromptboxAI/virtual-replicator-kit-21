-- Add whitepaper_content column to agent_marketing table for rich text whitepaper content
ALTER TABLE public.agent_marketing 
ADD COLUMN IF NOT EXISTS whitepaper_content TEXT;