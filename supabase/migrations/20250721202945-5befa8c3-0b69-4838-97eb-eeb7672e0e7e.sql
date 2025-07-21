-- Create revenue_events table for auditable revenue tracking
CREATE TABLE public.revenue_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL, -- 'buy', 'sell', 'trading_fee', 'manual'
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  creator_amount NUMERIC NOT NULL DEFAULT 0, 
  platform_amount NUMERIC NOT NULL DEFAULT 0,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;

-- Create policies for revenue events
CREATE POLICY "Revenue events are viewable by everyone" 
ON public.revenue_events 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can insert revenue events" 
ON public.revenue_events 
FOR INSERT 
WITH CHECK (false); -- Only edge functions should insert

CREATE POLICY "Only admins can manage revenue events" 
ON public.revenue_events 
FOR ALL 
USING (has_role((auth.uid())::text, 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_revenue_events_agent_id ON public.revenue_events(agent_id);
CREATE INDEX idx_revenue_events_timestamp ON public.revenue_events(timestamp DESC);
CREATE INDEX idx_revenue_events_source ON public.revenue_events(source);
CREATE INDEX idx_revenue_events_status ON public.revenue_events(status);

-- Create trigger for updated_at
CREATE TRIGGER update_revenue_events_updated_at
BEFORE UPDATE ON public.revenue_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();