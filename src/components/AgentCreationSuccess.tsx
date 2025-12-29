import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, TrendingUp, Settings, ArrowRight, ExternalLink, Rocket } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16 pb-32">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 mb-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Agent Created Successfully
            </h1>
            
            <p className="text-xl text-foreground/80 mb-2">
              <span className="font-semibold">{agentName}</span> is now live
            </p>
            
            {prebuyAmount && prebuyAmount > 0 && (
              <p className="text-base text-foreground/70">
                Pre-buy of {prebuyAmount} PROMPT executed
              </p>
            )}
            
            {tokenAddress && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <span className="text-sm text-foreground/70">Contract:</span>
                <code className="text-sm font-mono text-foreground">
                  {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-8)}
                </code>
                <button
                  onClick={() => window.open(`https://sepolia.basescan.org/address/${tokenAddress}`, '_blank')}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action Cards */}
          <div className="grid gap-6 md:grid-cols-2 mb-12">
            {/* Trade Card */}
            <Card 
              className="group cursor-pointer border-2 border-border hover:border-primary bg-card transition-all duration-200 hover:shadow-xl"
              onClick={() => navigate(`/agent/${agentId}`)}
            >
              <CardContent className="p-8">
                <div className="flex items-start gap-5 mb-6">
                  <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-1">Start Trading</h2>
                    <p className="text-foreground/70">View chart & trade tokens</p>
                  </div>
                </div>
                
                <p className="text-foreground/80 mb-6 leading-relaxed">
                  Access the trading platform to view the bonding curve, price chart, and buy or sell {agentSymbol} tokens.
                </p>
                
                <Button size="lg" className="w-full text-base font-medium">
                  Go to Trading
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            {/* Configure Agent Card */}
            <Card 
              className="group cursor-pointer border-2 border-border hover:border-violet-500 bg-card transition-all duration-200 hover:shadow-xl"
              onClick={() => navigate(`/dashboard/${agentId}`)}
            >
              <CardContent className="p-8">
                <div className="flex items-start gap-5 mb-6">
                  <div className="p-4 rounded-2xl bg-violet-500/10 group-hover:bg-violet-500/15 transition-colors">
                    <Settings className="h-8 w-8 text-violet-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-1">Configure Agent</h2>
                    <p className="text-foreground/70">Set up AI & marketing</p>
                  </div>
                </div>
                
                <p className="text-foreground/80 mb-6 leading-relaxed">
                  Configure {agentName}'s AI personality, marketing materials, team information, and project roadmap.
                </p>
                
                <Button size="lg" variant="outline" className="w-full text-base font-medium border-2 hover:bg-violet-500/5 hover:border-violet-500 hover:text-violet-600">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Navigation */}
          <div className="border-t border-border pt-8">
            <div className="flex flex-wrap justify-center gap-3">
              <Button 
                variant="ghost" 
                size="lg"
                className="text-foreground/70 hover:text-foreground"
                onClick={() => navigate('/my-agents')}
              >
                <Rocket className="mr-2 h-4 w-4" />
                My Agents
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                className="text-foreground/70 hover:text-foreground"
                onClick={() => navigate('/market')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Market
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                className="text-foreground/70 hover:text-foreground"
                onClick={() => navigate('/create-agent')}
              >
                Create Another Agent
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
