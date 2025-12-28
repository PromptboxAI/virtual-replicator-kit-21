-- Add project_pitch column to agents table for rich HTML content
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS project_pitch TEXT;