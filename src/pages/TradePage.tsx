import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { TokenTradingInterface } from "@/components/TokenTradingInterface";
import { BondingCurveChart } from "@/components/BondingCurveChart";
import { useAgents } from "@/hooks/useAgents";

const TradePage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { agents, loading } = useAgents();
  
  const agent = agents.find(a => a.id === agentId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading agent...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Agent Not Found</h1>
            <p className="text-muted-foreground">The agent you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Trading Interface */}
          <div className="lg:col-span-2">
            <TokenTradingInterface agent={agent} />
          </div>
          
          {/* Bonding Curve Chart */}
          <div className="lg:col-span-1">
            <BondingCurveChart
              currentTokensSold={agent.prompt_raised * 1000} // Convert to estimated tokens sold
              graduationThreshold={agent.graduation_threshold}
              promptRaised={agent.prompt_raised}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradePage;