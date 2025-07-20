import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useAgentRealtime } from '@/hooks/useAgentRealtime';
import { useMigrationPolling } from '@/hooks/useMigrationPolling';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Loader2, 
  Settings, 
  ExternalLink,
  AlertTriangle 
} from 'lucide-react';
import {
  calculateTokensFromPrompt,
  calculateSellReturn,
  getCurrentPrice,
  calculateGraduationProgress,
  BONDING_CURVE_CONFIG,
  isAgentGraduated,
  isAgentMigrating
} from '@/lib/bondingCurve';

interface Agent {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  avatar_url?: string;
  current_price: number;
  market_cap?: number;
  volume_24h?: number;
  price_change_24h?: number;
  token_holders?: number;
  prompt_raised?: number;
  token_address?: string | null;
  token_graduated?: boolean;
  test_mode?: boolean;
  graduation_threshold?: number;
}

interface TransactionState {
  type: 'buy' | 'sell' | null;
  amount: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  hash?: string;
  error?: string;
}

interface EnhancedTradingInterfaceProps {
  agent: Agent;
  onAgentUpdated?: () => void;
}

export function EnhancedTradingInterface({ agent, onAgentUpdated }: EnhancedTradingInterfaceProps) {
  console.log('[EnhancedTradingInterface] Mounting');
  console.log('[EnhancedTradingInterface] Agent state:', { 
    agent: agent?.name, 
    loading: 'N/A' 
  });

  // STATE HOOKS MUST BE FIRST
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [calculatedTokens, setCalculatedTokens] = useState('');
  const [calculatedPrompt, setCalculatedPrompt] = useState('');
  const [priceImpact, setPriceImpact] = useState(0);
  const [slippage, setSlippage] = useState('2.0');
  const [transaction, setTransaction] = useState<TransactionState>({ 
    type: null, 
    amount: '', 
    status: 'idle' 
  });

  console.log('[EnhancedTradingInterface] State hooks initialized');

  // HOOK CALLS MUST BE NEXT
  const { toast } = useToast();
  console.log('[EnhancedTradingInterface] Toast hook initialized');

  const { authenticated, ready, login, user } = usePrivy();
  console.log('[EnhancedTradingInterface] Auth state:', { 
    authenticated, 
    user: user?.id, 
    ready 
  });

  const {
    address,
    isConnected,
    promptBalance,
    refreshBalances,
    isTestMode
  } = usePrivyWallet();
  console.log('[EnhancedTradingInterface] usePrivyWallet called successfully');

  // DERIVED STATE FROM PROPS (with safe defaults for when agent is null)
  const promptRaised = agent?.prompt_raised || 0;
  const tokenHolders = agent?.token_holders || 0;
  const currentPrice = agent?.current_price || 0;
  const marketCap = agent?.market_cap || 0;
  const volume24h = agent?.volume_24h || 0;
  const graduationThreshold = agent?.graduation_threshold || BONDING_CURVE_CONFIG.GRADUATION_PROMPT_AMOUNT;

  // BONDING CURVE CALCULATIONS (safe with defaults)
  const bondingCurve = calculateGraduationProgress(promptRaised);
  const isGraduated = isAgentGraduated(promptRaised);
  const isMigrating = isAgentMigrating(promptRaised, agent?.token_address);

  console.log('[EnhancedTradingInterface] Bonding curve calculated:', {
    agentName: agent?.name,
    tokenGraduated: agent?.token_graduated,
    tokenAddress: agent?.token_address,
    isGraduated,
    promptRaised,
    bondingCurveProgress: bondingCurve.progress,
    graduationThreshold,
    isMigrating
  });

  // MIGRATION POLLING - MUST BE CALLED BEFORE ANY EARLY RETURNS
  const { isPolling } = useMigrationPolling({
    agentId: agent?.id || '', // Safe default
    isEnabled: isMigrating && !!agent, // Only enable if agent exists and is migrating
    onComplete: () => {
      onAgentUpdated?.();
      toast({
        title: "Token Deployed!",
        description: "Your agent token has been deployed to Uniswap. Trading is now available on DEX.",
      });
    }
  });

  // ALL useEffect HOOKS MUST BE HERE
  useEffect(() => {
    if (buyAmount && parseFloat(buyAmount) > 0) {
      const promptAmount = parseFloat(buyAmount);
      const result = calculateTokensFromPrompt(promptRaised, promptAmount);
      setCalculatedTokens(result.tokenAmount.toFixed(4));
      
      const currentPriceCalc = getCurrentPrice(promptRaised / 1000);
      const newPrice = getCurrentPrice(result.newTokensSold);
      const impact = ((newPrice - currentPriceCalc) / currentPriceCalc) * 100;
      setPriceImpact(impact);
    } else {
      setCalculatedTokens('');
      setPriceImpact(0);
    }
  }, [buyAmount, promptRaised]);

  useEffect(() => {
    if (sellAmount && parseFloat(sellAmount) > 0) {
      const tokenAmount = parseFloat(sellAmount);
      const currentTokensSold = promptRaised * 1000;
      const result = calculateSellReturn(currentTokensSold, tokenAmount);
      setCalculatedPrompt(result.return.toFixed(4));
    } else {
      setCalculatedPrompt('');
    }
  }, [sellAmount, promptRaised]);

  // NOW SAFE TO DO EARLY RETURNS AFTER ALL HOOKS
  if (!agent) {
    console.log('[EnhancedTradingInterface] No agent data available');
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>No agent data available</p>
        </CardContent>
      </Card>
    );
  }

  console.log('[EnhancedTradingInterface] Render checkpoint:', {
    hasAgent: !!agent,
    agentId: agent?.id,
    isLoading: 'N/A',
    willReturn: 'MainUI',
    agentKeys: agent ? Object.keys(agent) : []
  });

  // CHECK AUTH STATE
  if (!ready) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  console.log('[EnhancedTradingInterface] All checks passed, rendering interface. Auth status:', { ready, authenticated });

  // TRANSACTION HANDLERS
  const handleConnectWallet = () => {
    login();
  };

  const handleBuy = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid PROMPT amount",
        variant: "destructive",
      });
      return;
    }

    const promptAmount = parseFloat(buyAmount);
    const currentBalance = parseFloat(promptBalance);

    if (currentBalance < promptAmount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${promptAmount} $PROMPT but only have ${currentBalance}`,
        variant: "destructive",
      });
      return;
    }

    // Check slippage protection
    const result = calculateTokensFromPrompt(promptRaised, promptAmount);
    const slippageNumber = parseFloat(slippage);
    if (Math.abs(result.tokenAmount * getCurrentPrice(promptRaised) - promptAmount) / promptAmount > slippageNumber / 100) {
      toast({
        title: "Price Impact Too High",
        description: `Price impact exceeds ${slippageNumber}% slippage tolerance`,
        variant: "destructive",
      });
      return;
    }

    setTransaction({ 
      type: 'buy', 
      amount: buyAmount, 
      status: 'pending' 
    });

    try {
      if (isTestMode) {
        // TEST MODE: Mock logic for admin testing
        const newPromptRaised = promptRaised + promptAmount;
        const newPrice = getCurrentPrice(result.newTokensSold);
        const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        
        setTransaction(prev => ({ 
          ...prev, 
          hash: mockHash,
          status: 'pending' 
        }));

        toast({
          title: "Transaction Submitted",
          description: `[TEST MODE] Processing ${promptAmount} $PROMPT purchase...`,
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const { error } = await supabase
          .from('agents')
          .update({
            prompt_raised: newPromptRaised,
            current_price: newPrice,
            token_holders: (agent.token_holders || 0) + 1
          })
          .eq('id', agent.id);

        if (error) throw error;

        // Check for graduation
        if (newPromptRaised >= graduationThreshold) {
          toast({
            title: "🎉 Token Graduating!",
            description: "Your agent has reached the graduation threshold. Token deployment starting...",
          });
        }

        setTransaction(prev => ({ 
          ...prev, 
          status: 'success' 
        }));

        toast({
          title: "Purchase Successful!",
          description: (
            <div className="space-y-2">
              <p>Bought {result.tokenAmount.toFixed(2)} {agent.symbol}</p>
              <div className="flex items-center gap-2">
                <span>Transaction:</span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open(`https://etherscan.io/tx/${mockHash}`, '_blank')}
                >
                  {mockHash.slice(0, 10)}...{mockHash.slice(-8)}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          ),
        });
      } else {
        // PRODUCTION MODE: Real smart contract interaction
        if (!address) {
          toast({
            title: "Wallet Not Connected",
            description: "Please connect your wallet to make purchases.",
            variant: "destructive",
          });
          return;
        }

        if (!agent.token_address) {
          toast({
            title: "Token Not Deployed",
            description: "Agent token contract has not been deployed yet.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Confirming Transaction",
          description: "Please confirm the transaction in your wallet...",
        });

        // Call smart contract buy function
        const { data, error } = await supabase.functions.invoke('execute-buy-transaction', {
          body: {
            tokenAddress: agent.token_address,
            promptAmount: promptAmount.toString(),
            buyerAddress: address,
            agentId: agent.id,
            slippageTolerance: slippageNumber,
            minTokensOut: result.tokenAmount * (1 - slippageNumber / 100)
          }
        });

        if (error || !data.success) {
          throw new Error(data?.error || error?.message || 'Transaction failed');
        }

        setTransaction(prev => ({ 
          ...prev, 
          hash: data.transactionHash,
          status: 'pending' 
        }));

        toast({
          title: "Transaction Submitted",
          description: "Transaction sent to blockchain. Waiting for confirmation...",
        });

        // Wait for transaction confirmation
        let confirmationAttempts = 0;
        const maxAttempts = 30;

        while (confirmationAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          const { data: confirmData } = await supabase.functions.invoke('check-transaction-status', {
            body: { transactionHash: data.transactionHash }
          });

          if (confirmData?.confirmed) {
            setTransaction(prev => ({ 
              ...prev, 
              status: 'success' 
            }));

            toast({
              title: "Purchase Successful!",
              description: (
                <div className="space-y-2">
                  <p>Bought {confirmData.tokensReceived} {agent.symbol}</p>
                  <div className="flex items-center gap-2">
                    <span>Transaction:</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-xs"
                      onClick={() => window.open(`https://basescan.org/tx/${data.transactionHash}`, '_blank')}
                    >
                      {data.transactionHash.slice(0, 10)}...{data.transactionHash.slice(-8)}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ),
            });
            break;
          }
          
          confirmationAttempts++;
        }
      }

      await refreshBalances();
      onAgentUpdated?.();
      setBuyAmount('');

    } catch (error: any) {
      console.error('Buy error:', error);
      setTransaction(prev => ({ 
        ...prev, 
        status: 'error',
        error: error.message || 'Transaction failed'
      }));

      let errorMessage = error.message || "Transaction failed. Please try again.";
      
      if (error.message?.includes('insufficient funds')) {
        errorMessage = "Insufficient funds to complete transaction. Check your PROMPT balance and gas fees.";
      } else if (error.message?.includes('reverted')) {
        errorMessage = "Transaction was reverted by the smart contract. Check slippage settings and try again.";
      } else if (error.message?.includes('gas')) {
        errorMessage = "Gas estimation failed. The network may be congested. Try again later.";
      } else if (error.message?.includes('user rejected')) {
        errorMessage = "Transaction was cancelled in your wallet.";
      }

      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSell = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid token amount",
        variant: "destructive",
      });
      return;
    }

    const tokenAmount = parseFloat(sellAmount);
    const currentTokensSold = promptRaised * 1000;
    const result = calculateSellReturn(currentTokensSold, tokenAmount);

    const slippageNumber = parseFloat(slippage);
    if (Math.abs(result.priceImpact) > slippageNumber) {
      toast({
        title: "Price Impact Too High",
        description: `Price impact exceeds ${slippageNumber}% slippage tolerance`,
        variant: "destructive",
      });
      return;
    }

    setTransaction({ 
      type: 'sell', 
      amount: sellAmount, 
      status: 'pending' 
    });

    try {
      if (isTestMode) {
        // TEST MODE: Mock logic
        const newPromptRaised = Math.max(0, promptRaised - result.return);
        const newPrice = getCurrentPrice(result.newTokensSold);
        const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        
        setTransaction(prev => ({ 
          ...prev, 
          hash: mockHash,
          status: 'pending' 
        }));

        toast({
          title: "Transaction Submitted",
          description: `[TEST MODE] Processing ${tokenAmount} ${agent.symbol} sale...`,
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const { error } = await supabase
          .from('agents')
          .update({
            prompt_raised: newPromptRaised,
            current_price: newPrice,
            token_holders: Math.max(0, (agent.token_holders || 1) - 1)
          })
          .eq('id', agent.id);

        if (error) throw error;

        setTransaction(prev => ({ 
          ...prev, 
          status: 'success' 
        }));

        toast({
          title: "Sale Successful!",
          description: (
            <div className="space-y-2">
              <p>Sold {tokenAmount} {agent.symbol} for {result.return.toFixed(4)} $PROMPT</p>
              <div className="flex items-center gap-2">
                <span>Transaction:</span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open(`https://etherscan.io/tx/${mockHash}`, '_blank')}
                >
                  {mockHash.slice(0, 10)}...{mockHash.slice(-8)}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          ),
        });
      } else {
        // PRODUCTION MODE: Real smart contract
        if (!address) {
          toast({
            title: "Wallet Not Connected",
            description: "Please connect your wallet to make sales.",
            variant: "destructive",
          });
          return;
        }

        if (!agent.token_address) {
          toast({
            title: "Token Not Deployed",
            description: "Agent token contract has not been deployed yet.",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase.functions.invoke('execute-sell-transaction', {
          body: {
            tokenAddress: agent.token_address,
            tokenAmount: tokenAmount.toString(),
            sellerAddress: address,
            agentId: agent.id,
            slippageTolerance: slippageNumber,
            minPromptOut: result.return * (1 - slippageNumber / 100)
          }
        });

        if (error || !data.success) {
          throw new Error(data?.error || error?.message || 'Transaction failed');
        }

        setTransaction(prev => ({ 
          ...prev, 
          hash: data.transactionHash,
          status: 'success' 
        }));

        toast({
          title: "Sale Successful!",
          description: (
            <div className="space-y-2">
              <p>Sold {tokenAmount} {agent.symbol}</p>
              <div className="flex items-center gap-2">
                <span>Transaction:</span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open(`https://basescan.org/tx/${data.transactionHash}`, '_blank')}
                >
                  {data.transactionHash.slice(0, 10)}...{data.transactionHash.slice(-8)}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          ),
        });
      }

      await refreshBalances();
      onAgentUpdated?.();
      setSellAmount('');

    } catch (error: any) {
      console.error('Sell error:', error);
      setTransaction(prev => ({ 
        ...prev, 
        status: 'error',
        error: error.message || 'Transaction failed'
      }));

      let errorMessage = error.message || "Transaction failed. Please try again.";
      
      if (error.message?.includes('insufficient funds')) {
        errorMessage = "Insufficient token balance or gas fees to complete transaction.";
      } else if (error.message?.includes('reverted')) {
        errorMessage = "Transaction was reverted by the smart contract. Check slippage settings and try again.";
      } else if (error.message?.includes('gas')) {
        errorMessage = "Gas estimation failed. The network may be congested. Try again later.";
      } else if (error.message?.includes('user rejected')) {
        errorMessage = "Transaction was cancelled in your wallet.";
      }

      toast({
        title: "Sale Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetTransaction = () => {
    setTransaction({ type: null, amount: '', status: 'idle' });
  };

  console.log('[EnhancedTradingInterface] About to render main UI');

  // CONDITIONAL RENDERING FOR GRADUATED TOKENS
  if (isGraduated && !isMigrating) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Token Graduated!</h3>
            <p className="text-muted-foreground mb-4">
              This token has graduated to DEX trading
            </p>
            <Badge variant="default" className="bg-green-500">
              Available on Uniswap
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // MIGRATION STATE DISPLAY
  if (isMigrating) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              {isPolling ? (
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">Token Migration in Progress</h3>
            <p className="text-muted-foreground mb-4">
              Your agent has graduated! Token deployment to Uniswap is in progress...
            </p>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {isPolling ? 'Deploying...' : 'Waiting for deployment'}
            </Badge>
            
            {/* Disable all trading during migration */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700">
                Trading is temporarily disabled during token deployment.
                This process usually takes 2-5 minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // MAIN TRADING INTERFACE
  return (
    <div className="space-y-6">
      {/* Agent Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {agent.avatar_url && (
                <img src={agent.avatar_url} alt={agent.name} className="h-12 w-12 rounded-full" />
              )}
              <div>
                <CardTitle className="text-xl">{agent.name}</CardTitle>
                <p className="text-muted-foreground">${agent.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${currentPrice.toFixed(6)}</p>
              <p className="text-sm text-muted-foreground">Current Price</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Wallet Status */}
      {!authenticated ? (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to start trading {agent.symbol} tokens
            </p>
            <Button onClick={handleConnectWallet}>
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Wallet Connected</p>
                <p className="text-xs text-muted-foreground">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{promptBalance} $PROMPT</p>
                <p className="text-xs text-muted-foreground">Available Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bonding Curve Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Graduation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progress to Uniswap</span>
              <span>{bondingCurve.progress.toFixed(1)}%</span>
            </div>
            <Progress value={bondingCurve.progress} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Raised</p>
                <p className="font-medium">{promptRaised.toFixed(0)} PROMPT</p>
              </div>
              <div>
                <p className="text-muted-foreground">Target</p>
                <p className="font-medium">{graduationThreshold.toFixed(0)} PROMPT</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-xs text-muted-foreground">Market Cap</p>
            <p className="font-medium">${marketCap.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-xs text-muted-foreground">Holders</p>
            <p className="font-medium">{tokenHolders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-xs text-muted-foreground">24h Volume</p>
            <p className="font-medium">${volume24h.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-xs text-muted-foreground">24h Change</p>
            <p className="font-medium">{agent.price_change_24h?.toFixed(2) || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Trading Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trade {agent.symbol}</CardTitle>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Slippage: {slippage}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buy" className="w-full">
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
                  disabled={transaction.status === 'pending' || isMigrating}
                />
                {calculatedTokens && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {calculatedTokens} {agent.symbol}
                    {priceImpact > 0 && (
                      <span className="text-orange-500 ml-2">
                        ({priceImpact.toFixed(2)}% price impact)
                      </span>
                    )}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Slippage Tolerance</label>
                <div className="flex gap-2">
                  <Button
                    variant={slippage === '1.0' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSlippage('1.0')}
                    disabled={transaction.status === 'pending' || isMigrating}
                  >
                    1%
                  </Button>
                  <Button
                    variant={slippage === '2.0' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSlippage('2.0')}
                    disabled={transaction.status === 'pending' || isMigrating}
                  >
                    2%
                  </Button>
                  <Button
                    variant={slippage === '5.0' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSlippage('5.0')}
                    disabled={transaction.status === 'pending' || isMigrating}
                  >
                    5%
                  </Button>
                  <Input
                    type="number"
                    placeholder="Custom"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    className="w-20"
                    disabled={transaction.status === 'pending' || isMigrating}
                  />
                </div>
              </div>

              <Button 
                onClick={handleBuy}
                disabled={!authenticated || !buyAmount || transaction.status === 'pending' || isMigrating}
                className="w-full"
              >
                {transaction.status === 'pending' && transaction.type === 'buy' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Buy ${agent.symbol}`
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="sell" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{agent.symbol} Amount</label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  disabled={transaction.status === 'pending' || isMigrating}
                />
                {calculatedPrompt && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {calculatedPrompt} PROMPT
                  </p>
                )}
              </div>

              <Button 
                onClick={handleSell}
                disabled={!authenticated || !sellAmount || transaction.status === 'pending' || isMigrating}
                className="w-full"
                variant="outline"
              >
                {transaction.status === 'pending' && transaction.type === 'sell' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Sell ${agent.symbol}`
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Transaction Status */}
      {transaction.status === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {transaction.error}
            <Button 
              variant="link" 
              size="sm" 
              onClick={resetTransaction}
              className="ml-2 h-auto p-0"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}