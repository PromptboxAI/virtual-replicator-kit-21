import React, { useState } from 'react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketStats } from '@/components/MarketStats';
import { useAgents, type Agent } from '@/hooks/useAgents';
import { useAuth } from '@/hooks/useAuth';
import { TermsModal } from '@/components/TermsModal';
import { isAgentGraduatedV3 } from '@/lib/bondingCurveV3';
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
import { FeaturesSection } from '@/components/FeaturesSection';
import { IntegrationsSection } from '@/components/IntegrationsSection';
import { SecuritySection } from '@/components/SecuritySection';
import { TestimonialsSection } from '@/components/TestimonialsSection';

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
    navigate(`/agent/${agent.id}`);
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
          {isAgentGraduatedV3(agent.prompt_raised || 0) ? (
            // Graduated agents show full progress bar in green
            <div className="h-full bg-green-600 transition-all w-full" />
          ) : (
            // Non-graduated agents show bonding curve progress
            <div 
              className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all"
              style={{ 
                width: `${Math.min(((agent.prompt_raised || 0) / 42000) * 100, 100)}%` 
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

  console.log("Index page - agents loaded:", agents.length, "agents");
  console.log("Index page - sample agent:", agents[0]);

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
      
      <main className="container mx-auto px-4 py-8 relative">
        {/* Hero Section */}
        <div className="text-center mb-12 mt-20 relative">
          {/* Animated Background */}
          <div className="absolute inset-0 -mx-4 -my-8 overflow-hidden">
            <AnimatedBackground />
          </div>
          <div className="text-sm text-muted-foreground tracking-widest uppercase mb-3 relative z-10">
            Funded. Liquid. Verifiable.
          </div>
          <div className="flex items-center justify-center gap-2 mb-4 relative z-10">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-medium text-foreground leading-tight tracking-tight">
              Launch Tokenized AI Agents<br />as Micro-SaaS Businesses
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 relative z-10">
            Promptbox lets you create, fund, and run tokenized AI agents with visual workflows, deep integrations, and on-chain rails - from a growing library of ready-to-launch templates.
          </p>
          <div className="flex justify-center gap-4 mb-8 relative z-10">
            <Button asChild size="default" className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2">
              <Link to="/trade/base/0xDEMO">
                View Demo Agent →
              </Link>
            </Button>
            <Button asChild size="default" variant="outline" className="px-5 py-2">
              <Link to="/agents">
                Explore All Agents
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <FeaturesSection />

        {/* Integrations Section */}
        <IntegrationsSection />
      </main>

      {/* Security Section - Full Width */}
      <SecuritySection />

      <main className="container mx-auto px-4 relative">
        {/* Market Stats */}
        <div className="mb-12">
          <MarketStats />
        </div>

        {/* Spotlight Agent */}
        {spotlightAgent && (
          <section className="mb-12">
            <div className="mb-6">
              <p className="text-sm font-mono text-muted-foreground mb-2 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
                FEATURED
              </p>
              <h2 className="text-2xl font-heading font-medium text-foreground">Spotlight Agent</h2>
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
                    <h3 className="text-2xl font-heading font-medium text-foreground">{spotlightAgent.name}</h3>
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
                  onClick={() => navigate(`/agent/${spotlightAgent.id}`)}
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
            <div>
              <p className="text-sm font-mono text-muted-foreground mb-2 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
                EXPLORE
              </p>
              <h2 className="text-2xl font-heading font-medium text-foreground">Discover Agents</h2>
            </div>
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
      </main>

      {/* Testimonials Section - Full Width */}
      <TestimonialsSection />

      {/* CTA Section - Black background with micro dots */}
      <section className="py-20 bg-foreground relative overflow-hidden">
        {/* Dense primary dot grid */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--background) / 0.08) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />
        {/* Medium density layer */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--background) / 0.05) 0.8px, transparent 0.8px)',
            backgroundSize: '12px 12px',
          }}
        />
        {/* Sparse larger dots for depth variation */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--background) / 0.03) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-medium mb-6 text-background tracking-tight">
              Ready to Build Your AI Agent?
            </h2>
            <p className="text-lg text-background/70 mb-8">
              Start with our platform to create custom autonomous workflows where you control exactly how much independence you want to grant your AI agents.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                variant="secondary" 
                className="gap-2 bg-background text-foreground hover:bg-background/90 px-8 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
              >
                <Link to="/create">
                  Start Building
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-background bg-foreground text-background hover:bg-foreground/90 px-8 transition-all duration-300 hover:scale-105"
              >
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

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
