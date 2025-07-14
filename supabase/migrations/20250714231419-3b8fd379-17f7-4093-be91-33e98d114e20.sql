-- Create agent_configurations table to store category-specific configurations
CREATE TABLE public.agent_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agent_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for agent configurations
CREATE POLICY "Users can view their own agent configurations"
ON public.agent_configurations
FOR SELECT
USING (agent_id IN (
  SELECT id FROM public.agents WHERE creator_id = auth.uid()::text
));

CREATE POLICY "Users can create configurations for their own agents"
ON public.agent_configurations
FOR INSERT
WITH CHECK (agent_id IN (
  SELECT id FROM public.agents WHERE creator_id = auth.uid()::text
));

CREATE POLICY "Users can update configurations for their own agents"
ON public.agent_configurations
FOR UPDATE
USING (agent_id IN (
  SELECT id FROM public.agents WHERE creator_id = auth.uid()::text
));

CREATE POLICY "Users can delete configurations for their own agents"
ON public.agent_configurations
FOR DELETE
USING (agent_id IN (
  SELECT id FROM public.agents WHERE creator_id = auth.uid()::text
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_agent_configurations_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agent_configurations_updated_at
    BEFORE UPDATE ON public.agent_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agent_configurations_updated_at_column();