-- Create table to track deployed contracts
CREATE TABLE IF NOT EXISTS public.deployed_contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_address TEXT NOT NULL,
    contract_type TEXT NOT NULL,
    agent_id UUID REFERENCES public.agents(id),
    network TEXT NOT NULL DEFAULT 'base_sepolia',
    version TEXT NOT NULL DEFAULT 'v1',
    name TEXT,
    symbol TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deployment_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deployed_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Deployed contracts are viewable by everyone" 
ON public.deployed_contracts 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can manage deployed contracts" 
ON public.deployed_contracts 
FOR ALL 
USING (false);

-- Create indexes for better performance
CREATE INDEX idx_deployed_contracts_agent_id ON public.deployed_contracts(agent_id);
CREATE INDEX idx_deployed_contracts_type_version ON public.deployed_contracts(contract_type, version);
CREATE INDEX idx_deployed_contracts_active ON public.deployed_contracts(is_active);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_deployed_contracts_updated_at
BEFORE UPDATE ON public.deployed_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();