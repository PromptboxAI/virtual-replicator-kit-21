-- Create system alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL, -- lp_unlock, low_liquidity, graduation_failed, price_sync_failed, etc.
  severity TEXT NOT NULL DEFAULT 'warning', -- info | warning | critical
  message TEXT NOT NULL,
  agent_id UUID NULL REFERENCES public.agents(id) ON DELETE SET NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ NULL,
  dedupe_key TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "System alerts are viewable by everyone"
ON public.system_alerts
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage system alerts"
ON public.system_alerts
FOR ALL
USING (has_role((auth.uid())::text, 'admin'))
WITH CHECK (has_role((auth.uid())::text, 'admin'));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_system_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_system_alerts_updated_at ON public.system_alerts;
CREATE TRIGGER trg_update_system_alerts_updated_at
BEFORE UPDATE ON public.system_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_system_alerts_updated_at();

-- Platform health snapshots table
CREATE TABLE IF NOT EXISTS public.platform_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_platform_tokens_value_usd NUMERIC NOT NULL DEFAULT 0,
  graduated_agents_count INTEGER NOT NULL DEFAULT 0,
  avg_lp_value_usd NUMERIC NOT NULL DEFAULT 0,
  low_liquidity_agents INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.platform_health_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Platform health is viewable by everyone"
ON public.platform_health_snapshots
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert platform health"
ON public.platform_health_snapshots
FOR INSERT
WITH CHECK (has_role((auth.uid())::text, 'admin'));
