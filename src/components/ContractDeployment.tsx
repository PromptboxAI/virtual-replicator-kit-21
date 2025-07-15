import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContractDeployment } from '@/hooks/useContractDeployment';
import { useAuth } from '@/hooks/useAuth';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function ContractDeployment() {
  const { user } = useAuth();
  const address = user?.wallet?.address;
  const { 
    deployAll, 
    isDeploying, 
    promptTokenAddress, 
    factoryAddress 
  } = useContractDeployment();

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
        {!address ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Connect your wallet to deploy contracts
            </p>
            <Button disabled>Connect Wallet First</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connected Wallet:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(address)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Deployment Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">PROMPTTEST Token</div>
                    <div className="text-sm text-muted-foreground">
                      Test token for development
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
                disabled={isDeploying}
                className="w-full"
                size="lg"
              >
                {isDeploying ? 'Deploying...' : 'Deploy All Contracts'}
              </Button>

              {promptTokenAddress && factoryAddress && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Next Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Update the constants in useAgentTokens.tsx with the deployed addresses</li>
                    <li>Test the faucet functionality with the PROMPTTEST token</li>
                    <li>Create your first agent token using the factory</li>
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