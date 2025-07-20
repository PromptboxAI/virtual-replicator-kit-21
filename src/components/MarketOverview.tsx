import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Users, Activity, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TradingAgentCard } from '@/components/TradingAgentCard';
import { isAgentGraduated } from '@/lib/bondingCurve';

interface MarketOverviewProps {
  agents?: any[];
}

export function MarketOverview({ agents = [] }: MarketOverviewProps) {
  const navigate = useNavigate();

  // Use real agents data only
  const agentsToShow = agents || [];

  const totalMarketCap = agentsToShow.reduce((sum, agent) => sum + (agent.market_cap || 0), 0);
  const totalVolume = agentsToShow.reduce((sum, agent) => sum + (agent.volume_24h || 0), 0);
  const totalAgents = agentsToShow.length;
  // Live graduation calculation - Phase 3 implementation
  const graduatedAgents = agentsToShow.filter(agent => isAgentGraduated(agent.prompt_raised || 0)).length;

  return (
    <div className="space-y-6">
      {/* Agent Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => navigate('/agents')} className="gap-2 bg-black text-white hover:bg-black/90 border border-black">
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