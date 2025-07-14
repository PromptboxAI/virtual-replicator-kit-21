import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AgentActivityFeed } from '@/components/AgentActivityFeed';
import { AgentChat } from '@/components/AgentChat';
import { TwitterCredentialsForm } from '@/components/TwitterCredentialsForm';
import { AgentBuilder } from '@/components/AgentBuilder';
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Agent Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={agent.avatar_url} alt={agent.name} />
              <AvatarFallback>
                {agent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <p className="text-muted-foreground">{agent.symbol}</p>
              <div className="flex items-center gap-2 mt-2">
                 <Badge variant={agent.is_active ? "default" : "secondary"} className={agent.is_active ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                   {agent.is_active ? "Active" : "Inactive"}
                 </Badge>
                {agent.twitter_api_configured && (
                  <Badge variant="outline" className="text-blue-500">
                    <Twitter className="w-3 h-3 mr-1" />
                    Twitter Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Creator Control Panel */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Creator Control Panel - Build Your AI Agent
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your agent runs autonomously every 15 minutes. Use these controls to set it up and monitor its performance.
              </p>
            </CardHeader>
            <CardContent>
              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Execute Agent */}
                <div className="flex flex-col h-full">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Play className="w-4 h-4" />
                    Manual Execution
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    Trigger your agent to make decisions and take actions right now. This shows you what happens every 15 minutes automatically.
                  </p>
                   <Button 
                     onClick={handleExecuteAgent}
                     disabled={isExecuting}
                     className="w-full h-11 mt-auto bg-black hover:bg-gray-800 text-white"
                   >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        Execute Agent Now
                      </>
                    )}
                  </Button>
                </div>

                {/* Twitter Setup */}
                <div className="flex flex-col h-full">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Twitter className="w-4 h-4" />
                    Twitter Integration
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {agent.twitter_api_configured 
                      ? `Connected as @${agent.twitter_username} - Your agent can post tweets!`
                      : "Enable your agent to post tweets autonomously"
                    }
                  </p>
                   <Button 
                     variant={agent.twitter_api_configured ? "secondary" : "default"}
                     onClick={() => setShowTwitterSetup(!showTwitterSetup)}
                     className={`w-full h-11 mt-auto ${!agent.twitter_api_configured ? "bg-black hover:bg-gray-800 text-white" : ""}`}
                   >
                    {agent.twitter_api_configured ? "Manage Twitter" : "Setup Twitter API"}
                  </Button>
                </div>

                {/* Agent Status Control */}
                <div className="flex flex-col h-full">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Power className="w-4 h-4" />
                    Agent Status
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {agent.is_active 
                      ? "Your agent is currently running autonomously every 15 minutes. Click to pause."
                      : "Your agent is paused and won't run autonomously. Click to resume."
                    }
                  </p>
                  <Button 
                    variant={agent.is_active ? "secondary" : "default"}
                    onClick={handleToggleAgentStatus}
                    disabled={isTogglingStatus}
                    className="w-full h-11 mt-auto"
                  >
                    {isTogglingStatus ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : agent.is_active ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Agent
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume Agent
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Revenue Info */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Autonomous Revenue
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your agent earns revenue automatically and distributes it to token holders
                </p>
                <div className="text-lg font-bold text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  ${agent.current_price >= 0.01 ? agent.current_price.toFixed(2) : agent.current_price.toFixed(6)}
                </div>
                </div>

              {/* Twitter Setup Form */}
              {showTwitterSetup && (
                <div className="mt-6 pt-6 border-t">
                  <TwitterCredentialsForm 
                    agentId={agent.id}
                    onCredentialsAdded={() => {
                      setShowTwitterSetup(false);
                      refetch();
                      toast({
                        title: "Twitter Connected! 🐦",
                        description: "Your agent can now post tweets autonomously",
                      });
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs Interface */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activities & Status
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Agent Builder
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat with Agent
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              How It Works
            </TabsTrigger>
          </TabsList>

          {/* Activities & Status Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <AgentActivityFeed agent={{
              id: agent.id,
              name: agent.name,
              symbol: agent.symbol,
              description: agent.description || `AI agent for ${agent.name}`,
              current_price: agent.current_price,
              avatar_url: agent.avatar_url
            }} />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <AgentChat agent={{
              id: agent.id,
              name: agent.name,
              symbol: agent.symbol,
              description: agent.description || `AI agent for ${agent.name}`,
              current_price: agent.current_price,
              avatar_url: agent.avatar_url
            }} />
          </TabsContent>

          {/* Agent Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <AgentBuilder 
              agent={{
                id: agent.id,
                name: agent.name,
                symbol: agent.symbol,
                description: agent.description || '',
                avatar_url: agent.avatar_url,
                category: agent.category,
                framework: agent.framework,
                is_active: agent.is_active
              }}
              onAgentUpdated={refetch}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  How Your Autonomous Agent Works
                </CardTitle>
                <p className="text-muted-foreground">
                  Understanding your agent's autonomous execution layer and revenue system.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Autonomous Execution (Every 15 Minutes)
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Your agent automatically executes these actions:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>AI Decision Making:</strong> Uses OpenAI to analyze market conditions and make strategic decisions</li>
                      <li><strong>Twitter Posting:</strong> Generates and posts strategic content (if Twitter is configured)</li>
                      <li><strong>Revenue Generation:</strong> Earns money through various automated activities</li>
                      <li><strong>Market Analysis:</strong> Continuously monitors and responds to market conditions</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Revenue Distribution System
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Revenue generated by your agent is automatically distributed:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Proportional Distribution:</strong> Revenue is split among all token holders based on their holdings</li>
                      <li><strong>Real-time Processing:</strong> Distributions happen immediately when revenue is generated</li>
                      <li><strong>Transparent Tracking:</strong> All revenue events are logged in the Activities tab</li>
                      <li><strong>Token Holder Rewards:</strong> The more tokens someone holds, the more revenue they receive</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Twitter className="w-4 h-4" />
                    Twitter Integration
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Connect your Twitter API to enable autonomous posting:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Strategic Content:</strong> AI generates engaging posts to grow your community</li>
                      <li><strong>Real Posting:</strong> Uses Twitter's official API with your credentials</li>
                      <li><strong>Revenue Driver:</strong> Social engagement can increase token value and revenue</li>
                      <li><strong>Secure Storage:</strong> Your credentials are encrypted and securely stored</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Framework: {agent.framework}</h3>
                  <p className="text-sm text-muted-foreground">
                    Your agent is powered by the {agent.framework} framework, providing advanced 
                    autonomous capabilities, market interaction features, and AI-driven decision making.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Next Steps:</h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Set up Twitter API credentials (if desired)</li>
                    <li>Click "Execute Agent Now" to see it in action</li>
                    <li>Monitor activities and revenue in the Activities tab</li>
                    <li>Chat with your agent to test its responses</li>
                    <li>Watch as it runs autonomously every 15 minutes!</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}