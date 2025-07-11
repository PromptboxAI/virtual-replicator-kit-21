import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Users, Activity, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TradingAgentCard } from '@/components/TradingAgentCard';

interface MarketOverviewProps {
  agents?: any[];
}

export function MarketOverview({ agents = [] }: MarketOverviewProps) {
  const navigate = useNavigate();

  // Mock data for demonstration
  const mockAgents = agents.length ? agents : [
    {
      id: '1',
      name: 'TradingBot Alpha',
      symbol: 'TBA',
      avatar_url: '/placeholder.svg',
      description: 'Advanced trading bot for crypto markets with AI-powered strategies.',
      current_price: 0.02756,
      price_change_24h: 5.67,
      market_cap: 275600,
      volume_24h: 45230,
      token_holders: 1284,
      token_graduated: false,
      prompt_raised: 15420
    },
    {
      id: '2',
      name: 'DataAnalyst Pro',
      symbol: 'DAP',
      avatar_url: '/placeholder.svg',
      description: 'AI agent specialized in market data analysis and trend prediction.',
      current_price: 0.01945,
      price_change_24h: -2.34,
      market_cap: 194500,
      volume_24h: 28970,
      token_holders: 892,
      token_graduated: true,
      prompt_raised: 42000
    },
    {
      id: '3',
      name: 'SocialMedia Bot',
      symbol: 'SMB',
      avatar_url: '/placeholder.svg',
      description: 'Automated social media management and content creation agent.',
      current_price: 0.00834,
      price_change_24h: 12.89,
      market_cap: 83400,
      volume_24h: 18450,
      token_holders: 567,
      token_graduated: false,
      prompt_raised: 8340
    }
  ];

  const totalMarketCap = mockAgents.reduce((sum, agent) => sum + (agent.market_cap || 0), 0);
  const totalVolume = mockAgents.reduce((sum, agent) => sum + (agent.volume_24h || 0), 0);
  const totalAgents = mockAgents.length;
  const graduatedAgents = mockAgents.filter(agent => agent.token_graduated).length;

  return (
    <div className="space-y-6">
      {/* Agent Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => navigate('/create')} className="gap-2">
            <Activity className="h-4 w-4" />
            Create Agent
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockAgents.map((agent) => (
            <TradingAgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex items-center justify-center gap-4 pt-8 border-t">
        <Button variant="link" size="sm">
          <ExternalLink className="h-3 w-3 mr-1" />
          View on Base Scanner
        </Button>
        <Button variant="link" size="sm">
          <ExternalLink className="h-3 w-3 mr-1" />
          Uniswap Analytics
        </Button>
      </div>
    </div>
  );
}