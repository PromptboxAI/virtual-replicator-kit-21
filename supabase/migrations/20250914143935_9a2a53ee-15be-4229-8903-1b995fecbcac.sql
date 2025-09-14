-- Populate admin_settings table with default values
-- This will seed the empty table with the defaults that the app expects

INSERT INTO public.admin_settings (key, value, updated_by) VALUES
  ('deployment_mode', '"database"', 'system_init'),
  ('allowed_lock_durations', '[15, 60, 240, 1440]', 'system_init'),
  ('allowed_frameworks', '["PROMPT", "OPENAI", "ANTHROPIC"]', 'system_init'),
  ('max_prebuy_amount', '1000', 'system_init'),
  ('creation_fee', '100', 'system_init'),
  ('test_mode_enabled', 'true', 'system_init'),
  ('trading_fee_percent', '1', 'system_init'),
  ('graduation_threshold', '42000', 'system_init'),
  ('mev_protection_enabled', 'false', 'system_init'),
  ('emergency_pause', 'false', 'system_init')
ON CONFLICT (key) DO NOTHING; -- Don't overwrite if any exist