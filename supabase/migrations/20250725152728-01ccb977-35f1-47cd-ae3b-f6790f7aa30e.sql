-- Fix critical security issues: Enable RLS on graduation tables
ALTER TABLE public.agent_graduation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduation_transaction_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for graduation events
CREATE POLICY "Graduation events are viewable by everyone" 
ON public.agent_graduation_events 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can manage graduation events" 
ON public.agent_graduation_events 
FOR ALL 
USING (false);

-- Create RLS policies for graduation transaction logs
CREATE POLICY "Graduation logs are viewable by everyone" 
ON public.graduation_transaction_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can manage graduation logs" 
ON public.graduation_transaction_logs 
FOR ALL 
USING (false);