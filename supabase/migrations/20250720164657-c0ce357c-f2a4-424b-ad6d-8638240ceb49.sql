-- Create storage bucket for agent marketing materials
INSERT INTO storage.buckets (id, name, public) VALUES ('agent-marketing', 'agent-marketing', true);

-- Create policies for agent marketing bucket
CREATE POLICY "Marketing materials are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'agent-marketing');

CREATE POLICY "Authenticated users can upload marketing materials" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'agent-marketing' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their marketing materials" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'agent-marketing' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete their marketing materials" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'agent-marketing' AND auth.uid() IS NOT NULL);

-- Create agent_marketing table for marketing content
CREATE TABLE public.agent_marketing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  description TEXT,
  whitepaper_url TEXT,
  website_url TEXT,
  youtube_url TEXT,
  twitter_url TEXT,
  discord_url TEXT,
  telegram_url TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  demo_videos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id)
);

-- Enable RLS on agent_marketing table
ALTER TABLE public.agent_marketing ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_marketing
CREATE POLICY "Marketing content is viewable by everyone" 
ON public.agent_marketing 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert marketing content" 
ON public.agent_marketing 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update marketing content" 
ON public.agent_marketing 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete marketing content" 
ON public.agent_marketing 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agent_marketing_updated_at
BEFORE UPDATE ON public.agent_marketing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();