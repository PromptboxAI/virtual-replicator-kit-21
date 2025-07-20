import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Users, TrendingUp, Activity, Code, Zap, Camera, BarChart3 } from 'lucide-react';

interface AgentMarketingTabProps {
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
}

export function AgentMarketingTab({ agent }: AgentMarketingTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(3);
    if (price < 0.01) return price.toFixed(6);
    return price.toFixed(2);
  };

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1000000) return `$${(marketCap / 1000000).toFixed(1)}M`;
    if (marketCap >= 1000) return `$${(marketCap / 1000).toFixed(1)}K`;
    return `$${marketCap.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* Agent Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Agent Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={agent.avatar_url} alt={agent.name} />
              <AvatarFallback>
                {agent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-xl font-semibold">{agent.name}</h3>
                <p className="text-muted-foreground">${agent.symbol}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{agent.category || 'AI Agent'}</Badge>
                <Badge variant="outline">{agent.framework || 'G.A.M.E.'}</Badge>
                {agent.token_graduated && (
                  <Badge className="bg-green-600 text-white hover:bg-green-700">Graduated</Badge>
                )}
                {agent.is_active && (
                  <Badge className="bg-blue-600 text-white hover:bg-blue-700">Active</Badge>
                )}
              </div>
            </div>
          </div>
          
          {agent.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{agent.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Technical Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework:</span>
              <span className="font-medium">{agent.framework || 'G.A.M.E.'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{agent.category || 'AI Agent'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Created:</span>
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <span className="font-medium">{formatDate(agent.created_at)}</span>
              </div>
            </div>
            {agent.creator_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creator:</span>
                <span className="font-mono text-sm">{agent.creator_id.slice(0, 8)}...</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Price:</span>
              <span className="font-bold text-lg">${formatPrice(agent.current_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Market Cap:</span>
              <span className="font-medium">{formatMarketCap(agent.market_cap)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Holders:</span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="font-medium">{agent.token_holders?.toLocaleString() || '0'}</span>
              </div>
            </div>
            {!agent.token_graduated && agent.prompt_raised !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">PROMPT Raised:</span>
                <span className="font-medium">{agent.prompt_raised.toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* What This Agent Does */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            What This Agent Does
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {agent.description || 'This AI agent provides automated capabilities using advanced machine learning and blockchain integration.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 border rounded-lg">
                <Code className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">Automated Logic</h4>
                <p className="text-sm text-muted-foreground">Executes predefined workflows and decision trees</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Activity className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">Real-time Processing</h4>
                <p className="text-sm text-muted-foreground">Responds to market conditions and user inputs</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">Performance Tracking</h4>
                <p className="text-sm text-muted-foreground">Monitors and optimizes its own performance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screenshots & Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Screenshots & Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Visual demonstrations of the agent's capabilities and interface.
            </p>
            
            {/* Placeholder for when we have screenshots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Agent Interface Preview</p>
                </div>
              </div>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Performance Dashboard</p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Screenshots will be available once the creator uploads them via the Marketing tab.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}