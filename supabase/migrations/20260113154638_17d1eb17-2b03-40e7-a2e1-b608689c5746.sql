-- Add missing updated_at column to cron_job_logs table
-- This column is required by the update_cron_job_logs_updated_at trigger

ALTER TABLE public.cron_job_logs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing rows to have updated_at equal to created_at
UPDATE public.cron_job_logs 
SET updated_at = COALESCE(execution_end, created_at) 
WHERE updated_at IS NULL;