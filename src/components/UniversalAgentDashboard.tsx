import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AgentTabsInterface } from './AgentTabsInterface';
import { WorkflowBuilder } from './WorkflowBuilder';
import { Loader2 } from 'lucide-react';

interface UniversalAgentDashboardProps {
  agent: {
    id: string;
    name: string;
    symbol: string;
    description?: string;
    avatar_url?: string;
    category?: string;
    framework?: string;
    creator_id?: string;
    created_at: string;
    current_price: number;
    market_cap?: number;
    token_holders?: number;
    prompt_raised?: number;
    token_graduated?: boolean;
    is_active?: boolean;
  };
  onAgentUpdated?: () => void;
  isCreatorView?: boolean; // New prop to distinguish creator vs public view
}

export function UniversalAgentDashboard({ agent, onAgentUpdated, isCreatorView = false }: UniversalAgentDashboardProps) {
  // 🔍 DEBUG: Log states at UniversalAgentDashboard level
  console.log("UniversalAgentDashboard - Privy state:", "N/A - no privy here");
  console.log("UniversalAgentDashboard - Agent:", agent);
  console.log("UniversalAgentDashboard - isCreatorView:", isCreatorView);
  // Fetch existing configuration - only for creator view or when needed
  const { data: existingConfig, refetch, isLoading: configLoading } = useQuery({
    queryKey: ['agent-config', agent.id],
    queryFn: async () => {
      console.log('Fetching agent configuration for agent ID:', agent.id);
      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('agent_id', agent.id)
        .maybeSingle();
      
      console.log('Agent config query result:', { data, error });
      
      if (error) {
        console.error('Error fetching agent config:', error);
        return null;
      }
      return data;
    },
    enabled: !!agent.id && isCreatorView, // Only fetch config for creator view
  });

  // Show loading state only for creator view when configuration is loading
  if (isCreatorView && configLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={agent.avatar_url} alt={agent.name} />
              <AvatarFallback>
                {agent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <p className="text-muted-foreground">{agent.symbol} • {agent.category || 'AI Agent'}</p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading agent configuration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('UniversalAgentDashboard render state:', {
    configLoading,
    existingConfig,
    agentId: agent.id
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-center gap-4 pb-8 mb-4">
        <Avatar className="h-16 w-16 flex-shrink-0">
          <AvatarImage src={agent.avatar_url} alt={agent.name} />
          <AvatarFallback>
            {agent.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-left min-w-0">
          <h1 className="text-3xl font-bold break-words">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.symbol} • {agent.category || 'AI Agent'}</p>
          {agent.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">{agent.description}</p>
          )}
        </div>
      </div>

      {/* Show workflow builder for creator, tabs interface for public */}
      {isCreatorView ? (
        <WorkflowBuilder 
          agentId={agent.id}
          agentName={agent.name}
          onComplete={() => {
            refetch();
            onAgentUpdated?.();
          }}
        />
      ) : (
        <AgentTabsInterface 
          agent={agent}
          onAgentUpdated={() => {
            refetch();
            onAgentUpdated?.();
          }}
        />
      )}
    </div>
  );
}