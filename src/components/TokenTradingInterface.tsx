import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Wallet, Activity, Target, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAgentTokens } from "@/hooks/useAgentTokens";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { TradingModeGuard } from './TradingModeGuard';
import { TradeFeeDisplay } from './TradeFeeDisplay';
import { TradingDebugPanel } from './TradingDebugPanel';
import { 
  getCurrentPriceV3, 
  calculateBuyCostV3, 
  calculateSellReturnV3, 
  calculateTokensFromPromptV3,
  calculateMarketStatsV3,
  BONDING_CURVE_V3_CONFIG,
  isAgentGraduatedV3,
  calculateGraduationProgressV3,
  tokensSoldFromPromptRaisedV3
} from "@/lib/bondingCurveV3";
import { useAgentRealtime } from '@/hooks/useAgentRealtime';
import { useMigrationPolling } from '@/hooks/useMigrationPolling';
import { MigrationBanner } from './MigrationBanner';
import { LiveTokenPriceDisplay } from './LiveTokenPriceDisplay';
import { useAgentLockStatus } from '@/hooks/useAgentLockStatus';
import { AgentLockStatus } from './AgentLockStatus';



interface Agent {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  prompt_raised: number;
  graduation_threshold: number;
  token_graduated: boolean;
  token_address?: string;
  market_cap?: number;
  price_change_24h?: number;
  volume_24h?: number;
  token_holders?: number;
  avatar_url?: string;
  description?: string;
  creator_id?: string;
  creation_locked?: boolean;
  creation_expires_at?: string | null;
}

interface TokenTradingInterfaceProps {
  agent: Agent;
  onTradeComplete?: () => void;
}

