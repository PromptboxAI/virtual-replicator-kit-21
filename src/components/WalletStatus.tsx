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
    hasExternalWallet,
    balance,
    promptBalance,
    isLoading,
    refreshBalances,
    walletProvider,
    isTestMode,
    canChangeMode
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

  if (!hasExternalWallet) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Wallet className="h-12 w-12 text-orange-500 mx-auto" />
              <p className="text-muted-foreground">
                External wallet required for token operations.
              </p>
              <p className="text-sm text-muted-foreground">
                Please connect MetaMask or another external wallet to continue.
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
            <Badge variant="default">
              External Wallet
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
              {walletProvider}
            </Badge>
            <span className="text-xs text-muted-foreground">
              External wallet connected
            </span>
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
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                Agent Tokens
                {canChangeMode && (
                  <Badge variant={isTestMode ? "secondary" : "default"} className="text-[10px] px-1 py-0">
                    {isTestMode ? "TEST" : "LIVE"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Features */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">
            🔗 External Wallet Connected
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Full user control and security</li>
            <li>• Direct blockchain interactions</li>
            <li>• Hardware wallet support</li>
            <li>• Compatible with all DeFi protocols</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}