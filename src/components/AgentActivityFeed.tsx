import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface AgentActivityFeedProps {
  agent: Agent;
}

export function AgentActivityFeed({ agent }: AgentActivityFeedProps) {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [runtimeStatus, setRuntimeStatus] = useState<AgentRuntimeStatus>({
    is_active: false,
    revenue_generated: 0,
    tasks_completed: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgentData();
    
    // Set up real-time subscription for activities
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

    return () => {
      supabase.removeChannel(activitiesChannel);
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

      // Fetch runtime status
      const { data: statusData } = await supabase.functions.invoke('agent-runtime', {
        body: { action: 'get_status', agentId: agent.id }
      });

      setActivities(activitiesData || []);
      setRuntimeStatus(statusData?.status || runtimeStatus);
    } catch (error) {
      console.error('Error fetching agent data:', error);
    } finally {
      setLoading(false);
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
    return <div className="text-center py-8">Loading activity feed...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${runtimeStatus.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
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
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-lg font-bold">{runtimeStatus.tasks_completed}</div>
                <div className="text-xs text-muted-foreground">Tasks Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities yet. Use "Execute Agent Now" to start the agent.
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

      {/* Performance Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Analytics
          </CardTitle>
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
    </div>
  );
}