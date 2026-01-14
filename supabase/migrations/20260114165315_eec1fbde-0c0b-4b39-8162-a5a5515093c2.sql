-- Schedule v8-event-indexer to run every 2 minutes
-- This keeps agent on-chain data (supply, reserve, price) and trade history up-to-date

SELECT cron.schedule(
  'v8-event-indexer-sync',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url:='https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/v8-event-indexer',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemF6dXV3YXBzbGlhY21qeGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDk1ODgsImV4cCI6MjA2NzU4NTU4OH0.RuRyIGlY0362B3yLcMZEGuCyhAYVIK9K7mcW7BiXpAc"}'::jsonb,
    body:=jsonb_build_object('scheduled', true, 'timestamp', now()::text)
  ) AS request_id;
  $$
);