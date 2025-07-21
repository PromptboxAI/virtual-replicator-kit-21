-- Add foreign key constraint to revenue_config
ALTER TABLE public.revenue_config 
ADD CONSTRAINT fk_revenue_config_agent_id 
FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;

-- Create status enum and update revenue_distributions table
CREATE TYPE revenue_status AS ENUM ('pending', 'completed', 'failed');

ALTER TABLE public.revenue_distributions 
ALTER COLUMN status TYPE revenue_status USING status::revenue_status;

-- Add additional audit fields
ALTER TABLE public.revenue_distributions 
ADD COLUMN processed_by TEXT,
ADD COLUMN error_reason TEXT;

-- Create performance indexes
CREATE INDEX idx_distributions_agent_id ON public.revenue_distributions(agent_id);
CREATE INDEX idx_distributions_tx_hash ON public.revenue_distributions(transaction_hash);
CREATE INDEX idx_distributions_status ON public.revenue_distributions(status);
CREATE INDEX idx_revenue_config_agent_id ON public.revenue_config(agent_id);