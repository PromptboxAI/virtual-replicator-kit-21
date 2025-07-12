import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, Users, DollarSign, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgentCardProps {
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
  };
}

export function TradingAgentCard({ agent }: AgentCardProps) {
  const navigate = useNavigate();
  
  const handleTradeClick = () => {
    navigate(`/trade/${agent.id}`);
  };

  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(3);
    if (price < 0.01) return price.toFixed(6);
    return price.toFixed(4);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000) return `$${(marketCap / 1000000).toFixed(1)}M`;
    if (marketCap >= 1000) return `$${(marketCap / 1000).toFixed(1)}K`;
    return `$${marketCap.toFixed(0)}`;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {agent.avatar_url ? (
              <img
                src={agent.avatar_url}
                alt={agent.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">${agent.symbol}</Badge>
                {agent.token_graduated && (
                  <Badge variant="default">Graduated</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-semibold">
              ${formatPrice(agent.current_price)}
            </div>
            {agent.price_change_24h !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${
                agent.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {agent.price_change_24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(agent.price_change_24h).toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="min-h-[2.5rem]">
          {agent.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {agent.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60">No description available</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Market Cap</div>
            <div className="font-medium">
              {agent.market_cap ? formatMarketCap(agent.market_cap) : 'N/A'}
            </div>
          </div>
          
          <div>
            <div className="text-muted-foreground">24h Volume</div>
            <div className="font-medium">
              {agent.volume_24h ? formatMarketCap(agent.volume_24h) : 'N/A'}
            </div>
          </div>
          
          <div>
            <div className="text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Holders
            </div>
            <div className="font-medium">
              {agent.token_holders?.toLocaleString() || '0'}
            </div>
          </div>
          
          <div>
            <div className="text-muted-foreground">PROMPT Raised</div>
            <div className="font-medium">
              {agent.prompt_raised?.toLocaleString() || '0'}
            </div>
          </div>
        </div>

        {/* Bonding Curve Progress / Live Status */}
        {agent.token_graduated ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-green-600 font-medium">LIVE</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-green-600 h-1.5 rounded-full transition-all w-full" />
            </div>
          </div>
        ) : (
          agent.prompt_raised !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Bonding Curve Progress</span>
                <span>{agent.prompt_raised.toLocaleString()} / 42,000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min((agent.prompt_raised / 42000) * 100, 100)}%` }}
                />
              </div>
            </div>
          )
        )}

        <Button 
          onClick={handleTradeClick}
          className="w-full group-hover:bg-primary/90 transition-colors"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Trade {agent.symbol}
        </Button>
      </CardContent>
    </Card>
  );
}