-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cleanup-failed-agents to run every 1 minute
-- This marks stuck agents as FAILED (>2min in ACTIVATING) and immediately deletes them
-- Ensures name/symbol availability within 2-3 minutes for retry
SELECT cron.schedule(
  'cleanup-failed-agents-every-minute',
  '* * * * *', -- Every 1 minute
  $$
  SELECT
    net.http_post(
        url:='https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/cleanup-failed-agents',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemF6dXV3YXBzbGlhY21qeGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDk1ODgsImV4cCI6MjA2NzU4NTU4OH0.RuRyIGlY0362B3yLcMZEGuCyhAYVIK9K7mcW7BiXpAc"}'::jsonb,
        body:='{"automated": true, "timestamp": "' || now()::text || '"}'::jsonb
    ) as request_id;
  $$
);