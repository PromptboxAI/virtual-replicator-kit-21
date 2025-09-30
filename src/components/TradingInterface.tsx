import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Users, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppMode } from '@/hooks/useAppMode';
import { useAuth } from '@/hooks/useAuth';
import { useAgentLockStatus } from '@/hooks/useAgentLockStatus';
import { AgentLockStatus } from './AgentLockStatus';
import { TradingChart } from './TradingChart';
import { OKXDEXWidget } from './OKXDEXWidget';
import { AgentDashboard } from './AgentDashboard';
import { LiveTokenPriceDisplay } from './LiveTokenPriceDisplay';
import { WalletBalanceDisplay } from './WalletBalanceDisplay';
import { BondingCurvePreview } from './BondingCurvePreview';
import { useAgentTokens } from '@/hooks/useAgentTokens';
import { calculateBuyCostV4, calculateSellReturnV4, formatPriceV4, formatPromptAmountV4, getCurrentPriceV4, calculateTokensFromPromptV4, tokensSoldFromPromptRaisedV4 } from '@/lib/bondingCurveV4';
import { supabase } from '@/integrations/supabase/client';
import { getAgentGraduationThreshold } from '@/services/GraduationService';

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
  const [graduationThreshold, setGraduationThreshold] = useState<number>(42000);
  const { toast } = useToast();
  const { mode: appMode } = useAppMode(); // ✅ Move hook to top level
  const { user } = useAuth();
  
  // 🛡️ MEV Protection: Check lock status
  const { isLocked, timeLeft, canTrade, isCreator, loading: lockLoading } = useAgentLockStatus(agentId);
  
  // Smart contract integration for tokens with deployed contracts
  const { buyAgentTokens, sellAgentTokens, loading: isTrading } = useAgentTokens(tokenAddress);

  // Load graduation threshold for this agent
  useEffect(() => {
    getAgentGraduationThreshold(agentId).then(setGraduationThreshold);
  }, [agentId]);

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

    // 🛡️ MEV Protection: Check if user can trade
    if (!canTrade(user?.id)) {
      const lockMessage = isCreator(user?.id) 
        ? `MEV protection is active for ${timeLeft}. Only you as the creator can trade.`
        : `MEV protection is active for ${timeLeft}. Only the creator can trade during this period.`;
      
      toast({
        title: "Trading Temporarily Restricted",
        description: lockMessage,
        variant: "destructive",
      });
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
        // 🔐 PRODUCTION SAFETY: Check app mode before real contract trading
        if (appMode === 'test') {
          toast({
            title: "🚨 Trading Blocked",
            description: "Real contract trading is disabled in test mode. Switch to production mode for live trading.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Use smart contract for graduated tokens
        await buyAgentTokens(buyAmount, '2', { id: agentId, name: agentName, symbol: agentSymbol });
      } else {
        // Use bonding curve calculation for non-graduated tokens
        const promptAmount = parseFloat(buyAmount);
        const currentPromptRaised = metrics?.promptRaised || 0;
        
        // Calculate how many tokens can be bought with this PROMPT amount
        const tokenResult = calculateTokensFromPromptV4(currentPromptRaised, promptAmount);
        const newPromptRaised = currentPromptRaised + promptAmount;
        const newPrice = getCurrentPriceV4(tokenResult.newTokensSold);
        
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
          description: `Bought ${tokenResult.tokenAmount.toFixed(2)} ${agentSymbol} for ${formatPromptAmountV4(promptAmount)}`,
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

    // 🛡️ MEV Protection: Check if user can trade
    if (!canTrade(user?.id)) {
      const lockMessage = isCreator(user?.id) 
        ? `MEV protection is active for ${timeLeft}. Only you as the creator can trade.`
        : `MEV protection is active for ${timeLeft}. Only the creator can trade during this period.`;
      
      toast({
        title: "Trading Temporarily Restricted",
        description: lockMessage,
        variant: "destructive",
      });
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
        // 🔐 PRODUCTION SAFETY: Check app mode before real contract trading
        if (appMode === 'test') {
          toast({
            title: "🚨 Trading Blocked",
            description: "Real contract trading is disabled in test mode. Switch to production mode for live trading.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Use smart contract for graduated tokens
        await sellAgentTokens(sellAmount);
      } else {
        // Use bonding curve calculation for non-graduated tokens
        const tokenAmount = parseFloat(sellAmount);
        const currentPromptRaised = metrics?.promptRaised || 0;
        
        // Calculate how much PROMPT this returns
        // For selling, we need to reverse-calculate from current state
        const currentTokensSold = tokensSoldFromPromptRaisedV4(currentPromptRaised);
        const sellResult = calculateSellReturnV4(currentTokensSold, tokenAmount);
        const newPromptRaised = Math.max(0, currentPromptRaised - sellResult.return);
        const newPrice = getCurrentPriceV4(sellResult.newTokensSold);
        
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
          description: `Sold ${tokenAmount} ${agentSymbol} for ${formatPromptAmountV4(sellResult.return)}`,
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

      {/* Live Token Price Display */}
      <LiveTokenPriceDisplay
        agentSymbol={agentSymbol}
        promptRaised={metrics.promptRaised}
        tradeAmount={parseFloat(buyAmount || sellAmount || '0')}
        tradeType={activeTab as 'buy' | 'sell'}
        className="mb-6"
      />

      {/* Bonding Curve Preview - Only for non-graduated tokens */}
      {!metrics.graduated && (
        <BondingCurvePreview
          agentSymbol={agentSymbol}
          promptRaised={metrics.promptRaised}
          tradeAmount={parseFloat(buyAmount || '0')}
          className="mb-6"
        />
      )}

      {/* Token Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Token Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Price (PROMPT)</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{formatPriceV4(metrics.currentPrice)}</p>
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
              <p className="text-sm text-muted-foreground">FDV</p>
              <p className="text-lg font-semibold">${(metrics.marketCap / 1000).toFixed(2)}k</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Liquidity</p>
              <p className="text-lg font-semibold">${((metrics.promptRaised * 30) / 1000).toFixed(2)}k</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">24h Vol</p>
              <p className="text-lg font-semibold">${(metrics.volume24h / 1000).toFixed(2)}k</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Holders</p>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-semibold">{metrics.holders}</p>
              </div>
            </div>
            
            <div className="space-y-1 md:col-span-5">
              <p className="text-sm text-muted-foreground">Top 10</p>
              <p className="text-lg font-semibold">0%</p>
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
              <span>{metrics.promptRaised.toLocaleString()} / {graduationThreshold.toLocaleString()}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(metrics.promptRaised / graduationThreshold) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              When {graduationThreshold.toLocaleString()} PROMPT is raised, this token will graduate to Uniswap
            </p>
          </div>
        </CardContent>
      </Card>

      {/* MEV Protection Status */}
      {isLocked && (
        <AgentLockStatus 
          agent={{ 
            id: agentId, 
            creation_locked: isLocked, 
            creation_expires_at: null, 
            creator_id: '', 
            name: agentName 
          }} 
          currentUserId={user?.id}
          variant="alert"
        />
      )}

      {/* Trading Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Trade {agentSymbol}
            {isLocked && (
              <Badge variant="secondary" className="text-xs">
                Lock: {timeLeft}
              </Badge>
            )}
          </CardTitle>
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
                  disabled={loading}
                />
                <div className="text-xs text-muted-foreground">
                  {parseFloat(buyAmount || '0') > 0 && (
                    <span>You will receive approximately {calculateTokensFromPromptV4(metrics.promptRaised, parseFloat(buyAmount)).tokenAmount.toFixed(2)} {agentSymbol}</span>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleBuy}
                disabled={
                  !buyAmount || 
                  loading || 
                  !isConnected || 
                  !canTrade(user?.id) || 
                  lockLoading
                }
                className="w-full"
              >
                {loading ? "Processing..." : 
                 !canTrade(user?.id) ? `Locked (${timeLeft})` :
                 isConnected ? "Buy Tokens" : "Connect Wallet"}
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
                disabled={
                  !sellAmount || 
                  loading || 
                  !isConnected || 
                  !canTrade(user?.id) || 
                  lockLoading
                }
                variant="outline"
                className="w-full"
              >
                {loading ? "Processing..." : 
                 !canTrade(user?.id) ? `Locked (${timeLeft})` :
                 isConnected ? "Sell Tokens" : "Connect Wallet"}
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