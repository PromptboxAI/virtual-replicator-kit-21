-- Create chart_drawings table for persistent drawing storage
CREATE TABLE public.chart_drawings (
  id TEXT NOT NULL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  drawing_type TEXT NOT NULL CHECK (drawing_type IN ('trendline', 'horizontal', 'text')),
  drawing_data JSONB NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chart_drawings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own chart drawings" 
ON public.chart_drawings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chart drawings" 
ON public.chart_drawings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chart drawings" 
ON public.chart_drawings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chart drawings" 
ON public.chart_drawings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_chart_drawings_agent_user ON public.chart_drawings(agent_id, user_id);
CREATE INDEX idx_chart_drawings_user_created ON public.chart_drawings(user_id, created_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_chart_drawings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chart_drawings_updated_at
  BEFORE UPDATE ON public.chart_drawings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chart_drawings_updated_at();