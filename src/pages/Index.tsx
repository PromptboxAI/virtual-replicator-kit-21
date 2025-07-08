import { Header } from "@/components/Header";
import { SpotlightAgent } from "@/components/SpotlightAgent";
import { AgentCard } from "@/components/AgentCard";
import { NetworkVisualization } from "@/components/NetworkVisualization";
import { MarketStats } from "@/components/MarketStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Filter, MoreHorizontal } from "lucide-react";
import agentAvatar1 from "@/assets/agent-avatar-1.png";
import agentAvatar2 from "@/assets/agent-avatar-2.png";
import agentAvatar3 from "@/assets/agent-avatar-3.png";

const Index = () => {
  const spotlightAgent = {
    name: "aixbt",
    avatar: agentAvatar1,
    price: "$126.43",
    change: -1.95,
    volume: "24h Vol",
    transactions: 1198,
    description: "Provides market alpha",
    category: "Autonomous Onchain Commerce"
  };

  const trendingAgents = [
    {
      id: "1",
      name: "Luna",
      avatar: agentAvatar2,
      price: "$89.52",
      change: 8.23,
      volume: "$2.1M",
      category: "Trading",
      holders: 1247
    },
    {
      id: "2", 
      name: "Zerebro",
      avatar: agentAvatar3,
      price: "$156.78",
      change: -3.45,
      volume: "$5.8M",
      category: "Analytics",
      holders: 2891
    },
    {
      id: "3",
      name: "Aelred",
      avatar: agentAvatar1,
      price: "$203.91",
      change: 12.67,
      volume: "$3.2M",
      category: "DeFi",
      holders: 1876
    },
    {
      id: "4",
      name: "Degenixi",
      avatar: agentAvatar2,
      price: "$78.34",
      change: -5.12,
      volume: "$1.9M",
      category: "Gaming",
      holders: 945
    },
    {
      id: "5",
      name: "Athena",
      avatar: agentAvatar3,
      price: "$134.67",
      change: 7.89,
      volume: "$4.1M",
      category: "Research",
      holders: 2156
    },
    {
      id: "6",
      name: "Gigabrain",
      avatar: agentAvatar1,
      price: "$92.15",
      change: 15.23,
      volume: "$2.7M",
      category: "AI Assistant",
      holders: 1543
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6">
            <span className="bg-gradient-cyber bg-clip-text text-transparent">
              promptbox.com
            </span>
            <br />
            <span className="text-foreground">for AI Agents</span>
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
              <SpotlightAgent agent={spotlightAgent} />
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
            {trendingAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border mt-16">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
            <div className="text-2xl font-bold bg-gradient-cyber bg-clip-text text-transparent mb-4">
              promptbox.com
            </div>
              <p className="text-muted-foreground text-sm">
                Building the future of autonomous AI agent commerce and collaboration.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>AI Agents</div>
                <div>ACP Protocol</div>
                <div>GAME Framework</div>
                <div>Governance</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Developers</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Documentation</div>
                <div>API Reference</div>
                <div>SDK</div>
                <div>Support</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Community</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Discord</div>
                <div>Twitter</div>
                <div>GitHub</div>
                <div>Blog</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
