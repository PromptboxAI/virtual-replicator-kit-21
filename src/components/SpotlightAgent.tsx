import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface SpotlightAgentProps {
  agent: {
    id: string;
    name: string;
    symbol: string;
    avatar_url?: string;
    description?: string;
    current_price: number;
    price_change_24h?: number;
    market_cap?: number;
    volume_24h?: number;
    token_holders?: number;
    token_graduated?: boolean;
    prompt_raised?: number;
    category?: string;
  };
}

export function SpotlightAgent({ agent }: SpotlightAgentProps) {
  const isPositive = (agent.price_change_24h || 0) > 0;
  
  const formatPrice = (price?: number) => {
    if (typeof price !== 'number' || isNaN(price)) return '$0.00';
    if (price < 0.000001) return price.toExponential(3);
    if (price < 0.01) return price.toFixed(6);
    return price.toFixed(4);
  };

  const formatMarketCap = (marketCap?: number) => {
    if (typeof marketCap !== 'number' || isNaN(marketCap)) return 'N/A';
    if (marketCap >= 1000000) return `$${(marketCap / 1000000).toFixed(1)}M`;
    if (marketCap >= 1000) return `$${(marketCap / 1000).toFixed(1)}K`;
    return `$${marketCap.toFixed(0)}`;
  };
  
  return (
    <div className="relative">
      {/* Spotlight Badge */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow"></div>
        <span className="text-sm text-muted-foreground">Spotlight Agent</span>
      </div>
      
      <Card className="p-6 bg-gradient-dark border-primary/20 shadow-glow-primary">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {agent.avatar_url ? (
                <img
                  src={agent.avatar_url}
                  alt={agent.name}
                  className="w-16 h-16 rounded-full border-2 border-primary/50 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/50">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full border-2 border-card flex items-center justify-center">
                <Activity className="w-3 h-3 text-secondary-foreground" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-foreground">{agent.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">${agent.symbol}</Badge>
                {agent.token_graduated && (
                  <Badge variant="default">Graduated</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">${formatPrice(agent.current_price)}</div>
            {agent.price_change_24h !== undefined && (
              <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isPositive ? '+' : ''}{Math.abs(agent.price_change_24h).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground">Market Cap</div>
            <div className="text-lg font-semibold text-foreground">
              {agent.market_cap ? formatMarketCap(agent.market_cap) : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">24h Volume</div>
            <div className="text-lg font-semibold text-foreground">
              {agent.volume_24h ? formatMarketCap(agent.volume_24h) : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Holders</div>
            <div className="text-lg font-semibold text-foreground">
              {agent.token_holders?.toLocaleString() || '0'}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">PROMPT Raised</div>
            <div className="text-lg font-semibold text-foreground">
              {agent.prompt_raised?.toLocaleString() || '0'}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">Description</div>
          <p className="text-sm text-foreground">{agent.description || 'No description available'}</p>
        </div>

        {/* Bonding Curve Progress / Live Status */}
        {agent.token_graduated ? (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">LIVE</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full transition-all w-full" />
            </div>
          </div>
        ) : (
          agent.prompt_raised !== undefined && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Bonding Curve Progress</span>
                <span>{agent.prompt_raised.toLocaleString()} / 42,000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((agent.prompt_raised / 42000) * 100, 100)}%` }}
                />
              </div>
            </div>
          )
        )}
        
        {/* Performance Chart Placeholder */}
        <div className="h-20 bg-muted/20 rounded-lg border border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
          <svg className="w-full h-full" viewBox="0 0 300 80">
            <polyline
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              points="0,60 30,45 60,50 90,30 120,35 150,20 180,25 210,15 240,20 270,10 300,15"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </Card>
    </div>
  );
}