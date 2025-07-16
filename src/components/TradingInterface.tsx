import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Users, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TradingChart } from './TradingChart';
import { OKXDEXWidget } from './OKXDEXWidget';
import { AgentDashboard } from './AgentDashboard';
import { useAgentToken } from '@/hooks/useAgentTokens';
import { calculateBuyCost, calculateSellReturn, formatPrice, formatPromptAmount, getCurrentPrice, calculateTokensFromPrompt } from '@/lib/bondingCurve';
import { supabase } from '@/integrations/supabase/client';

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
  // Pass real agent data instead of fetching mock data
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  promptRaised: number;
  tokenHolders: number;
  circulatingSupply: number;
  tokenGraduated: boolean;
}

export function TradingInterface({ 
  agentId, 
  agentName, 
  agentSymbol, 
  tokenAddress,
  onConnect,
  isConnected,
  currentPrice,
  marketCap,
  volume24h,
  priceChange24h,
  promptRaised,
  tokenHolders,
  circulatingSupply,
  tokenGraduated
}: TradingInterfaceProps) {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('buy');
  const { toast } = useToast();
  
  // Smart contract integration for tokens with deployed contracts
  const { buyAgentTokens, sellAgentTokens, isBuying, isSelling, metrics: contractMetrics } = useAgentToken(tokenAddress);

  useEffect(() => {
    // Fetch real-time data from Moralis for graduated tokens, use agent data for others
    if (tokenGraduated && tokenAddress) {
      fetchLiveTokenData();
    } else {
      // Use agent data for bonding curve tokens
      setMetrics({
        promptRaised,
        currentPrice,
        marketCap,
        circulatingSupply,
        graduated: tokenGraduated,
        holders: tokenHolders,
        volume24h,
        priceChange24h
      });
    }
  }, [tokenGraduated, tokenAddress, currentPrice, marketCap, volume24h, priceChange24h, promptRaised, tokenHolders, circulatingSupply]);

  const fetchLiveTokenData = async () => {
    try {
      const response = await fetch('/functions/v1/fetch-token-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress,
          chain: 'base'
        })
      });

      if (response.ok) {
        const liveData = await response.json();
        setMetrics({
          promptRaised,
          currentPrice: liveData.currentPrice,
          marketCap: liveData.marketCap,
          circulatingSupply: liveData.circulatingSupply,
          graduated: tokenGraduated,
          holders: liveData.holders,
          volume24h: liveData.volume24h,
          priceChange24h: liveData.priceChange24h
        });
      } else {
        // Fallback to agent data if API fails
        setMetrics({
          promptRaised,
          currentPrice,
          marketCap,
          circulatingSupply,
          graduated: tokenGraduated,
          holders: tokenHolders,
          volume24h,
          priceChange24h
        });
      }
    } catch (error) {
      console.error('Failed to fetch live token data:', error);
      // Fallback to agent data
      setMetrics({
        promptRaised,
        currentPrice,
        marketCap,
        circulatingSupply,
        graduated: tokenGraduated,
        holders: tokenHolders,
        volume24h,
        priceChange24h
      });
    }
  };

  const handleBuy = async () => {
    if (!isConnected) {
      onConnect?.();
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid PROMPT amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (tokenAddress && tokenGraduated) {
        // Use smart contract for graduated tokens
        await buyAgentTokens(buyAmount);
      } else {
        // Use bonding curve calculation for non-graduated tokens
        const promptAmount = parseFloat(buyAmount);
        const currentPromptRaised = metrics?.promptRaised || 0;
        
        // Calculate how many tokens can be bought with this PROMPT amount
        const tokenResult = calculateTokensFromPrompt(currentPromptRaised, promptAmount);
        const newPromptRaised = currentPromptRaised + promptAmount;
        const newPrice = getCurrentPrice(tokenResult.newTokensSold);
        
        // Update database with new trade
        await supabase
          .from('agents')
          .update({
            prompt_raised: newPromptRaised,
            current_price: newPrice
          })
          .eq('id', agentId);
        
        toast({
          title: "Purchase Successful",
          description: `Bought ${tokenResult.tokenAmount.toFixed(2)} ${agentSymbol} for ${formatPromptAmount(promptAmount)}`,
        });
      }
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

    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid token amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (tokenAddress && tokenGraduated) {
        // Use smart contract for graduated tokens
        await sellAgentTokens(sellAmount);
      } else {
        // Use bonding curve calculation for non-graduated tokens
        const tokenAmount = parseFloat(sellAmount);
        const currentPromptRaised = metrics?.promptRaised || 0;
        
        // Calculate how much PROMPT this returns
        // For selling, we need to reverse-calculate from current state
        const currentTokensSold = currentPromptRaised > 0 ? currentPromptRaised * 1000 : 0; // Approximate
        const sellResult = calculateSellReturn(currentTokensSold, tokenAmount);
        const newPromptRaised = Math.max(0, currentPromptRaised - sellResult.return);
        const newPrice = getCurrentPrice(sellResult.newTokensSold);
        
        // Update database with new trade
        await supabase
          .from('agents')
          .update({
            prompt_raised: newPromptRaised,
            current_price: newPrice
          })
          .eq('id', agentId);
        
        toast({
          title: "Sale Successful",
          description: `Sold ${tokenAmount} ${agentSymbol} for ${formatPromptAmount(sellResult.return)}`,
        });
      }
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

  // Different layout for graduated vs bonding curve tokens
  if (metrics.graduated && tokenAddress) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Chart Section - Takes up 2/3 of the width */}
        <div className="lg:col-span-2">
          <TradingChart
            tokenAddress={tokenAddress}
            agentSymbol={agentSymbol}
            currentPrice={metrics.currentPrice}
            priceChange24h={metrics.priceChange24h}
          />
        </div>

        {/* Trading Section - Takes up 1/3 of the width */}
        <div className="space-y-6">
          {/* OKX DEX Widget */}
          <OKXDEXWidget
            tokenAddress={tokenAddress}
            agentSymbol={agentSymbol}
            onConnect={onConnect}
            isConnected={isConnected}
          />

          {/* Bridge Section */}
          <Card>
            <CardHeader>
              <CardTitle>Bridge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">From</span>
                  <Badge variant="outline">Base</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">To</span>
                  <Badge variant="outline">Virtual</Badge>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* DEX Options */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
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
      </div>
    );
  }

  // Original layout for bonding curve tokens
  return (
    <div className="space-y-6">{/* Removed AgentDashboard - this should only show trading interface */}

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
              <p className="text-sm text-muted-foreground">Price (PROMPT)</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{formatPrice(metrics.currentPrice)}</p>
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