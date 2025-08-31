-- Fix the stuck graduated agent and trigger its graduation
INSERT INTO agent_graduation_events (
  agent_id,
  prompt_raised_at_graduation,
  graduation_status,
  metadata
) VALUES (
  '30d130d1-7da2-4174-a577-bbb5a57f9125',
  42000,
  'initiated',
  '{"triggered_by": "phase4_migration", "auto_fix": true}'
) 
ON CONFLICT (agent_id) DO UPDATE SET
  graduation_status = 'initiated',
  updated_at = now();