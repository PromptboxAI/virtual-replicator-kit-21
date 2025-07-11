import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Users, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AgentMetrics {
  promptRaised: number;
  currentPrice: number;
  marketCap: number;
  circulatingSupply: number;
  graduated: boolean;
  holders: number;
  volume24h: number;
  priceChange24h: number;
}

interface TradingInterfaceProps {
  agentId: string;
  agentName: string;
  agentSymbol: string;
  tokenAddress?: string;
  onConnect?: () => void;
  isConnected: boolean;
}

export function TradingInterface({ 
  agentId, 
  agentName, 
  agentSymbol, 
  tokenAddress,
  onConnect,
  isConnected 
}: TradingInterfaceProps) {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('buy');
  const { toast } = useToast();

  useEffect(() => {
    if (tokenAddress) {
      fetchTokenMetrics();
    }
  }, [tokenAddress]);

  const fetchTokenMetrics = async () => {
    // Mock data for now - will be replaced with actual contract calls
    setMetrics({
      promptRaised: 25000,
      currentPrice: 0.02716,
      marketCap: 27640,
      circulatingSupply: 1018000,
      graduated: false,
      holders: 27483,
      volume24h: 613200,
      priceChange24h: -2.15
    });
  };

  const handleBuy = async () => {
    if (!isConnected) {
      onConnect?.();
      return;
    }

    setLoading(true);
    try {
      // Implement actual buy logic here
      toast({
        title: "Purchase Successful",
        description: `Bought ${buyAmount} PROMPT worth of ${agentSymbol}`,
      });
      setBuyAmount('');
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Failed to complete purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!isConnected) {
      onConnect?.();
      return;
    }

    setLoading(true);
    try {
      // Implement actual sell logic here
      toast({
        title: "Sale Successful",
        description: `Sold ${sellAmount} ${agentSymbol}`,
      });
      setSellAmount('');
    } catch (error) {
      toast({
        title: "Sale Failed",
        description: "Failed to complete sale. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading trading data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Token Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Price</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">${metrics.currentPrice.toFixed(6)}</p>
                <Badge variant={metrics.priceChange24h >= 0 ? "default" : "destructive"}>
                  {metrics.priceChange24h >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(metrics.priceChange24h).toFixed(2)}%
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="text-lg font-semibold">${metrics.marketCap.toLocaleString()}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-lg font-semibold">${metrics.volume24h.toLocaleString()}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Holders</p>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-semibold">{metrics.holders.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonding Curve Progress */}
      {!metrics.graduated && (
        <Card>
          <CardHeader>
            <CardTitle>Bonding Curve Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>PROMPT Raised</span>
                <span>{metrics.promptRaised.toLocaleString()} / 42,000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(metrics.promptRaised / 42000) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                When 42,000 PROMPT is raised, this token will graduate to Uniswap
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trading Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Trade {agentSymbol}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>
            
            <TabsContent value="buy" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">PROMPT Amount</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleBuy}
                disabled={!buyAmount || loading}
                className="w-full"
              >
                {loading ? "Processing..." : isConnected ? "Buy Tokens" : "Connect Wallet"}
              </Button>
            </TabsContent>
            
            <TabsContent value="sell" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{agentSymbol} Amount</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleSell}
                disabled={!sellAmount || loading}
                variant="outline"
                className="w-full"
              >
                {loading ? "Processing..." : isConnected ? "Sell Tokens" : "Connect Wallet"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* DEX Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Powered by OKX DEX</span>
            </div>
            <Button variant="link" size="sm">
              Swap on Uniswap Instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}