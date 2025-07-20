import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Users, Activity, Code, Zap, Camera, BarChart3, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isAgentGraduated } from '@/lib/bondingCurve';

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
    marketing_data?: {
      screenshots?: string[];
      demo_videos?: string[];
      description?: string;
      website_url?: string;
      youtube_url?: string;
      twitter_url?: string;
      discord_url?: string;
      telegram_url?: string;
    };
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

  useEffect(() => {
    // Load marketing data when component mounts
    loadMarketingData();
  }, [agent.id]);

  const [marketingData, setMarketingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMarketingData = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_marketing')
        .select('*')
        .eq('agent_id', agent.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading marketing data:', error);
        return;
      }

      setMarketingData(data);
    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasScreenshots = marketingData?.screenshots && Array.isArray(marketingData.screenshots) && marketingData.screenshots.length > 0;
  const hasMarketingDescription = marketingData?.description;
  
  // Live graduation calculation - Phase 3 implementation
  const isGraduated = isAgentGraduated(agent.prompt_raised || 0);

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
                {isGraduated && (
                  <Badge className="bg-green-600 text-white hover:bg-green-700">Graduated</Badge>
                )}
                {agent.is_active && (
                  <Badge className="bg-blue-600 text-white hover:bg-blue-700">Active</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-muted-foreground">
              {hasMarketingDescription ? marketingData.description : (agent.description || 'This AI agent provides automated capabilities using advanced machine learning and blockchain integration.')}
            </p>
          </div>
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
              <BarChart3 className="h-5 w-5" />
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
            {!isGraduated && agent.prompt_raised !== undefined && (
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
              {hasMarketingDescription ? marketingData.description : (agent.description || 'This AI agent provides automated capabilities using advanced machine learning and blockchain integration.')}
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
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
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
            
            {hasScreenshots ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketingData.screenshots.map((screenshot: string, index: number) => (
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
            ) : (
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
            )}
            
            {!hasScreenshots && (
              <p className="text-xs text-muted-foreground">
                Screenshots will be available once the creator uploads them via the Agent Dashboard.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Links & Resources */}
      {marketingData && (marketingData.website_url || marketingData.youtube_url || marketingData.twitter_url || marketingData.discord_url || marketingData.telegram_url || marketingData.whitepaper_url) && (
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
              
              {marketingData.youtube_url && (
                <a 
                  href={marketingData.youtube_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">YouTube</span>
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
                  <span className="text-sm font-medium">X (Twitter)</span>
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
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
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
              
              {marketingData.whitepaper_url && (
                <a 
                  href={marketingData.whitepaper_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Whitepaper</span>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}