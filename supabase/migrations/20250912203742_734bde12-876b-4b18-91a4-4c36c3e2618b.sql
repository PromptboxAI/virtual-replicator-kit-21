-- Create cron job to automatically unlock expired agents every 5 minutes
-- This ensures MEV protection locks are lifted when they expire

SELECT cron.schedule(
  'unlock-expired-agents',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/unlock-expired-agents',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemF6dXV3YXBzbGlhY21qeGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDk1ODgsImV4cCI6MjA2NzU4NTU4OH0.RuRyIGlY0362B3yLcMZEGuCyhAYVIK9K7mcW7BiXpAc"}'::jsonb,
        body:='{"automated": true, "timestamp": "' || now()::text || '"}'::jsonb
    ) as request_id;
  $$
);