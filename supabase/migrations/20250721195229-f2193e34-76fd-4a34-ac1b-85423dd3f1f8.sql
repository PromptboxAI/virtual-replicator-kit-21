-- Create revenue status enum
CREATE TYPE revenue_status AS ENUM ('pending', 'completed', 'failed');

-- Create revenue_config table with all constraints and defaults
CREATE TABLE public.revenue_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL UNIQUE REFERENCES public.agents(id) ON DELETE CASCADE,
    fee_percent NUMERIC NOT NULL DEFAULT 0.01 CHECK (fee_percent >= 0 AND fee_percent <= 1),
    creator_split NUMERIC NOT NULL DEFAULT 0.7 CHECK (creator_split >= 0 AND creator_split <= 1),
    platform_split NUMERIC NOT NULL DEFAULT 0.3 CHECK (platform_split >= 0 AND platform_split <= 1),
    platform_wallet_address TEXT,
    creator_wallet_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_split_total CHECK (creator_split + platform_split = 1)
);

-- Create revenue_distributions table with all improvements
CREATE TABLE public.revenue_distributions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    transaction_hash TEXT,
    total_revenue NUMERIC NOT NULL,
    fee_amount NUMERIC NOT NULL,
    creator_amount NUMERIC NOT NULL,
    platform_amount NUMERIC NOT NULL,
    creator_wallet TEXT,
    platform_wallet TEXT,
    status revenue_status NOT NULL DEFAULT 'pending',
    processed_by TEXT,
    error_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.revenue_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_distributions ENABLE ROW LEVEL SECURITY;

-- RLS policies for revenue_config
CREATE POLICY "Revenue config is viewable by everyone" 
ON public.revenue_config 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage revenue config" 
ON public.revenue_config 
FOR ALL 
USING (has_role((auth.uid())::text, 'admin'::app_role));

-- RLS policies for revenue_distributions  
CREATE POLICY "Revenue distributions are viewable by everyone" 
ON public.revenue_distributions 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can manage revenue distributions" 
ON public.revenue_distributions 
FOR ALL 
USING (false);

-- Create performance indexes
CREATE INDEX idx_revenue_config_agent_id ON public.revenue_config(agent_id);
CREATE INDEX idx_distributions_agent_id ON public.revenue_distributions(agent_id);
CREATE INDEX idx_distributions_tx_hash ON public.revenue_distributions(transaction_hash);
CREATE INDEX idx_distributions_status ON public.revenue_distributions(status);
CREATE INDEX idx_distributions_created_at ON public.revenue_distributions(created_at);

-- Create triggers for updated_at
CREATE TRIGGER update_revenue_config_updated_at
BEFORE UPDATE ON public.revenue_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_revenue_distributions_updated_at
BEFORE UPDATE ON public.revenue_distributions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();