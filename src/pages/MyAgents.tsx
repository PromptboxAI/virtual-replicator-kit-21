import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Bot, TrendingUp, TrendingDown, DollarSign, Users, Plus, Loader2, AlertCircle, Zap, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyAgents } from "@/hooks/useMyAgents";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export default function MyAgents() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { myAgents, loading, error } = useMyAgents(user?.id);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (myAgents.length > 0) {
      fetchAgentStatuses();
    }
  }, [myAgents]);

  const fetchAgentStatuses = async () => {
    const statuses: Record<string, any> = {};
    
    for (const agent of myAgents) {
      try {
        const { data } = await supabase.functions.invoke('agent-runtime', {
          body: { action: 'get_status', agentId: agent.id }
        });
        
        if (data?.success) {
          statuses[agent.id] = data.status;
        }
      } catch (error) {
        console.error(`Failed to fetch status for agent ${agent.id}:`, error);
      }
    }
    
    setAgentStatuses(statuses);
  };

  const executeAgentCycle = async (agentId: string) => {
    try {
      await supabase.functions.invoke('agent-runtime', {
        body: { action: 'execute_cycle', agentId }
      });
      
      toast({
        title: "Agent Activated",
        description: "Agent execution cycle started successfully",
      });
      
      // Refresh status after a delay
      setTimeout(() => fetchAgentStatuses(), 2000);
    } catch (error) {
      toast({
        title: "Activation Failed",
        description: "Failed to start agent execution",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your agents...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show login required state
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to view your created agents.
            </p>
            <Button onClick={signIn}>Sign In</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(price);
  };

  const formatLargeNumber = (num: number | null) => {
    if (!num) return '$0';
    
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'ACTIVATING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Activating</Badge>;
      case 'AVAILABLE':
        return <Badge variant="outline" className="text-green-600 border-green-600">Live</Badge>;
      case 'INACTIVE':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-cyber bg-clip-text text-transparent">
                  My AI Agents
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Manage and track your created AI agents
              </p>
            </div>
            <Link to="/create">
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Create New Agent
              </Button>
            </Link>
          </div>

          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error loading agents: {error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Summary */}
          {myAgents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Total Agents</span>
                  </div>
                  <p className="text-2xl font-bold">{myAgents.length}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-muted-foreground">Total Market Cap</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatLargeNumber(myAgents.reduce((sum, agent) => sum + (agent.market_cap || 0), 0))}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Active Agents</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {myAgents.filter(agent => agent.status === 'AVAILABLE').length}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-muted-foreground">Avg Price</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatPrice(myAgents.reduce((sum, agent) => sum + agent.current_price, 0) / Math.max(myAgents.length, 1))}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Agents List */}
          {myAgents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Agents Created Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't created any AI agents yet. Start building your first agent to see it listed here.
                </p>
                <Link to="/create">
                  <Button className="bg-gradient-primary hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Agent
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAgents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={agent.avatar_url || ''} />
                          <AvatarFallback>
                            {agent.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <CardDescription>${agent.symbol}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(agent.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {agent.category && (
                      <Badge variant="secondary" className="w-fit">
                        {agent.category}
                      </Badge>
                    )}
                    
                    {agent.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {agent.description}
                      </p>
                    )}
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Price</span>
                        <span className="font-medium">{formatPrice(agent.current_price)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Market Cap</span>
                        <span className="font-medium">{formatLargeNumber(agent.market_cap)}</span>
                      </div>
                      
                      {agent.price_change_24h !== null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">24h Change</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            agent.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {agent.price_change_24h >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {agent.price_change_24h.toFixed(2)}%
                          </span>
                        </div>
                      )}
                      
                      {agent.volume_24h !== null && agent.volume_24h > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">24h Volume</span>
                          <span className="font-medium">{formatLargeNumber(agent.volume_24h)}</span>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Agent Runtime Status */}
                    {agentStatuses[agent.id] && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">AI Status</span>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              agentStatuses[agent.id].is_active ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span className="font-medium">
                              {agentStatuses[agent.id].is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tasks Done</span>
                          <span className="font-medium">{agentStatuses[agent.id].tasks_completed || 0}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">AI Revenue</span>
                          <span className="font-medium">${(agentStatuses[agent.id].revenue_generated || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex gap-2">
                      <Link to={`/agent/${agent.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => executeAgentCycle(agent.id)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Execute
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}