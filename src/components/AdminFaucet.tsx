import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { supabase } from '@/integrations/supabase/client';
import { Coins, Loader2, Zap, TestTube } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AdminFaucet = () => {
  const [userAddress, setUserAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('1000');
  const [isLoading, setIsLoading] = useState(false);
  const [onChainBalance, setOnChainBalance] = useState<string>('Checking...');
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const { balance: offChainBalance, loading: balanceLoading, refetchBalance } = useTokenBalance(user?.id);
  const { toast } = useToast();

  // Your deployer wallet address for quick self-minting
  const DEPLOYER_WALLET = '0x23d03610584B0f0988A6F9C281a37094D5611388';

  useEffect(() => {
    if (user?.id) {
      // Set deployer address as default for quick testing
      setUserAddress(DEPLOYER_WALLET);
    }
  }, [user?.id]);

  useEffect(() => {
    // You can add on-chain balance checking here if needed
    // For now, we'll show a placeholder
    setOnChainBalance('Check manually');
  }, []);

  if (!isAdmin) {
    return null;
  }

  const handleMintTokens = async (customAmount?: string, customAddress?: string) => {
    const amount = customAmount || tokenAmount;
    const address = customAddress || userAddress;

    if (!address || !amount) {
      toast({
        title: "Missing Information",
        description: "Please provide both user address and token amount.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      toast({
        title: "Minting Tokens",
        description: `Minting ${amount} PROMPTTEST tokens to ${address}...`,
      });

      const { data, error } = await supabase.functions.invoke('mint-test-tokens', {
        body: {
          toAddress: address,
          amount: amount
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to mint tokens');
      }

      toast({
        title: "✅ Tokens Minted Successfully",
        description: `${amount} PROMPTTEST tokens sent to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

      // Reset form only if using custom inputs
      if (!customAmount && !customAddress) {
        setUserAddress(DEPLOYER_WALLET);
        setTokenAmount('1000');
      }

    } catch (error: any) {
      console.error('Error minting tokens:', error);
      toast({
        title: "❌ Minting Failed",
        description: error.message || "Failed to mint tokens",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickMint = (amount: string) => {
    handleMintTokens(amount, DEPLOYER_WALLET);
  };

  const presetAmounts = [
    { label: '1K', value: '1000', description: 'Small test' },
    { label: '10K', value: '10000', description: 'Medium test' },
    { label: '50K', value: '50000', description: 'Large test' },
    { label: '200K', value: '200000', description: 'Max test' },
  ];

  return (
    <div className="space-y-6">
      {/* Balance Overview Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Testing Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive testing setup for PROMPT token systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Off-Chain PROMPT</p>
                  <p className="text-2xl font-bold">
                    {balanceLoading ? 'Loading...' : `${offChainBalance?.toLocaleString()}`}
                  </p>
                  <Badge variant="secondary" className="mt-1">For Trading Tests</Badge>
                </div>
                <Coins className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">On-Chain PROMPTTEST</p>
                  <p className="text-2xl font-bold">{onChainBalance}</p>
                  <Badge variant="outline" className="mt-1">For Contract Tests</Badge>
                </div>
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Self-Mint (To Your Wallet)
          </CardTitle>
          <CardDescription>
            Instantly mint PROMPTTEST tokens to {DEPLOYER_WALLET.slice(0, 6)}...{DEPLOYER_WALLET.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {presetAmounts.map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => handleQuickMint(preset.value)}
                className="flex flex-col h-auto p-3"
              >
                <span className="font-bold">{preset.label}</span>
                <span className="text-xs text-muted-foreground">{preset.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Minting Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Manual Token Minting
          </CardTitle>
          <CardDescription>
            Mint PROMPTTEST tokens to any wallet address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userAddress">Target Wallet Address</Label>
            <Input
              id="userAddress"
              placeholder="0x..."
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tokenAmount">Token Amount</Label>
            <Input
              id="tokenAmount"
              type="number"
              placeholder="1000"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
            />
          </div>

          <Button 
            onClick={() => handleMintTokens()}
            disabled={isLoading || !userAddress || !tokenAmount}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              'Mint Tokens'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Testing Guide Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>🧪 Testing Scenarios</CardTitle>
          <CardDescription>
            Recommended test flows for comprehensive validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="p-2 rounded border-l-4 border-l-blue-500 bg-blue-50/50">
              <strong>Low Raise (5K-15K):</strong> Test bonding curve accuracy and price calculations
            </div>
            <div className="p-2 rounded border-l-4 border-l-yellow-500 bg-yellow-50/50">
              <strong>Mid Raise (20K-35K):</strong> Test approaching graduation threshold behavior
            </div>
            <div className="p-2 rounded border-l-4 border-l-green-500 bg-green-50/50">
              <strong>Graduation (42K+):</strong> Test full graduation flow and DEX deployment
            </div>
            <div className="p-2 rounded border-l-4 border-l-purple-500 bg-purple-50/50">
              <strong>Edge Cases:</strong> Test exact amounts (42,000), large trades (100K+)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};