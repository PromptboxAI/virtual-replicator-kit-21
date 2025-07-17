import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
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
    is_active?: boolean;
  };
  onAgentUpdated?: () => void;
}

export function UniversalAgentDashboard({ agent, onAgentUpdated }: UniversalAgentDashboardProps) {
  // Fetch existing configuration
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
    enabled: !!agent.id,
  });

  // Show loading state while configuration is loading
  if (configLoading) {
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
      {/* Header */}
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

      {/* Workflow Builder */}
      <WorkflowBuilder 
        agentId={agent.id} 
        agentName={agent.name}
        onComplete={() => {
          refetch();
          onAgentUpdated?.();
        }}
      />
    </div>
  );
}