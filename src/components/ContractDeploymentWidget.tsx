import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Rocket } from 'lucide-react';
import { useWeb3ContractDeployment } from '@/hooks/useWeb3ContractDeployment';

export function ContractDeploymentWidget() {
  const {
    deployAll,
    isDeploying,
    promptTokenAddress,
    factoryAddress,
    isConnected,
    isCorrectNetwork,
    contractsDeployed
  } = useWeb3ContractDeployment();

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Smart Contract Deployment
          </CardTitle>
          <CardDescription>
            Deploy PROMPT token and AgentTokenFactory contracts to enable trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to deploy contracts
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Smart Contract Deployment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please switch to Base Sepolia network to deploy contracts
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Smart Contract Deployment
        </CardTitle>
        <CardDescription>
          Deploy the core contracts needed for agent token trading
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deployment Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">PROMPT Token</span>
              {promptTokenAddress && promptTokenAddress !== '0x0000000000000000000000000000000000000000' ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Deployed
                </Badge>
              ) : (
                <Badge variant="secondary">Not Deployed</Badge>
              )}
            </div>
            {promptTokenAddress && promptTokenAddress !== '0x0000000000000000000000000000000000000000' && (
              <div className="text-xs text-muted-foreground font-mono">
                {promptTokenAddress.slice(0, 10)}...{promptTokenAddress.slice(-8)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token Factory</span>
              {factoryAddress && factoryAddress !== '0x0000000000000000000000000000000000000000' ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Deployed
                </Badge>
              ) : (
                <Badge variant="secondary">Not Deployed</Badge>
              )}
            </div>
            {factoryAddress && factoryAddress !== '0x0000000000000000000000000000000000000000' && (
              <div className="text-xs text-muted-foreground font-mono">
                {factoryAddress.slice(0, 10)}...{factoryAddress.slice(-8)}
              </div>
            )}
          </div>
        </div>

        {/* Deployment Actions */}
        {contractsDeployed ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ All contracts deployed successfully! You can now create and trade agent tokens.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To enable real token trading with smart contracts, deploy the core contracts first.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={deployAll}
              disabled={isDeploying}
              className="w-full"
              size="lg"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deploying Contracts...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy All Contracts
                </>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground">
              This will deploy both PROMPT token and AgentTokenFactory contracts on Base Sepolia.
              Gas fees will be required for deployment.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}