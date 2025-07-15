import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useToast } from '@/hooks/use-toast';

export function WalletStatus() {
  const {
    address,
    walletType,
    isConnected,
    isEmbeddedWallet,
    balance,
    promptBalance,
    isLoading,
    refreshBalances,
    walletProvider
  } = usePrivyWallet();
  
  const { toast } = useToast();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard!",
      });
    }
  };

  const openInExplorer = () => {
    if (address) {
      window.open(`https://sepolia.basescan.org/address/${address}`, '_blank');
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                No wallet connected. Sign in to get started.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Status
          <Badge variant={isEmbeddedWallet ? "default" : "secondary"}>
            {isEmbeddedWallet ? "Embedded" : "Connected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Address</label>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs flex-1">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={openInExplorer}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Wallet Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Wallet Type</label>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {isEmbeddedWallet ? "Privy Embedded" : walletProvider}
            </Badge>
            {isEmbeddedWallet && (
              <span className="text-xs text-muted-foreground">
                Auto-generated on signup
              </span>
            )}
          </div>
        </div>

        {/* Balances */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Balances</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshBalances}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-bold">{balance} ETH</div>
              <div className="text-xs text-muted-foreground">Base Sepolia</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-bold">{promptBalance} $PROMPT</div>
              <div className="text-xs text-muted-foreground">Agent Tokens</div>
            </div>
          </div>
        </div>

        {/* Wallet Features */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">
            {isEmbeddedWallet ? "✨ Embedded Wallet Features" : "🔗 Connected Wallet"}
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {isEmbeddedWallet ? (
              <>
                <li>• Auto-generated on email signup</li>
                <li>• No manual setup required</li>
                <li>• Seamless token operations</li>
                <li>• Secured by Privy</li>
              </>
            ) : (
              <>
                <li>• External wallet connected</li>
                <li>• Full user control</li>
                <li>• Hardware wallet support</li>
                <li>• MetaMask compatible</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}