import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Code, 
  Zap, 
  Camera, 
  ExternalLink, 
  CalendarDays, 
  Activity,
  TrendingUp,
  TrendingDown,
  Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Agent {
  id: string;
  name: string;
  symbol: string;
  avatar_url?: string;
  current_price: number;
  prompt_raised: number;
  token_holders: number;
  volume_24h: number;
  market_cap: number;
  created_at: string;
  token_graduated: boolean;
  graduation_threshold: number;
  description?: string;
  category?: string;
  framework?: string;
  creator_id?: string;
}

interface AgentInformationSectionsProps {
  agent: Agent;
}

interface MarketingData {
  screenshots?: string[];
  demo_videos?: string[];
  description?: string;
  website_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  discord_url?: string;
  telegram_url?: string;
  whitepaper_url?: string;
}

interface Trade {
  id: string;
  user_id: string;
  token_amount: number;
  prompt_amount: number;
  price_per_token: number;
  created_at: string;
  transaction_type: 'buy' | 'sell';
}

export const AgentInformationSections = ({ agent }: AgentInformationSectionsProps) => {
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAgentData();
  }, [agent.id]);

  const loadAgentData = async () => {
    try {
      // Load marketing data
      const { data: marketing } = await supabase
        .from('agent_marketing')
        .select('*')
        .eq('agent_id', agent.id)
        .maybeSingle();

      if (marketing) {
        setMarketingData({
          screenshots: Array.isArray(marketing.screenshots) ? marketing.screenshots.map(String) : [],
          demo_videos: Array.isArray(marketing.demo_videos) ? marketing.demo_videos.map(String) : [],
          description: marketing.description,
          website_url: marketing.website_url,
          youtube_url: marketing.youtube_url,
          twitter_url: marketing.twitter_url,
          discord_url: marketing.discord_url,
          telegram_url: marketing.telegram_url,
          whitepaper_url: marketing.whitepaper_url
        });
      }

      // Load recent trades
      const { data: buyTrades } = await supabase
        .from('agent_token_buy_trades')
        .select('id, user_id, token_amount, prompt_amount, price_per_token, created_at')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: sellTrades } = await supabase
        .from('agent_token_sell_trades')
        .select('id, user_id, token_amount, prompt_amount, price_per_token, created_at')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const allTrades = [
        ...(buyTrades || []).map(t => ({ ...t, transaction_type: 'buy' as const })),
        ...(sellTrades || []).map(t => ({ ...t, transaction_type: 'sell' as const }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTrades(allTrades.slice(0, 10));
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`;
    return amount.toFixed(2);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading agent information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* The Team Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            The Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={agent.avatar_url} alt="Creator" />
              <AvatarFallback>
                <Users className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">Agent Creator</h4>
              <p className="text-sm text-muted-foreground">
                {agent.creator_id ? formatAddress(agent.creator_id) : 'Anonymous'}
              </p>
              <p className="text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(agent.created_at))} ago
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Snapshots/Videos */}
      {marketingData && (marketingData.screenshots?.length || marketingData.demo_videos?.length) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Snapshots/Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketingData.screenshots && marketingData.screenshots.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Screenshots</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {marketingData.screenshots.map((screenshot, index) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden border">
                        <img 
                          src={screenshot} 
                          alt={`${agent.name} Screenshot ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(screenshot, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {marketingData.demo_videos && marketingData.demo_videos.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Demo Videos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {marketingData.demo_videos.map((video, index) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                        <div className="text-center">
                          <Play className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <p className="text-sm font-medium">Demo Video {index + 1}</p>
                          <Button 
                            variant="link" 
                            size="sm"
                            onClick={() => window.open(video, '_blank')}
                          >
                            Watch Video
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground">
              {marketingData?.description || agent.description || 'This AI agent provides automated capabilities using advanced machine learning and blockchain integration.'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <span className="text-sm text-muted-foreground">Framework:</span>
              <div className="font-medium">{agent.framework || 'G.A.M.E.'}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Category:</span>
              <div className="font-medium">{agent.category || 'AI Agent'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </CardContent>
      </Card>

      {/* Agent Overview (Long Description/Whitepaper) */}
      {marketingData?.whitepaper_url && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Agent Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Detailed technical documentation and comprehensive overview of the agent's architecture, capabilities, and roadmap.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.open(marketingData.whitepaper_url, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Whitepaper
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trades History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length > 0 ? (
            <div className="space-y-3">
              {trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={trade.transaction_type === 'buy' ? 'default' : 'outline'}
                      className={trade.transaction_type === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700 text-white'}
                    >
                      {trade.transaction_type === 'buy' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {trade.transaction_type.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-medium">
                        {formatAmount(trade.token_amount)} {agent.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatAddress(trade.user_id)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatAmount(trade.prompt_amount)} PROMPT
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(trade.created_at))} ago
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No trades yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Holder Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Holder Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {agent.token_holders}
              </div>
              <div className="text-sm text-muted-foreground">Total Holders</div>
            </div>
            
            {/* Placeholder for holder distribution chart */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Top 10 Holders</span>
                <span>0%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-0"></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Detailed holder distribution will be available as trading activity increases
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      {marketingData && (marketingData.website_url || marketingData.youtube_url || marketingData.twitter_url || marketingData.discord_url || marketingData.telegram_url) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Links & Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {marketingData.website_url && (
                <a 
                  href={marketingData.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Website</span>
                </a>
              )}
              
              {marketingData.twitter_url && (
                <a 
                  href={marketingData.twitter_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Twitter</span>
                </a>
              )}
              
              {marketingData.discord_url && (
                <a 
                  href={marketingData.discord_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Discord</span>
                </a>
              )}
              
              {marketingData.telegram_url && (
                <a 
                  href={marketingData.telegram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Telegram</span>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};