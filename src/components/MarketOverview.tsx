import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Users, Activity, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TradingAgentCard } from '@/components/TradingAgentCard';
import { useMarketOverview } from '@/hooks/useMarketOverview';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketOverviewProps {
  agents?: any[];
}

export function MarketOverview({ agents = [] }: MarketOverviewProps) {
  const navigate = useNavigate();
  const { data: marketData, isLoading } = useMarketOverview();

  // Use real agents data only
  const agentsToShow = agents || [];

  return (
    <div className="space-y-8">
      {/* Market Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Market Cap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(marketData?.total_market_cap_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">USD</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  24h Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(marketData?.total_volume_24h_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketData?.total_agents || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {marketData?.bonding_curve_agents || 0} on curve
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Graduated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketData?.graduated_agents || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Trading on DEX</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Top Gainers */}
      {marketData?.top_gainers && marketData.top_gainers.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Top Gainers (24h)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketData.top_gainers.slice(0, 6).map((agent) => (
              <Card 
                key={agent.agent_id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/agents/${agent.agent_id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.symbol}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${agent.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {agent.price_change_24h >= 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      <span className="font-semibold">
                        {agent.price_change_24h >= 0 ? '+' : ''}{agent.price_change_24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">${agent.current_price.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Vol:</span>
                      <span className="font-medium">${agent.volume_24h.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Agent Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">All Agents</h2>
          <Button onClick={() => navigate('/agents')} className="gap-2">
            <Activity className="h-4 w-4" />
            See All Agents
          </Button>
        </div>

        {agentsToShow.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentsToShow.map((agent) => (
              <TradingAgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No agents available in this mode</p>
          </div>
        )}
      </div>
    </div>
  );
}