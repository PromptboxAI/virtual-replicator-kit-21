import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  Wallet, 
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { BondingCurveChart } from './BondingCurveChart';
import { 
  calculateBuyCost, 
  calculateSellReturn, 
  formatPrice, 
  formatPromptAmount, 
  getCurrentPrice, 
  calculateTokensFromPrompt 
} from '@/lib/bondingCurve';
import { supabase } from '@/integrations/supabase/client';
import { usePrivy } from '@privy-io/react-auth';

interface Agent {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap?: number;
  token_holders?: number;
  prompt_raised?: number;
  token_graduated?: boolean;
  token_address?: string | null;
}

interface EnhancedTradingInterfaceProps {
  agent: Agent;
  onAgentUpdated?: () => void;
  isMigrating?: boolean;
}

interface TransactionState {
  type: 'buy' | 'sell' | null;
  amount: string;
  hash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
}

export function EnhancedTradingInterface({ 
  agent, 
  onAgentUpdated, 
  isMigrating = false 
}: EnhancedTradingInterfaceProps) {
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [calculatedTokens, setCalculatedTokens] = useState('');
  const [calculatedPrompt, setCalculatedPrompt] = useState('');
  const [priceImpact, setPriceImpact] = useState(0);
  const [transaction, setTransaction] = useState<TransactionState>({ type: null, amount: '', status: 'idle' });
  
  const { toast } = useToast();
  const { login } = usePrivy();
  const {
    address,
    isConnected,
    promptBalance,
    isLoading: walletLoading,
    refreshBalances,
    payForAgentCreation,
    isTestMode
  } = usePrivyWallet();

  // Calculate bonding curve metrics
  const promptRaised = agent.prompt_raised || 0;
  const graduationTarget = 42000;
  const graduationProgress = (promptRaised / graduationTarget) * 100;
  const isGraduated = agent.token_graduated || false;

  console.log('EnhancedTradingInterface Debug:', {
    agentName: agent.name,
    tokenGraduated: agent.token_graduated,
    tokenAddress: agent.token_address,
    isGraduated,
    promptRaised,
    isMigrating
  });

  // Early return with simple debug UI to test rendering
  if (true) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">DEBUG: Enhanced Trading Interface</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Agent:</strong> {agent.name}</p>
              <p><strong>Token Graduated:</strong> {String(agent.token_graduated)}</p>
              <p><strong>Token Address:</strong> {agent.token_address || 'None'}</p>
              <p><strong>Is Graduated:</strong> {String(isGraduated)}</p>
              <p><strong>PROMPT Raised:</strong> {promptRaised}</p>
              <p><strong>Is Migrating:</strong> {String(isMigrating)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate tokens from PROMPT input
  useEffect(() => {
    if (buyAmount && parseFloat(buyAmount) > 0) {
      const promptAmount = parseFloat(buyAmount);
      const result = calculateTokensFromPrompt(promptRaised, promptAmount);
      setCalculatedTokens(result.tokenAmount.toFixed(4));
      
      // Calculate price impact
      const currentPrice = getCurrentPrice(promptRaised / 1000);
      const newPrice = getCurrentPrice(result.newTokensSold);
      const impact = ((newPrice - currentPrice) / currentPrice) * 100;
      setPriceImpact(impact);
    } else {
      setCalculatedTokens('');
      setPriceImpact(0);
    }
  }, [buyAmount, promptRaised]);

  // Calculate PROMPT from token input
  useEffect(() => {
    if (sellAmount && parseFloat(sellAmount) > 0) {
      const tokenAmount = parseFloat(sellAmount);
      const currentTokensSold = promptRaised * 1000; // Approximate conversion
      const result = calculateSellReturn(currentTokensSold, tokenAmount);
      setCalculatedPrompt(result.return.toFixed(4));
    } else {
      setCalculatedPrompt('');
    }
  }, [sellAmount, promptRaised]);

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

    setTransaction({ 
      type: 'buy', 
      amount: buyAmount, 
      status: 'pending' 
    });

    try {
      // Calculate tokens and new state
      const result = calculateTokensFromPrompt(promptRaised, promptAmount);
      const newPromptRaised = promptRaised + promptAmount;
      const newPrice = getCurrentPrice(result.newTokensSold);

      // Simulate transaction hash
      const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      setTransaction(prev => ({ 
        ...prev, 
        hash: mockHash,
        status: 'pending' 
      }));

      toast({
        title: "Transaction Submitted",
        description: isTestMode ? 
          `[TEST MODE] Processing ${promptAmount} $PROMPT purchase...` :
          `Processing ${promptAmount} $PROMPT purchase...`,
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update database
      const { error } = await supabase
        .from('agents')
        .update({
          prompt_raised: newPromptRaised,
          current_price: newPrice,
          token_holders: (agent.token_holders || 0) + 1
        })
        .eq('id', agent.id);

      if (error) throw error;

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

      // Refresh balances and agent data
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

      toast({
        title: "Purchase Failed",
        description: error.message || "Transaction failed. Please try again.",
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

    setTransaction({ 
      type: 'sell', 
      amount: sellAmount, 
      status: 'pending' 
    });

    try {
      const tokenAmount = parseFloat(sellAmount);
      const currentTokensSold = promptRaised * 1000; // Approximate
      const result = calculateSellReturn(currentTokensSold, tokenAmount);
      const newPromptRaised = Math.max(0, promptRaised - result.return);
      const newPrice = getCurrentPrice(result.newTokensSold);

      // Simulate transaction hash
      const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      setTransaction(prev => ({ 
        ...prev, 
        hash: mockHash,
        status: 'pending' 
      }));

      toast({
        title: "Transaction Submitted",
        description: isTestMode ?
          `[TEST MODE] Processing ${tokenAmount} ${agent.symbol} sale...` :
          `Processing ${tokenAmount} ${agent.symbol} sale...`,
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update database
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

      // Refresh balances and agent data
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

      toast({
        title: "Sale Failed",
        description: error.message || "Transaction failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetTransaction = () => {
    setTransaction({ type: null, amount: '', status: 'idle' });
  };

  // Show graduated token interface if graduated (will be implemented in Phase 6)
  if (isGraduated) {
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

  return (
    <div className="space-y-6">
      {/* Wallet Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5" />
              <div>
                <p className="font-medium">
                  {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
                </p>
                {isConnected && (
                  <p className="text-sm text-muted-foreground">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">$PROMPT Balance</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{formatPromptAmount(parseFloat(promptBalance))}</p>
                    {isTestMode && <Badge variant="secondary">TEST</Badge>}
                  </div>
                </div>
              )}
              {!isConnected ? (
                <Button onClick={handleConnectWallet}>
                  Connect Wallet
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshBalances}
                  disabled={walletLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${walletLoading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonding Curve Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Bonding Curve Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>PROMPT Raised</span>
              <span>{formatPromptAmount(promptRaised)} / {formatPromptAmount(graduationTarget)}</span>
            </div>
            <Progress value={graduationProgress} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {(graduationTarget - promptRaised).toLocaleString()} $PROMPT remaining until Uniswap graduation
            </p>
          </div>

          {/* Token Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-semibold">{formatPrice(agent.current_price)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="font-semibold">${(agent.market_cap || 0).toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Holders</p>
              <div className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">{(agent.token_holders || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bonding Curve Chart */}
      <BondingCurveChart 
        currentTokensSold={promptRaised * 1000}
        graduationThreshold={graduationTarget}
        promptRaised={promptRaised}
      />

      {/* Trading Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Trade {agent.symbol}</CardTitle>
          {!isConnected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your wallet to start trading
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buy" className="space-y-4">
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
                  disabled={!isConnected || isMigrating}
                />
                {calculatedTokens && (
                  <p className="text-sm text-muted-foreground">
                    ≈ {calculatedTokens} {agent.symbol}
                  </p>
                )}
              </div>

              {priceImpact > 0 && (
                <Alert>
                  <AlertDescription>
                    Price impact: {priceImpact.toFixed(2)}%
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleBuy}
                disabled={!buyAmount || !isConnected || transaction.status === 'pending' || isMigrating}
                className="w-full"
              >
                {transaction.status === 'pending' && transaction.type === 'buy' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Buy Tokens'
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
                  disabled={!isConnected || isMigrating}
                />
                {calculatedPrompt && (
                  <p className="text-sm text-muted-foreground">
                    ≈ {calculatedPrompt} $PROMPT
                  </p>
                )}
              </div>
              
              <Button 
                onClick={handleSell}
                disabled={!sellAmount || !isConnected || transaction.status === 'pending' || isMigrating}
                variant="outline"
                className="w-full"
              >
                {transaction.status === 'pending' && transaction.type === 'sell' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Sell Tokens'
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Transaction Status */}
          {transaction.status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{transaction.error}</span>
                <Button variant="outline" size="sm" onClick={resetTransaction}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}