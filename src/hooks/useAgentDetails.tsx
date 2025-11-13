import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AgentDetailsParams {
  agentId?: string;
  symbol?: string;
  includeMarketing?: boolean;
  includeTeam?: boolean;
  includeRoadmap?: boolean;
  enabled?: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatar_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  order_index: number;
}

interface RoadmapMilestone {
  id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  completed_at?: string;
  order_index: number;
}

interface AgentDetailsResponse {
  agent: any;
  marketing: any;
  team: TeamMember[];
  roadmap: RoadmapMilestone[];
}

export function useAgentDetails({
  agentId,
  symbol,
  includeMarketing = true,
  includeTeam = true,
  includeRoadmap = true,
  enabled = true,
}: AgentDetailsParams) {
  return useQuery({
    queryKey: ['agent-details', agentId, symbol, includeMarketing, includeTeam, includeRoadmap],
    queryFn: async () => {
      if (!agentId && !symbol) {
        throw new Error('Either agentId or symbol must be provided');
      }

      const params = new URLSearchParams();
      if (agentId) params.append('id', agentId);
      if (symbol) params.append('symbol', symbol);
      if (!includeMarketing) params.append('includeMarketing', 'false');
      if (!includeTeam) params.append('includeTeam', 'false');
      if (!includeRoadmap) params.append('includeRoadmap', 'false');

      const { data, error } = await supabase.functions.invoke('get-agent-details', {
        body: {},
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;
      return data as AgentDetailsResponse;
    },
    enabled: enabled && (!!agentId || !!symbol),
    staleTime: 30000, // 30 seconds
  });
}
