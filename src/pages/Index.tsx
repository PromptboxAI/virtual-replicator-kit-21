import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpotlightAgent } from "@/components/SpotlightAgent";
import { AgentCard } from "@/components/AgentCard";
import { NetworkVisualization } from "@/components/NetworkVisualization";
import { MarketStats } from "@/components/MarketStats";
import { WalletProfileSync } from "@/components/WalletProfileSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Filter, MoreHorizontal, Loader2 } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import agentAvatar1 from "@/assets/agent-avatar-1.png";
import agentAvatar2 from "@/assets/agent-avatar-2.png";
import agentAvatar3 from "@/assets/agent-avatar-3.png";

const Index = () => {
  const { agents, loading, error } = useAgents();

  // Get spotlight agent (highest market cap)
  const spotlightAgent = agents.length > 0 ? {
    name: agents[0].name,
    avatar: agents[0].avatar_url || agentAvatar1,
    price: `$${agents[0].current_price.toFixed(2)}`,
    change: agents[0].price_change_24h || 0,
    volume: "24h Vol",
    transactions: 1198, // This could be calculated from transactions table
    description: agents[0].description || "AI Agent",
    category: agents[0].category || "AI Agent"
  } : null;

  // Transform agents data for AgentCard component
  const trendingAgents = agents.slice(1).map((agent, index) => ({
    id: agent.id,
    name: agent.name,
    avatar: agent.avatar_url || [agentAvatar1, agentAvatar2, agentAvatar3][index % 3],
    price: `$${agent.current_price.toFixed(2)}`,
    change: agent.price_change_24h || 0,
    volume: agent.volume_24h ? `$${(agent.volume_24h / 1000000).toFixed(1)}M` : "$0",
    category: agent.category || "AI Agent",
    holders: Math.floor(Math.random() * 3000) + 500 // This would come from user_agent_holdings table
  }));

  return (
    <div className="min-h-screen bg-background">
      <WalletProfileSync />
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6">
            <span className="bg-gradient-cyber bg-clip-text text-transparent">
              PromptBox
            </span>
            <br />
            <span className="text-foreground">AI Agents</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The fairest transparent way to co-own AI Agents. Trade, invest, and participate in the autonomous digital economy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow-primary">
              Explore Agents
            </Button>
            <Button size="lg" variant="outline" className="border-primary/50 hover:border-primary">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Market Stats */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <MarketStats />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Spotlight Agent */}
            <div className="lg:col-span-1">
              {spotlightAgent ? (
                <SpotlightAgent agent={spotlightAgent} />
              ) : (
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-border h-full">
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </Card>
              )}
            </div>
            
            {/* Network Visualization */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-border h-full">
                <NetworkVisualization className="h-96" />
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Agents */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Trending AI Agents</h2>
              <p className="text-muted-foreground">Discover the most active agents in the ecosystem</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading agents...</span>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <p className="text-destructive">Error loading agents: {error}</p>
              </div>
            ) : trendingAgents.length > 0 ? (
              trendingAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No agents found</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
