import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AgentActivityFeed } from '@/components/AgentActivityFeed';
import { AgentChat } from '@/components/AgentChat';
import { TwitterCredentialsForm } from '@/components/TwitterCredentialsForm';
import { AgentBuilder } from '@/components/AgentBuilder';
import { UniversalAgentDashboard } from '@/components/UniversalAgentDashboard';
import { TradingBotConfiguration } from '@/components/TradingBotConfiguration';
import { DeFiAssistantConfiguration } from '@/components/DeFiAssistantConfiguration';
import { ContentCreatorConfiguration } from '@/components/ContentCreatorConfiguration';
import { CommunityManagerConfiguration } from '@/components/CommunityManagerConfiguration';
import { AnalyticsAgentConfiguration } from '@/components/AnalyticsAgentConfiguration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  AlertCircle, 
  Play, 
  Pause,
  Twitter, 
  Settings, 
  Activity, 
  DollarSign,
  Bot,
  MessageSquare,
  Zap,
  TrendingUp,
  Power
} from 'lucide-react';

export default function AgentManagement() {
  const { agentId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [showTwitterSetup, setShowTwitterSetup] = useState(false);

  if (!agentId) {
    return <Navigate to="/my-agents" replace />;
  }

  const { data: agent, isLoading, error, refetch } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Check if user is the creator of this agent
  const isCreator = user?.id === agent?.creator_id;
  
  // Debug logging to check the ID comparison
  console.log('Access control check:', {
    userId: user?.id,
    creatorId: agent?.creator_id,
    isCreator,
    agent: agent?.name
  });

  // Temporarily disable the redirect to debug the issue
  // TODO: Re-enable this after fixing the ID comparison issue
  // if (agent && !isCreator) {
  //   return <Navigate to={`/trade/${agentId}`} replace />;
  // }

  // Handle manual agent execution
  const handleExecuteAgent = async () => {
    if (!agent || !user) return;
    
    setIsExecuting(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-runtime', {
        body: {
          action: 'execute_cycle',
          agentId: agent.id
        }
      });

      if (error) throw error;

      toast({
        title: "Agent Executed Successfully! 🚀",
        description: `${agent.name} completed an autonomous execution cycle. Check the Activities tab to see what it did.`,
      });

      // Refresh agent data
      refetch();
    } catch (error: any) {
      toast({
        title: "Execution Failed",
        description: error.message || "Failed to execute agent",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle agent pause/resume toggle
  const handleToggleAgentStatus = async () => {
    if (!agent || !user) return;
    
    setIsTogglingStatus(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({ is_active: !agent.is_active })
        .eq('id', agent.id);

      if (error) throw error;

      toast({
        title: agent.is_active ? "Agent Paused ⏸️" : "Agent Resumed ▶️",
        description: agent.is_active 
          ? `${agent.name} has been paused and will no longer run autonomously.`
          : `${agent.name} is now active and will run autonomously every 15 minutes.`,
      });

      // Refresh agent data
      refetch();
    } catch (error: any) {
      toast({
        title: "Status Update Failed",
        description: error.message || "Failed to update agent status",
        variant: "destructive"
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading agent details...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The agent you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Universal agent dashboard for all types using OpenAI Assistants
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <UniversalAgentDashboard 
          agent={{
            id: agent.id,
            name: agent.name,
            symbol: agent.symbol,
            description: agent.description,
            avatar_url: agent.avatar_url,
            category: agent.category,
            is_active: agent.is_active
          }}
          onAgentUpdated={refetch}
        />
      </div>
      <Footer />
    </div>
  );

}