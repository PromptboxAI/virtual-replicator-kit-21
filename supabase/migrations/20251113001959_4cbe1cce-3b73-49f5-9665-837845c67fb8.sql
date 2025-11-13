-- Create agent_team_members table
CREATE TABLE public.agent_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  avatar_url text,
  bio text,
  twitter_url text,
  linkedin_url text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_roadmap_milestones table
CREATE TABLE public.agent_roadmap_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_date date,
  status text CHECK (status IN ('upcoming', 'in_progress', 'completed')) DEFAULT 'upcoming',
  completed_at timestamptz,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_team_members_agent_id ON public.agent_team_members(agent_id);
CREATE INDEX idx_team_members_order ON public.agent_team_members(agent_id, order_index);
CREATE INDEX idx_roadmap_agent_id ON public.agent_roadmap_milestones(agent_id);
CREATE INDEX idx_roadmap_order ON public.agent_roadmap_milestones(agent_id, order_index);
CREATE INDEX idx_roadmap_status ON public.agent_roadmap_milestones(agent_id, status);

-- Enable Row Level Security
ALTER TABLE public.agent_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_roadmap_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_team_members
CREATE POLICY "Team members are viewable by everyone"
  ON public.agent_team_members
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert team members"
  ON public.agent_team_members
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update team members"
  ON public.agent_team_members
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete team members"
  ON public.agent_team_members
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for agent_roadmap_milestones
CREATE POLICY "Roadmap milestones are viewable by everyone"
  ON public.agent_roadmap_milestones
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert roadmap milestones"
  ON public.agent_roadmap_milestones
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update roadmap milestones"
  ON public.agent_roadmap_milestones
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete roadmap milestones"
  ON public.agent_roadmap_milestones
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_agent_team_members_updated_at
  BEFORE UPDATE ON public.agent_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_token_updated_at();

CREATE TRIGGER update_agent_roadmap_milestones_updated_at
  BEFORE UPDATE ON public.agent_roadmap_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_token_updated_at();