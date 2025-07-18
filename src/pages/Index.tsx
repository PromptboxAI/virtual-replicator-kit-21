import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketStats } from '@/components/MarketStats';
import { useAgents, type Agent } from '@/hooks/useAgents';
import { useAuth } from '@/hooks/useAuth';
import { TermsModal } from '@/components/TermsModal';
import { 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Users, 
  Zap, 
  Star,
  BarChart3,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Agent Card Component for Index page
function IndexAgentCard({ agent }: { agent: Agent }) {
  const navigate = useNavigate();
  const isPositive = (agent.price_change_24h || 0) > 0;
  
  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) return '$0.00';
    if (price < 0.000001) return price.toExponential(3);
    if (price < 1) return price.toFixed(6); // 4+ decimals for numbers starting with 0
    return price.toFixed(2); // 2 decimals for numbers 1 and above
  };

  const formatMarketCap = (marketCap?: number | null) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1000000) return `$${(marketCap / 1000000).toFixed(1)}M`;
    if (marketCap >= 1000) return `$${(marketCap / 1000).toFixed(1)}K`;
    return `$${marketCap.toFixed(0)}`;
  };
  
  const handleCardClick = () => {
    navigate(`/trade/${agent.id}`);
  };
  
  return (
    <Card 
      className="p-4 bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary/20 group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {agent.avatar_url ? (
            <img
              src={agent.avatar_url}
              alt={agent.name}
              className="w-12 h-12 rounded-full border-2 border-primary/30 group-hover:border-primary/60 transition-colors object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 group-hover:border-primary/60 transition-colors bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {agent.symbol?.substring(0, 2) || agent.name.substring(0, 2)}
              </span>
            </div>
          )}
          <div>
            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {agent.name}
            </h4>
            <Badge variant="outline" className="text-xs">
              ${agent.symbol}
            </Badge>
          </div>
        </div>
        
        <Button size="sm" variant="default" className="opacity-0 group-hover:opacity-100 transition-opacity">
          Trade
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">${formatPrice(agent.current_price)}</span>
          {agent.price_change_24h !== undefined && (
            <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}{Math.abs(agent.price_change_24h).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Market Cap</span>
            <div className="font-medium text-foreground">{formatMarketCap(agent.market_cap)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Volume</span>
            <div className="font-medium text-foreground">{formatMarketCap(agent.volume_24h)}</div>
          </div>
        </div>
        
        {/* Bonding Curve Progress */}
        <div className="h-2 bg-muted/20 rounded relative overflow-hidden">
          {agent.token_graduated ? (
            // Graduated agents show full progress bar in green
            <div className="h-full bg-green-600 transition-all w-full" />
          ) : (
            // Non-graduated agents show bonding curve progress
            <div 
              className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all"
              style={{ 
                width: `${Math.min(((agent.prompt_raised || 0) / (agent.graduation_threshold || 42000)) * 100, 100)}%` 
              }}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

const Index = () => {
  const { agents, loading, error } = useAgents();
  const { showTermsModal, handleAcceptTerms } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'trending' | 'new' | 'active'>('all');

  // Get spotlight agent (highest market cap agent)
  const spotlightAgent = agents?.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))[0];
  
  // Get trending agents (top 6 by 24h change)
  const trendingAgents = agents
    ?.filter(agent => agent.price_change_24h !== undefined)
    .sort((a, b) => (b.price_change_24h || 0) - (a.price_change_24h || 0))
    .slice(0, 6) || [];

  // Get new agents (recent launches, sorted by market cap)
  const newAgents = agents
    ?.filter(agent => (agent.market_cap || 0) < 1000000) // Under 1M market cap
    .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
    .slice(0, 6) || [];

  // Get active agents (all active agents)
  const activeAgents = agents
    ?.filter(agent => agent.is_active)
    .slice(0, 6) || [];

  const getFilteredAgents = () => {
    switch (activeFilter) {
      case 'trending':
        return trendingAgents;
      case 'new':
        return newAgents;
      case 'active':
        return activeAgents;
      default:
        return agents?.slice(0, 6) || [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading agents...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 mt-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-6xl font-bold text-black">
              Tokenized AI Agents
            </h1>
          </div>
          <p className="text-base font-normal tracking-normal max-w-2xl mx-auto mb-6" style={{ color: '#000000' }}>
            Discover, create and trade autonomous AI Agents.<br />
            Powered by Base Network.<br />
            Loved by Web3 and DeSci Teams.
          </p>
          <div className="flex justify-center mb-8">
            <Button asChild size="lg" className="bg-black text-white hover:bg-black/90">
              <Link to="/agents">
                Explore All Agents
              </Link>
            </Button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="mb-12">
          <MarketStats />
        </div>

        {/* Spotlight Agent */}
        {spotlightAgent && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-foreground">Spotlight Agent</h2>
            </div>
            <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {spotlightAgent.avatar_url ? (
                    <img
                      src={spotlightAgent.avatar_url}
                      alt={spotlightAgent.name}
                      className="w-16 h-16 rounded-full border-2 border-primary object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                      <Activity className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{spotlightAgent.name}</h3>
                    <Badge className="bg-primary text-primary-foreground">${spotlightAgent.symbol}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-foreground">
                    ${spotlightAgent.current_price < 1 
                      ? spotlightAgent.current_price.toFixed(6) 
                      : spotlightAgent.current_price.toFixed(2)
                    }
                  </div>
                  {spotlightAgent.market_cap && (
                    <div className="text-sm text-muted-foreground">
                      Market Cap: {spotlightAgent.market_cap >= 1000000 
                        ? `$${(spotlightAgent.market_cap / 1000000).toFixed(1)}M`
                        : `$${(spotlightAgent.market_cap / 1000).toFixed(1)}K`
                      }
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  onClick={() => navigate(`/trade/${spotlightAgent.id}`)}
                  className="bg-black text-white hover:bg-black/90"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Trade {spotlightAgent.symbol}
                </Button>
              </div>
            </Card>
          </section>
        )}

        {/* Agent Categories */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Discover Agents</h2>
            <Link 
              to="/agents" 
              className="text-black hover:text-gray-700 flex items-center gap-1 text-sm font-medium"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <Button
              variant={activeFilter === 'all' ? 'dashboard' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              All
            </Button>
            <Button
              variant={activeFilter === 'trending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('trending')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </Button>
            <Button
              variant={activeFilter === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('new')}
            >
              <Zap className="mr-2 h-4 w-4" />
              New
            </Button>
            <Button
              variant={activeFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('active')}
            >
              <Star className="mr-2 h-4 w-4" />
              Active
            </Button>
          </div>

          {/* Agent Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredAgents().map((agent) => (
              <IndexAgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {getFilteredAgents().length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No agents found in this category.</p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-primary py-20 relative overflow-hidden">
          {/* Dot pattern overlay */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(100,100,100,0.6) 1px, transparent 1px)`,
              backgroundSize: '8px 8px'
            }}
          ></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="text-sm text-white/60 tracking-widest uppercase mb-4">
              CREATE AGENT
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Launch<br />Your Own AI Agent?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join the decentralized AI economy. Create intelligent agents that generate value 
              for you and your community.
            </p>
            <div className="flex justify-center">
              <Button asChild size="lg" variant="secondary" className="bg-white text-black hover:bg-white/90">
                <Link to="/create">
                  Create Agent
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      {showTermsModal && (
        <TermsModal 
          open={showTermsModal} 
          onAccept={handleAcceptTerms} 
        />
      )}
    </div>
  );
};

export default Index;