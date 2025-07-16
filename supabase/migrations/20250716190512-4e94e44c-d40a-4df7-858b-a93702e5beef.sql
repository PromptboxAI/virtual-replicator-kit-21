-- Create treasury configuration table
CREATE TABLE public.treasury_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network TEXT NOT NULL UNIQUE, -- 'testnet' or 'mainnet'
  treasury_address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.treasury_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage treasury configuration
CREATE POLICY "Only admins can manage treasury config" 
ON public.treasury_config 
FOR ALL
USING (has_role((auth.uid())::text, 'admin'::app_role));

-- Create revenue tracking table
CREATE TABLE public.platform_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  revenue_type TEXT NOT NULL, -- 'agent_creation' or 'trading_fee'
  amount NUMERIC NOT NULL,
  agent_id UUID REFERENCES public.agents(id),
  transaction_hash TEXT,
  network TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

-- Admins can view all revenue data
CREATE POLICY "Admins can view all revenue" 
ON public.platform_revenue 
FOR SELECT
USING (has_role((auth.uid())::text, 'admin'::app_role));

-- System can insert revenue records
CREATE POLICY "System can insert revenue" 
ON public.platform_revenue 
FOR INSERT
WITH CHECK (true);

-- Create trigger for treasury config updated_at
CREATE TRIGGER update_treasury_config_updated_at
BEFORE UPDATE ON public.treasury_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default treasury addresses
INSERT INTO public.treasury_config (network, treasury_address) VALUES 
('testnet', '0x23d03610584B0f0988A6F9C281a37094D5611388'),
('mainnet', '0x23d03610584B0f0988A6F9C281a37094D5611388');