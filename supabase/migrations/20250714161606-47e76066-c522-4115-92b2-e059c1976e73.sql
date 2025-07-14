-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run the agent scheduler every 15 minutes
-- This will automatically execute all active agents on a regular schedule
SELECT cron.schedule(
  'agent-autonomous-execution',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/agent-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemF6dXV3YXBzbGlhY21qeGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDk1ODgsImV4cCI6MjA2NzU4NTU4OH0.RuRyIGlY0362B3yLcMZEGuCyhAYVIK9K7mcW7BiXpAc"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);