import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWeb3ContractDeployment } from '@/hooks/useWeb3ContractDeployment';
import { useAuth } from '@/hooks/useAuth';
import { Copy, ExternalLink, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export function ContractDeployment() {
  const { user } = useAuth();
  const { 
    deployAll, 
    isDeploying, 
    promptTokenAddress, 
    factoryAddress,
    isConnected,
    userAddress,
    isCorrectNetwork
  } = useWeb3ContractDeployment();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const openEtherscan = (address: string) => {
    window.open(`https://sepolia.basescan.org/address/${address}`, '_blank');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Contract Deployment</CardTitle>
        <CardDescription>
          Deploy PROMPTTEST token and AgentTokenFactory contracts to Base Sepolia testnet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="text-center space-y-4">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">
                Please connect your wallet to deploy contracts
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Contracts will be deployed using your connected wallet on Base Sepolia
              </p>
            </div>
            <Button disabled>Wallet Connection Required</Button>
          </div>
        ) : !isCorrectNetwork ? (
          <div className="text-center space-y-4">
            <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
              <p className="text-destructive font-medium">Wrong Network</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please switch to Base Sepolia network in your wallet
              </p>
            </div>
            <Button disabled>Switch to Base Sepolia</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connected Wallet:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Base Sepolia
                  </Badge>
                  {userAddress && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Contracts will be deployed using your connected wallet through MetaMask
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Deployment Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">PROMPTTEST Token</div>
                    <div className="text-sm text-muted-foreground">
                      ERC20 token with minting capability for testing
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {promptTokenAddress && promptTokenAddress !== '0x0000000000000000000000000000000000000000' ? (
                      <>
                        <Badge variant="default">Deployed</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(promptTokenAddress)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEtherscan(promptTokenAddress)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary">Not Deployed</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">AgentTokenFactory</div>
                    <div className="text-sm text-muted-foreground">
                      Factory contract for creating agent tokens
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {factoryAddress && factoryAddress !== '0x0000000000000000000000000000000000000000' ? (
                      <>
                        <Badge variant="default">Deployed</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(factoryAddress)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEtherscan(factoryAddress)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary">Not Deployed</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={deployAll}
                disabled={isDeploying || !isConnected || !isCorrectNetwork}
                className="w-full"
                size="lg"
              >
                {isDeploying ? 'Deploying via MetaMask...' : 'Deploy All Contracts'}
              </Button>

              {promptTokenAddress && factoryAddress && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">✅ Deployment Complete!</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Contracts deployed with your wallet as owner</li>
                    <li>Addresses saved to browser storage for persistence</li>
                    <li>Test the admin faucet with real PROMPTTEST tokens</li>
                    <li>Verify contracts on BaseScan using the links above</li>
                  </ol>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}