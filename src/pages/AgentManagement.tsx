import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AgentDashboard } from '@/components/AgentDashboard';
import { TradingInterface } from '@/components/TradingInterface';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AgentManagement() {
  const { agentId } = useParams();
  const { user } = useAuth();

  if (!agentId) {
    return <Navigate to="/my-agents" replace />;
  }

  const { data: agent, isLoading, error } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading agent details...</p>
            </div>
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
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The agent you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'ACTIVATING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Activating</Badge>;
      case 'AVAILABLE':
        return <Badge variant="outline" className="text-green-600 border-green-600">Live</Badge>;
      case 'INACTIVE':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Agent Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={agent.avatar_url || ''} />
                  <AvatarFallback>
                    {agent.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{agent.name}</h1>
                    <Badge variant="secondary">${agent.symbol}</Badge>
                    {getStatusBadge(agent.status)}
                  </div>
                  {agent.description && (
                    <p className="text-muted-foreground">{agent.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Framework: {agent.framework}</span>
                    <span>Created: {new Date(agent.created_at).toLocaleDateString()}</span>
                    {agent.category && <span>Category: {agent.category}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${agent.current_price >= 0.01 ? agent.current_price.toFixed(2) : agent.current_price.toFixed(6)}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Price</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Dashboard - Autonomous execution interface */}
          <AgentDashboard agent={{
            id: agent.id,
            name: agent.name,
            symbol: agent.symbol,
            description: agent.description || `AI agent for ${agent.name}`,
            current_price: agent.current_price,
            avatar_url: agent.avatar_url
          }} />

          {/* Trading Interface */}
          <div className="mt-8">
            <TradingInterface
              agentId={agent.id}
              agentName={agent.name}
              agentSymbol={agent.symbol}
              tokenAddress={agent.token_address || undefined}
              isConnected={false} // This would come from wallet connection state
              onConnect={() => {}} // Implement wallet connection
              currentPrice={agent.current_price}
              marketCap={agent.market_cap || 0}
              volume24h={agent.volume_24h || 0}
              priceChange24h={agent.price_change_24h || 0}
              promptRaised={agent.prompt_raised || 0}
              tokenHolders={agent.token_holders || 0}
              circulatingSupply={agent.circulating_supply || 0}
              tokenGraduated={agent.token_graduated || false}
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}