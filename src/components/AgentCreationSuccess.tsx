import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, TrendingUp, Settings, ArrowRight, ExternalLink } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AnimatedBackground } from '@/components/AnimatedBackground';

interface LocationState {
  agentName?: string;
  agentSymbol?: string;
  tokenAddress?: string;
  prebuyAmount?: number;
}

export default function AgentCreationSuccess() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const agentName = state?.agentName || 'Your Agent';
  const agentSymbol = state?.agentSymbol || 'TOKEN';
  const tokenAddress = state?.tokenAddress;
  const prebuyAmount = state?.prebuyAmount;

  return (
    <div className="min-h-screen relative">
      <Header />
      <AnimatedBackground />
      
      <div className="container mx-auto px-4 py-12 pb-32 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="bg-gradient-cyber bg-clip-text text-transparent">
                Agent Created Successfully!
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              <span className="font-semibold text-foreground">{agentName}</span> ({agentSymbol}) is now live
              {prebuyAmount && prebuyAmount > 0 && (
                <span className="block mt-1 text-sm">
                  Pre-buy of {prebuyAmount} PROMPT executed
                </span>
              )}
            </p>
            {tokenAddress && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Contract: {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-8)}
              </p>
            )}
          </div>

          {/* Choice Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Trade Card */}
            <Card 
              className="group cursor-pointer border-2 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              onClick={() => navigate(`/agent/${agentId}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Trade {agentSymbol}</CardTitle>
                    <CardDescription>View chart & start trading</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Go to the trading platform to view the bonding curve, price chart, and trade your new token.
                </p>
                <Button className="w-full group-hover:bg-primary/90">
                  Go to Trading
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Configure Agent Card */}
            <Card 
              className="group cursor-pointer border-2 hover:border-secondary transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10"
              onClick={() => navigate(`/creator/${agentId}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                    <Settings className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Configure Agent</CardTitle>
                    <CardDescription>Set up AI capabilities</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your agent's AI personality, marketing materials, team info, and roadmap.
                </p>
                <Button variant="secondary" className="w-full">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">Quick links</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/my-agents')}
              >
                My Agents
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/market')}
              >
                Market
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/create-agent')}
              >
                Create Another
              </Button>
              {tokenAddress && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(`https://sepolia.basescan.org/address/${tokenAddress}`, '_blank')}
                >
                  View on Basescan
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
