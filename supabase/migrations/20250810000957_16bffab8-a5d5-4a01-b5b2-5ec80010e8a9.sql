-- Phase 2: Security & RLS Policies for new tables

-- Enable RLS on all new tables
ALTER TABLE public.deployed_contracts_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_chart_init ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_realtime_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deployed_contracts_audit
CREATE POLICY "Deployed contracts audit is viewable by everyone" 
ON public.deployed_contracts_audit 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can insert deployment audit records" 
ON public.deployed_contracts_audit 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only system can update deployment audit records" 
ON public.deployed_contracts_audit 
FOR UPDATE 
USING (false);

-- RLS Policies for agent_chart_init
CREATE POLICY "Agent chart init is viewable by everyone" 
ON public.agent_chart_init 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can manage chart initialization" 
ON public.agent_chart_init 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- RLS Policies for agent_realtime_updates
CREATE POLICY "Realtime updates are viewable by everyone" 
ON public.agent_realtime_updates 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can manage realtime updates" 
ON public.agent_realtime_updates 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- RLS Policies for deployment_metrics
CREATE POLICY "Deployment metrics are viewable by everyone" 
ON public.deployment_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can insert deployment metrics" 
ON public.deployment_metrics 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only system can update deployment metrics" 
ON public.deployment_metrics 
FOR UPDATE 
USING (false);