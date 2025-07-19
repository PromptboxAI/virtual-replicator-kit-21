
import React from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradingInterface } from '@/components/TradingInterface';
import { BondingCurveChart } from '@/components/BondingCurveChart';
import { AgentActivityFeed } from '@/components/AgentActivityFeed';
import { AgentChat } from '@/components/AgentChat';
import { WorkflowBuilder } from '@/components/WorkflowBuilder';
import { useAgent } from '@/hooks/useAgent';
import { useAuth } from '@/hooks/useAuth';
import { Activity, BarChart3, MessageSquare, Settings, User, ExternalLink, Wrench } from 'lucide-react';

const UnifiedAgentPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { agent, loading, error } = useAgent(agentId);
  const { user } = useAuth();
  
  console.log('UnifiedAgentPage state:', { agentId, agent: agent ? { id: agent.id, name: agent.name } : null, loading, error });
  
  const isCreator = user && agent?.creator_id === user.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading agent...</p>
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
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Agent Not Found</h1>
            <p className="text-muted-foreground">{error || "The agent you're looking for doesn't exist or may be in a different mode."}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Agent Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            {agent.avatar_url ? (
              <img
                src={agent.avatar_url}
                alt={agent.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                <Activity className="h-10 w-10 text-primary" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{agent.name}</h1>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  ${agent.symbol}
                </Badge>
                {agent.token_graduated && (
                  <Badge className="bg-green-600 text-white">Graduated</Badge>
                )}
              </div>
              
              {agent.description && (
                <p className="text-muted-foreground text-lg mb-3">{agent.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Category: {agent.category || 'General'}</span>
                <span>•</span>
                <span>Price: ${agent.current_price < 1 ? agent.current_price.toFixed(6) : agent.current_price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="trade" className="w-full">
          <TabsList className={`grid w-full ${isCreator ? 'grid-cols-5' : 'grid-cols-4'} mb-8`}>
            <TabsTrigger value="trade" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Trade
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Info
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
            {isCreator && (
              <TabsTrigger value="workflow" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Workflow Builder
              </TabsTrigger>
            )}
            {isCreator && (
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Manage
              </TabsTrigger>
            )}
          </TabsList>

          {/* Trade Tab */}
          <TabsContent value="trade" className="space-y-6">
            <TradingInterface
              agentId={agent.id}
              agentName={agent.name}
              agentSymbol={agent.symbol}
              tokenAddress=""
              isConnected={!!user}
              currentPrice={agent.current_price}
              marketCap={agent.market_cap || 0}
              volume24h={agent.volume_24h || 0}
              priceChange24h={agent.price_change_24h || 0}
              promptRaised={agent.prompt_raised || 0}
              tokenHolders={0}
              circulatingSupply={0}
              tokenGraduated={agent.token_graduated || false}
            />
            
            {!agent.token_graduated && (
              <BondingCurveChart
                currentTokensSold={0}
                graduationThreshold={agent.graduation_threshold || 42000}
                promptRaised={agent.prompt_raised || 0}
              />
            )}
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Name</h4>
                    <p className="text-foreground">{agent.name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Symbol</h4>
                    <p className="text-foreground">${agent.symbol}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Category</h4>
                    <p className="text-foreground">{agent.category || 'General'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                    <p className="text-foreground">{agent.description || 'No description available'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                    <Badge variant={agent.is_active ? "default" : "secondary"}>
                      {agent.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Token Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Current Price</h4>
                    <p className="text-foreground text-lg font-semibold">
                      ${agent.current_price < 1 ? agent.current_price.toFixed(6) : agent.current_price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Market Cap</h4>
                    <p className="text-foreground">
                      {agent.market_cap ? `$${agent.market_cap.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">24h Volume</h4>
                    <p className="text-foreground">
                      {agent.volume_24h ? `$${agent.volume_24h.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">PROMPT Raised</h4>
                    <p className="text-foreground">
                      {agent.prompt_raised?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Token Holders</h4>
                    <p className="text-foreground">0</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Contract Address</h4>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        Not deployed yet
                      </code>
                      <ExternalLink className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentActivityFeed agent={agent} />
              <AgentChat agent={agent} />
            </div>
          </TabsContent>

          {/* Workflow Builder Tab (only for creators) */}
          {isCreator && (
            <TabsContent value="workflow" className="space-y-6">
              <WorkflowBuilder 
                agentId={agent.id} 
                agentName={agent.name}
                onComplete={() => {
                  // Optional: handle workflow completion
                }}
              />
            </TabsContent>
          )}

          {/* Manage Tab (only for creators) */}
          {isCreator && (
            <TabsContent value="manage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Management features for your agent will be available here.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Settings className="w-4 h-4" />
                    <span>Coming soon: Advanced management controls</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default UnifiedAgentPage;
