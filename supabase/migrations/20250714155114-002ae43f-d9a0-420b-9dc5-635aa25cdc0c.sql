-- Create agent activities table to track autonomous actions
CREATE TABLE public.agent_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'twitter_post', 'trading_decision', 'goal_execution', 'user_interaction'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  result JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent logs table for detailed execution logs
CREATE TABLE public.agent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  log_level TEXT NOT NULL DEFAULT 'info', -- 'debug', 'info', 'warn', 'error'
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent interactions table for user-agent chat
CREATE TABLE public.agent_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'user_message', 'agent_response', 'task_assignment'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent runtime status table
CREATE TABLE public.agent_runtime_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  current_goal TEXT,
  performance_metrics JSONB DEFAULT '{}',
  revenue_generated NUMERIC DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id)
);

-- Enable RLS on all tables
ALTER TABLE public.agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runtime_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_activities
CREATE POLICY "Agent activities are viewable by everyone"
ON public.agent_activities
FOR SELECT
USING (true);

CREATE POLICY "Only system can modify agent activities"
ON public.agent_activities
FOR ALL
USING (false);

-- RLS policies for agent_logs
CREATE POLICY "Agent logs are viewable by everyone"
ON public.agent_logs
FOR SELECT
USING (true);

CREATE POLICY "Only system can modify agent logs"
ON public.agent_logs
FOR ALL
USING (false);

-- RLS policies for agent_interactions
CREATE POLICY "Users can view interactions for their agents or public agents"
ON public.agent_interactions
FOR SELECT
USING (true);

CREATE POLICY "Users can create interactions"
ON public.agent_interactions
FOR INSERT
WITH CHECK (auth.uid()::text = user_id OR EXISTS (
  SELECT 1 FROM public.agents WHERE id = agent_id
));

-- RLS policies for agent_runtime_status
CREATE POLICY "Runtime status is viewable by everyone"
ON public.agent_runtime_status
FOR SELECT
USING (true);

CREATE POLICY "Only system can modify runtime status"
ON public.agent_runtime_status
FOR ALL
USING (false);

-- Create triggers for updated_at
CREATE TRIGGER update_agent_activities_updated_at
  BEFORE UPDATE ON public.agent_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_runtime_status_updated_at
  BEFORE UPDATE ON public.agent_runtime_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_agent_activities_agent_id ON public.agent_activities(agent_id);
CREATE INDEX idx_agent_activities_created_at ON public.agent_activities(created_at DESC);
CREATE INDEX idx_agent_logs_agent_id ON public.agent_logs(agent_id);
CREATE INDEX idx_agent_logs_created_at ON public.agent_logs(created_at DESC);
CREATE INDEX idx_agent_interactions_agent_id ON public.agent_interactions(agent_id);
CREATE INDEX idx_agent_interactions_created_at ON public.agent_interactions(created_at DESC);