import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TradingInterface } from "@/components/TradingInterface";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export default function TradingPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { user, signIn } = useAuth();

  const { data: agent, isLoading, error } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      
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

  if (!agentId) {
    return <Navigate to="/market" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-96" />
              </div>
              <div>
                <Skeleton className="h-96" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Agent Not Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The agent you're looking for doesn't exist or has been removed.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Agent Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{agent.name}</h1>
                <Badge variant="secondary">${agent.symbol}</Badge>
                {agent.token_graduated && (
                  <Badge variant="default">Graduated</Badge>
                )}
              </div>
              {agent.description && (
                <p className="text-muted-foreground max-w-2xl">
                  {agent.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${Number(agent.current_price).toFixed(2)}
              </div>
              <div className={`text-sm ${
                (agent.price_change_24h || 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(agent.price_change_24h || 0) >= 0 ? '+' : ''}
                {Number(agent.price_change_24h || 0).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Trading Interface */}
          <TradingInterface
            agentId={agent.id}
            agentName={agent.name}
            agentSymbol={agent.symbol}
            tokenAddress={agent.token_address}
            onConnect={signIn}
            isConnected={!!user}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}