export const TokenTradingInterface = ({ agent, onTradeComplete }: TokenTradingInterfaceProps) => {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [promptAmount, setPromptAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  const [loading, setLoading] = useState(false);

  const { user, authenticated } = useAuth();
  const { isAdmin } = useUserRole();
  const { balance: promptBalance, loading: balanceLoading } = useTokenBalance(user?.id);
  const { buyAgentTokens, sellAgentTokens } = useAgentTokens(agent.token_address);
  const { toast } = useToast();
  
  // MEV Protection - Agent Lock Status
  const { isLocked, canTrade, timeLeft, isCreator } = useAgentLockStatus(agent.id);
  
  // Get user's agent token balance
  const [agentTokenBalance, setAgentTokenBalance] = useState<number>(0);
  
  useEffect(() => {
    const fetchAgentTokenBalance = async () => {
      if (!user?.id || !agent.id) {
        setAgentTokenBalance(0);
        return;
      }
      
      const { data, error } = await supabase
        .from('agent_token_holders')
        .select('token_balance')
        .eq('agent_id', agent.id)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.log('No token balance found for user');
        setAgentTokenBalance(0);
        return;
      }
      
      setAgentTokenBalance(data?.token_balance || 0);
    };
    
    fetchAgentTokenBalance();
    
    // Set up realtime subscription for balance updates
    const channel = supabase
      .channel(`agent_token_holders:${agent.id}:${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_token_holders',
          filter: `agent_id=eq.${agent.id},user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Token balance updated:', payload);
          if (payload.new && 'token_balance' in payload.new) {
            setAgentTokenBalance((payload.new as any).token_balance || 0);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, agent.id]);
  
  // Fee configuration (default values until integrated with useAgentTokens)
  const feeConfig = {
    feePercent: 0.01,
    creatorSplit: 0.7,
    platformSplit: 0.3
  };

  // Real-time graduation status and data - Phase 3 & 4 implementation
  const { isGraduated, isMigrating, agentData } = useAgentRealtime(agent.id, {
    id: agent.id,
    prompt_raised: agent.prompt_raised,
    current_price: agent.current_price,
    market_cap: agent.market_cap,
    token_holders: agent.token_holders,
    token_address: agent.token_address
  });
  
  // Migration polling - Phase 4 implementation
  useMigrationPolling({
    agentId: agent.id,
    isEnabled: isMigrating,
    onComplete: () => {
      // Migration complete, agent data will update via real-time subscription
      console.log('Migration completed for agent:', agent.id);
    }
  });
  
  // Use real-time data if available, fallback to props
  const currentPromptRaised = agentData?.prompt_raised ?? agent.prompt_raised;
  const graduationProgress = calculateGraduationProgressV3(currentPromptRaised);
  const remainingToGraduation = graduationProgress.remaining;

  // Real-time price calculation
  useEffect(() => {
    if (promptAmount && !isCalculating) {
      setIsCalculating(true);
      const amount = parseFloat(promptAmount);
      if (amount > 0) {
        try {
          // Use tokens sold derived from PROMPT raised to calculate
          const tokensSold = tokensSoldFromPromptRaisedV3(agent.prompt_raised);
          const result = calculateTokensFromPromptV3(tokensSold, amount);
          setTokenAmount(result.tokenAmount.toFixed(6));
        } catch (error) {
          console.error("Price calculation error:", error);
          setTokenAmount("0");
        }
      } else {
        setTokenAmount("");
      }
      setIsCalculating(false);
    }
  }, [promptAmount, agent.prompt_raised]);

  useEffect(() => {
    if (tokenAmount && !isCalculating && tradeType === "sell") {
      setIsCalculating(true);
      const amount = parseFloat(tokenAmount);
      if (amount > 0) {
        try {
          // Use sell return calculation with tokensSold derived from PROMPT raised
          const tokensSold = tokensSoldFromPromptRaisedV3(agent.prompt_raised);
          const result = calculateSellReturnV3(tokensSold, amount);
          setPromptAmount(result.return.toFixed(6));
        } catch (error) {
          console.error("Price calculation error:", error);
          setPromptAmount("0");
        }
      } else {
        setPromptAmount("");
      }
      setIsCalculating(false);
    }
  }, [tokenAmount, agent.prompt_raised, tradeType]);

// Derive tokens sold from PROMPT raised for price calculation
  const tokensSold = tokensSoldFromPromptRaisedV3(agent.prompt_raised);
  const currentPrice = getCurrentPriceV3(tokensSold);
  const priceAfterTrade = promptAmount && parseFloat(promptAmount) > 0
    ? getCurrentPriceV3(
        calculateTokensFromPromptV3(tokensSold, parseFloat(promptAmount || "0")).newTokensSold
      )
    : currentPrice;

  const priceImpact = promptAmount 
    ? ((priceAfterTrade - currentPrice) / currentPrice * 100) 
    : 0;

  const handleTrade = async () => {
    console.log('🎯 TokenTradingInterface: Calling buyAgentTokens');
    console.log('🔍 Trade parameters:', {
      tradeType,
      promptAmount,
      tokenAmount,
      agent: agent.name,
      agentId: agent.id,
      userId: user?.id,
      balance: promptBalance
    });

    if (!authenticated) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to trade tokens.",
        variant: "destructive",
      });
      return;
    }

    // MEV Protection Check
    if (!canTrade(user?.id)) {
      toast({
        title: "Trading Locked",
        description: `Only the creator can trade during the MEV protection period. ${timeLeft} remaining.`,
        variant: "destructive",
      });
      return;
    }

    if (!promptAmount || !tokenAmount) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to trade.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (tradeType === "buy") {
        console.log('🚀 Calling buyAgentTokens with:', {
          promptAmount,
          slippage: "2",
          agent: agent.name
        });
        
        await buyAgentTokens(promptAmount, "2", agent);
        
        // Calculate fee information for display
        const feeAmount = parseFloat(promptAmount) * feeConfig.feePercent;
        const creatorFee = feeAmount * feeConfig.creatorSplit;
        const platformFee = feeAmount * feeConfig.platformSplit;
        
        console.log('📊 Buy trade completed successfully');
        
        toast({
          title: "Purchase Successful",
          description: (
            <div className="space-y-2">
              <p>Successfully bought {tokenAmount} {agent.symbol} tokens!</p>
              <div className="text-xs text-muted-foreground">
                <p>Trading fee: {feeAmount.toFixed(4)} PROMPT ({(feeConfig.feePercent * 100).toFixed(1)}%)</p>
                <p>• Creator: {creatorFee.toFixed(4)} PROMPT</p>
                <p>• Platform: {platformFee.toFixed(4)} PROMPT</p>
              </div>
            </div>
          ),
        });
      } else {
        console.log('🚀 Calling sellAgentTokens with:', { tokenAmount });
        await sellAgentTokens(tokenAmount);
        console.log('📊 Sell trade completed successfully');
        toast({
          title: "Sale Successful",
          description: `Successfully sold ${tokenAmount} ${agent.symbol} tokens!`,
        });
      }
      
      setPromptAmount("");
      setTokenAmount("");
      onTradeComplete?.();
    } catch (error) {
      console.error("🚨 Trade error:", error);
      console.error("🚨 Trade error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        tradeType,
        promptAmount,
        tokenAmount,
        agentId: agent.id
      });
      
      toast({
        title: "Trade Failed",
        description: error instanceof Error ? error.message : "An error occurred during the trade.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price < 0.01 ? price.toExponential(4) : price.toFixed(6);
  };

  return (
    <div className="space-y-6">
      {/* Migration Banner - Phase 4 */}
      {isMigrating && (
        <MigrationBanner 
          agentName={agent.name}
          onComplete={() => console.log('Migration banner dismissed')}
        />
      )}

      {/* MEV Protection Status */}
      <AgentLockStatus
        agent={agent}
        currentUserId={user?.id}
        variant="alert"
      />
      
      <div className="space-y-6">
        {/* Trading Panel - Full Width */}
        <TradingModeGuard tokenAddress={agent.token_address} tokenGraduated={isGraduated}>
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Trade {agent.symbol}
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={tradeType} onValueChange={(value) => setTradeType(value as "buy" | "sell")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy" className="text-green-600">Buy</TabsTrigger>
                  <TabsTrigger value="sell" className="text-red-600">Sell</TabsTrigger>
                </TabsList>

                <TabsContent value="buy" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="prompt-amount">PROMPT Amount</Label>
                    <Input
                      id="prompt-amount"
                      type="number"
                      placeholder="0.0"
                      value={promptAmount}
                      onChange={(e) => setPromptAmount(e.target.value)}
                      disabled={loading || isMigrating || (promptBalance || 0) <= 0} // Disable if no balance
                    />
                    <div className="text-xs text-muted-foreground">
                      Balance: {balanceLoading ? "..." : `${promptBalance?.toFixed(2) || "0"} PROMPT`}
                      {(promptBalance || 0) > 0 && parseFloat(promptAmount || '0') > (promptBalance || 0) && (
                        <span className="text-red-500 ml-2">Insufficient balance</span>
                      )}
                    </div>
                  </div>

                  <div className="text-center text-muted-foreground">↓</div>

                  <div className="space-y-2">
                    <Label htmlFor="token-amount">{agent.symbol} Amount</Label>
                    <Input
                      id="token-amount"
                      type="number"
                      placeholder="0.0"
                      value={tokenAmount}
                      disabled
                      className="bg-muted"
                    />
                    <div className="text-xs text-muted-foreground">
                      You will receive approximately {tokenAmount || "0"} {agent.symbol}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sell" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="sell-token-amount">{agent.symbol} Amount</Label>
                    <Input
                      id="sell-token-amount"
                      type="number"
                      placeholder="0.0"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      disabled={loading || isMigrating || agentTokenBalance <= 0} // Disable if no tokens to sell
                    />
                    <div className="text-xs text-muted-foreground">
                      Balance: {agentTokenBalance.toFixed(2)} {agent.symbol}
                      {agentTokenBalance > 0 && parseFloat(tokenAmount || '0') > agentTokenBalance && (
                        <span className="text-red-500 ml-2">Insufficient tokens</span>
                      )}
                    </div>
                  </div>

                  <div className="text-center text-muted-foreground">↓</div>

                  <div className="space-y-2">
                    <Label htmlFor="sell-prompt-amount">PROMPT Amount</Label>
                    <Input
                      id="sell-prompt-amount"
                      type="number"
                      placeholder="0.0"
                      value={promptAmount}
                      disabled
                      className="bg-muted"
                    />
                    <div className="text-xs text-muted-foreground">
                      You will receive approximately {promptAmount || "0"} PROMPT
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Fee Display for Buy Trades */}
              {tradeType === "buy" && promptAmount && parseFloat(promptAmount) > 0 && (
                <TradeFeeDisplay
                  tradeAmount={parseFloat(promptAmount)}
                  feePercent={feeConfig.feePercent}
                  creatorSplit={feeConfig.creatorSplit}
                  platformSplit={feeConfig.platformSplit}
                  agentName={agent.name}
                  showBreakdown={true}
                />
              )}

              {/* Trade Details */}
              {promptAmount && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Price Impact</span>
                    <span className={priceImpact > 5 ? 'text-red-600' : 'text-green-600'}>
                      {priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price After Trade</span>
                    <span>${formatPrice(priceAfterTrade)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Slippage Tolerance</span>
                    <span>{slippage}%</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleTrade}
                disabled={
                  !promptAmount || 
                  !tokenAmount || 
                  loading || 
                  !authenticated || 
                  isMigrating ||
                  !canTrade(user?.id) ||
                  (tradeType === 'buy' && (promptBalance || 0) < parseFloat(promptAmount || '0')) ||
                  (tradeType === 'sell' && agentTokenBalance < parseFloat(tokenAmount || '0'))
                }
                className="w-full"
                size="lg"
              >
                {loading 
                  ? "Processing..." 
                  : !canTrade(user?.id) 
                    ? `Locked (${timeLeft})` 
                    : `${tradeType === "buy" ? "Buy" : "Sell"} ${agent.symbol}`
                }
              </Button>

              {!authenticated && (
                <p className="text-center text-sm text-muted-foreground">
                  Connect your wallet to start trading
                </p>
              )}
            </CardContent>
          </Card>
        </TradingModeGuard>
      </div>

      {/* Debug Panel - Only visible to admins */}
      {isAdmin && <TradingDebugPanel agentId={agent.id} />}
    </div>
  );
};
