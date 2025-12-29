import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, TrendingUp, Settings, ArrowRight, ExternalLink, Rocket, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

interface LocationState {
  agentName?: string;
  agentSymbol?: string;
  tokenAddress?: string;
  prebuyAmount?: number;
}

interface AgentData {
  name: string;
  symbol: string;
  token_address: string | null;
  token_contract_address?: string | null;
  prebuy_amount?: number;
}

export default function AgentCreationSuccess() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(!state?.agentName);

  // Fetch agent data from database if not passed via state
  useEffect(() => {
    if (state?.agentName) {
      // We have state, use it
      setAgentData({
        name: state.agentName,
        symbol: state.agentSymbol || 'TOKEN',
        token_address: state.tokenAddress || null,
        prebuy_amount: state.prebuyAmount,
      });
      setLoading(false);
      return;
    }

    // Fetch from database
    const fetchAgent = async () => {
      if (!agentId) return;

      const { data, error } = await supabase
        .from('agents')
        .select('name, symbol, token_address, token_contract_address, creator_prebuy_amount')
        .eq('id', agentId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch agent:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setAgentData({
          name: data.name,
          symbol: data.symbol,
          token_address: data.token_address,
          token_contract_address: data.token_contract_address,
          prebuy_amount: (data.creator_prebuy_amount ?? undefined) as number | undefined,
        });
      }
      setLoading(false);
    };

    fetchAgent();
  }, [agentId, state]);

  const agentName = agentData?.name || 'Your Agent';
  const tokenAddress = agentData?.token_contract_address || agentData?.token_address || null;
  const prebuyAmount = agentData?.prebuy_amount;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

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
              className="group cursor-pointer border-2 border-border hover:border-primary bg-card transition-all duration-200 hover:shadow-xl flex flex-col"
              onClick={() => navigate(`/agent/${agentId}`)}
            >
              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex items-start gap-5 mb-6">
                  <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-1">Start Trading</h2>
                    <p className="text-foreground/70">View chart & trade tokens</p>
                  </div>
                </div>
                
                <p className="text-foreground/80 leading-relaxed flex-1">
                  Access the trading platform to view the bonding curve, price chart, and buy or sell tokens.
                </p>
                
                <Button size="lg" className="w-full text-base font-medium mt-6">
                  Go to Trading
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>

            {/* Configure Agent Card */}
            <Card 
              className="group cursor-pointer border-2 border-border hover:border-violet-500 bg-card transition-all duration-200 hover:shadow-xl flex flex-col"
              onClick={() => navigate(`/dashboard/${agentId}`)}
            >
              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex items-start gap-5 mb-6">
                  <div className="p-4 rounded-2xl bg-violet-500/10 group-hover:bg-violet-500/15 transition-colors">
                    <Settings className="h-8 w-8 text-violet-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-1">Configure Agent</h2>
                    <p className="text-foreground/70">Set up AI & marketing</p>
                  </div>
                </div>
                
                <p className="text-foreground/80 leading-relaxed flex-1">
                  Configure {agentName}'s AI personality, marketing materials, team information, and project roadmap.
                </p>
                
                <Button size="lg" className="w-full text-base font-medium mt-6">
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
