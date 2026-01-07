import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAgentRealtime } from '@/hooks/useAgentRealtime';
import { formatMarketCapUSD } from '@/lib/formatters';
import { getAgentGraduationThreshold } from '@/services/GraduationService';
import { PriceDisplay } from './PriceDisplay';
import { useAgentFDV } from '@/hooks/useAgentFDV';

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
  const [graduationThreshold, setGraduationThreshold] = useState<number>(42160);
  
  // Real-time graduation status - Phase 3 implementation
  const { isGraduated } = useAgentRealtime(agent.id, {
    id: agent.id,
    prompt_raised: agent.prompt_raised || 0,
    current_price: agent.current_price,
    market_cap: agent.market_cap,
    token_holders: agent.token_holders
  });
  
  useEffect(() => {
    getAgentGraduationThreshold(agent.id).then(setGraduationThreshold);
  }, [agent.id]);
  
  const marketCap = useAgentFDV(agent.id);
  
  const handleTradeClick = () => {
    navigate(`/agent/${agent.id}`);
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
                {isGraduated && (
                  <Badge className="bg-black text-white hover:bg-gray-800">Graduated</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <PriceDisplay agentId={agent.id} variant="compact" showBoth={false} />
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
              {formatMarketCapUSD(marketCap)}
            </div>
          </div>
          
          <div>
            <div className="text-muted-foreground">24h Volume</div>
            <div className="font-medium">
              {agent.volume_24h ? formatMarketCapUSD(agent.volume_24h) : 'N/A'}
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
        {isGraduated ? (
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
                <span>{agent.prompt_raised.toLocaleString()} / {graduationThreshold.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min((agent.prompt_raised / graduationThreshold) * 100, 100)}%` }}
                />
              </div>
            </div>
          )
        )}

        <Button 
          onClick={handleTradeClick}
          className="w-full bg-black text-white hover:bg-black/90 border border-black"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Trade {agent.symbol}
        </Button>
      </CardContent>
    </Card>
  );
}
