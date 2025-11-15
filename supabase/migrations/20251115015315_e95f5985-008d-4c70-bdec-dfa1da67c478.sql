-- Phase 1: User-Scoped Tables for trade.promptbox.com

-- ============================================================================
-- 1. Create enums for price_alerts
-- ============================================================================

CREATE TYPE public.alert_direction AS ENUM ('above', 'below');
CREATE TYPE public.alert_status AS ENUM ('active', 'triggered', 'cancelled');

-- ============================================================================
-- 2. Create watchlists table
-- ============================================================================

CREATE TABLE public.watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(owner_id, agent_id)
);

-- Enable RLS
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/modify their own watchlists
CREATE POLICY "Users can view own watchlists"
  ON public.watchlists FOR SELECT
  USING (owner_id = (auth.uid())::text);

CREATE POLICY "Users can insert own watchlists"
  ON public.watchlists FOR INSERT
  WITH CHECK (owner_id = (auth.uid())::text);

CREATE POLICY "Users can delete own watchlists"
  ON public.watchlists FOR DELETE
  USING (owner_id = (auth.uid())::text);

-- Indexes for performance
CREATE INDEX idx_watchlists_owner ON public.watchlists(owner_id);
CREATE INDEX idx_watchlists_agent ON public.watchlists(agent_id);

-- ============================================================================
-- 3. Create price_alerts table
-- ============================================================================

CREATE TABLE public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  direction public.alert_direction NOT NULL,
  threshold_price numeric NOT NULL CHECK (threshold_price > 0),
  status public.alert_status DEFAULT 'active' NOT NULL,
  triggered_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/modify their own alerts
CREATE POLICY "Users can view own alerts"
  ON public.price_alerts FOR SELECT
  USING (owner_id = (auth.uid())::text);

CREATE POLICY "Users can insert own alerts"
  ON public.price_alerts FOR INSERT
  WITH CHECK (owner_id = (auth.uid())::text);

CREATE POLICY "Users can update own alerts"
  ON public.price_alerts FOR UPDATE
  USING (owner_id = (auth.uid())::text);

CREATE POLICY "Users can delete own alerts"
  ON public.price_alerts FOR DELETE
  USING (owner_id = (auth.uid())::text);

-- Indexes for performance
CREATE INDEX idx_alerts_owner ON public.price_alerts(owner_id);
CREATE INDEX idx_alerts_agent ON public.price_alerts(agent_id);
CREATE INDEX idx_alerts_active ON public.price_alerts(status) WHERE status = 'active';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_price_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_alerts_updated_at
  BEFORE UPDATE ON public.price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_price_alerts_updated_at();