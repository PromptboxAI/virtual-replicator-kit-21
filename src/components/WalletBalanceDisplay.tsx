import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useAuth } from '@/hooks/useAuth';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { cn } from '@/lib/utils';

interface WalletBalanceDisplayProps {
  className?: string;
  showAgentTokenBalance?: boolean;
  agentTokenBalance?: number;
  agentSymbol?: string;
  showAddTestTokens?: boolean;
}

export function WalletBalanceDisplay({ 
  className,
  showAgentTokenBalance = false,
  agentTokenBalance = 0,
  agentSymbol = '',
  showAddTestTokens = false 
}: WalletBalanceDisplayProps) {
  const { user, authenticated } = useAuth();
  const { balance: promptBalance, loading: promptLoading, addTestTokens, isTestMode } = useTokenBalance(user?.id);
  const { isConnected, address } = usePrivyWallet();

  if (!authenticated) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Wallet Not Connected</p>
              <p className="text-xs text-muted-foreground">Connect to view balances</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatBalance = (balance: number) => {
    if (balance < 0.000001) return balance.toExponential(4);
    if (balance < 0.01) return balance.toFixed(6);
    if (balance < 1) return balance.toFixed(4);
    return balance.toFixed(2);
  };

  const handleAddTestTokens = async () => {
    await addTestTokens(5000);
  };

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Wallet Balances</span>
            </div>
            {isTestMode && (
              <Badge variant="secondary" className="text-xs">
                Test Mode
              </Badge>
            )}
          </div>

          {/* PROMPT Balance */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">P</span>
              </div>
              <div>
                <p className="text-sm font-medium">PROMPT</p>
                <p className="text-xs text-muted-foreground">Native Token</p>
              </div>
            </div>
            <div className="text-right">
              {promptLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <p className="text-sm font-bold">{formatBalance(promptBalance || 0)}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </>
              )}
            </div>
          </div>

          {/* Agent Token Balance (if requested) */}
          {showAgentTokenBalance && agentSymbol && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-secondary-foreground">
                    {agentSymbol.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{agentSymbol}</p>
                  <p className="text-xs text-muted-foreground">Agent Token</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatBalance(agentTokenBalance)}</p>
                <p className="text-xs text-muted-foreground">Holding</p>
              </div>
            </div>
          )}

          {/* Wallet Info */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Connected:</span>
              <span className="font-mono">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
              </span>
            </div>
          </div>

          {/* Test Mode Actions */}
          {isTestMode && showAddTestTokens && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTestTokens}
                className="w-full text-xs"
                disabled={promptLoading}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add 5000 Test PROMPT
              </Button>
            </div>
          )}

          {/* Low Balance Warning */}
          {promptBalance !== undefined && promptBalance < 10 && (
            <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-yellow-800">Low Balance</p>
                <p className="text-xs text-yellow-700">
                  You have low PROMPT balance. {isTestMode ? 'Add test tokens above.' : 'Consider adding more tokens.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}