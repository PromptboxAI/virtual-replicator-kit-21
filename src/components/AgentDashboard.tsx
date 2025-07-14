import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Activity, MessageSquare, TrendingUp, Zap, Clock, DollarSign } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  symbol: string;
  description: string;
  current_price: number;
  avatar_url?: string;
}

interface AgentActivity {
  id: string;
  activity_type: string;
  title: string;
  description?: string;
  metadata?: any;
  status: string;
  result?: any;
  created_at: string;
}

interface AgentRuntimeStatus {
  is_active: boolean;
  last_activity_at?: string;
  current_goal?: string;
  performance_metrics?: any;
  revenue_generated: number;
  tasks_completed: number;
}

interface AgentInteraction {
  id: string;
  message_type: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface AgentDashboardProps {
  agent: Agent;
}

export function AgentDashboard({ agent }: AgentDashboardProps) {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [interactions, setInteractions] = useState<AgentInteraction[]>([]);
  const [runtimeStatus, setRuntimeStatus] = useState<AgentRuntimeStatus>({
    is_active: false,
    revenue_generated: 0,
    tasks_completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [userMessage, setUserMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgentData();
    
    // Set up real-time subscriptions
    const activitiesChannel = supabase
      .channel('agent-activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_activities',
          filter: `agent_id=eq.${agent.id}`
        },
        (payload) => {
          setActivities(prev => [payload.new as AgentActivity, ...prev]);
        }
      )
      .subscribe();

    const interactionsChannel = supabase
      .channel('agent-interactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_interactions',
          filter: `agent_id=eq.${agent.id}`
        },
        (payload) => {
          setInteractions(prev => [payload.new as AgentInteraction, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(interactionsChannel);
    };
  }, [agent.id]);

  const fetchAgentData = async () => {
    try {
      // Fetch activities
      const { data: activitiesData } = await supabase
        .from('agent_activities')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch interactions
      const { data: interactionsData } = await supabase
        .from('agent_interactions')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch runtime status
      const { data: statusData } = await supabase.functions.invoke('agent-runtime', {
        body: { action: 'get_status', agentId: agent.id }
      });

      setActivities(activitiesData || []);
      setInteractions(interactionsData || []);
      setRuntimeStatus(statusData?.status || runtimeStatus);
    } catch (error) {
      console.error('Error fetching agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeAgentCycle = async () => {
    try {
      setLoading(true);
      
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.functions.invoke('agent-runtime', {
        body: { action: 'execute_cycle', agentId: agent.id },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });
      
      toast({
        title: "Agent Activated",
        description: "Agent execution cycle started successfully",
      });
      
      // Refresh data after a short delay
      setTimeout(fetchAgentData, 2000);
    } catch (error) {
      toast({
        title: "Activation Failed",
        description: "Failed to start agent execution",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.functions.invoke('agent-runtime', {
        body: { 
          action: 'interact', 
          agentId: agent.id, 
          message: userMessage 
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });
      
      setUserMessage('');
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the agent",
      });
    } catch (error) {
      toast({
        title: "Message Failed",
        description: "Failed to send message to agent",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'twitter_post': return <MessageSquare className="h-4 w-4" />;
      case 'trading_decision': return <TrendingUp className="h-4 w-4" />;
      case 'goal_execution': return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  if (loading && activities.length === 0) {
    return <div className="text-center py-8">Loading agent dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${runtimeStatus.is_active ? 'bg-green-500 ring-2 ring-green-200' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {runtimeStatus.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-lg font-bold">${runtimeStatus.revenue_generated.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Revenue Generated</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-lg font-bold">{runtimeStatus.tasks_completed}</div>
                <div className="text-xs text-muted-foreground">Tasks Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <Button 
              onClick={executeAgentCycle} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Activating...' : 'Execute Cycle'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="chat">Agent Chat</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No activities yet. Click "Execute Cycle" to start the agent.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">{activity.title}</h4>
                            {getStatusBadge(activity.status)}
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Chat with {agent.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScrollArea className="h-64 p-4 border rounded">
                  {interactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No interactions yet. Send a message to start chatting!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {interactions.slice().reverse().map((interaction) => (
                        <div 
                          key={interaction.id} 
                          className={`flex ${interaction.message_type === 'user_message' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            interaction.message_type === 'user_message' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm">{interaction.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(interaction.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border rounded-md"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={sendingMessage || !userMessage.trim()}
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Efficiency Score</h4>
                  <div className="text-2xl font-bold text-green-500">
                    {runtimeStatus.performance_metrics?.efficiency?.toFixed(1) || '0'}%
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Engagement Score</h4>
                  <div className="text-2xl font-bold text-blue-500">
                    {runtimeStatus.performance_metrics?.engagement_score?.toFixed(1) || '0'}%
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Current Goal</h4>
                  <p className="text-sm text-muted-foreground">
                    {runtimeStatus.current_goal || 'No active goal'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Last Activity</h4>
                  <p className="text-sm text-muted-foreground">
                    {runtimeStatus.last_activity_at 
                      ? new Date(runtimeStatus.last_activity_at).toLocaleString()
                      : 'No recent activity'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}