-- Create revenue_failures table to track failed payouts
CREATE TABLE public.revenue_failures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    distribution_id UUID REFERENCES public.revenue_distributions(id) ON DELETE SET NULL,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('creator', 'platform')),
    intended_recipient TEXT NOT NULL, -- wallet address or user_id
    amount NUMERIC NOT NULL,
    failure_reason TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'resolved', 'abandoned')),
    last_retry_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revenue_failures ENABLE ROW LEVEL SECURITY;

-- RLS policies for revenue_failures
CREATE POLICY "Revenue failures are viewable by admins" 
ON public.revenue_failures 
FOR SELECT 
USING (has_role((auth.uid())::text, 'admin'::app_role));

CREATE POLICY "Only system can manage revenue failures" 
ON public.revenue_failures 
FOR ALL 
USING (false);

-- Create performance indexes
CREATE INDEX idx_revenue_failures_agent_id ON public.revenue_failures(agent_id);
CREATE INDEX idx_revenue_failures_status ON public.revenue_failures(status);
CREATE INDEX idx_revenue_failures_retry_count ON public.revenue_failures(retry_count);
CREATE INDEX idx_revenue_failures_created_at ON public.revenue_failures(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_revenue_failures_updated_at
BEFORE UPDATE ON public.revenue_failures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add retry tracking to revenue_distributions table
ALTER TABLE public.revenue_distributions 
ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN has_failures BOOLEAN NOT NULL DEFAULT false;