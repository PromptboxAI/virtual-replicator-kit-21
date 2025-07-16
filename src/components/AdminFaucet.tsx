import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Coins, Loader2 } from 'lucide-react';

export const AdminFaucet = () => {
  const [userAddress, setUserAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('1000');
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  if (!isAdmin) {
    return null;
  }

  const handleMintTokens = async () => {
    if (!userAddress || !tokenAmount) {
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
        description: `Minting ${tokenAmount} PROMPTTEST tokens to ${userAddress}...`,
      });

      const { data, error } = await supabase.functions.invoke('mint-test-tokens', {
        body: {
          toAddress: userAddress,
          amount: tokenAmount
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to mint tokens');
      }

      toast({
        title: "Tokens Minted Successfully",
        description: `${tokenAmount} PROMPTTEST tokens sent to ${userAddress}`,
      });

      // Reset form
      setUserAddress('');
      setTokenAmount('1000');

    } catch (error: any) {
      console.error('Error minting tokens:', error);
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint tokens",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Admin Token Faucet
        </CardTitle>
        <CardDescription>
          Mint PROMPTTEST tokens to user wallets for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userAddress">User Wallet Address</Label>
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
          onClick={handleMintTokens}
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
  );
};