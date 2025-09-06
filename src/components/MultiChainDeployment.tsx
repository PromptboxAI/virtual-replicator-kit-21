import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Loader2, Network, ExternalLink } from 'lucide-react';
import { useMultiChainDeployment } from '@/hooks/useMultiChainDeployment';
import { SUPPORTED_CHAINS, getActiveChains, formatChainName } from '@/lib/chainConfig';

export default function MultiChainDeployment() {
  const {
    deployToChain,
    deployToAllChains,
    deploymentStatuses,
    getDeploymentStatus,
    resetDeploymentStatuses,
    isDeploying,
    isConnected
  } = useMultiChainDeployment();

  const [selectedChain, setSelectedChain] = useState<number>(84532);
  const [contractType, setContractType] = useState<'prompt-token' | 'factory' | 'lp-lock'>('prompt-token');

  const activeChains = getActiveChains();
  const statusEntries = Object.entries(deploymentStatuses);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'deploying':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      deploying: 'secondary',
      idle: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const handleSingleChainDeploy = async () => {
    await deployToChain(selectedChain, contractType);
  };

  const handleMultiChainDeploy = async () => {
    await deployToAllChains(contractType);
  };

  const getProgressValue = () => {
    if (statusEntries.length === 0) return 0;
    const completed = statusEntries.filter(([, status]) => 
      status.status === 'success' || status.status === 'error'
    ).length;
    return (completed / statusEntries.length) * 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Multi-Chain Deployment
          </CardTitle>
          <CardDescription>
            Deploy contracts across multiple blockchain networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Chain</TabsTrigger>
              <TabsTrigger value="multi">Multi-Chain</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Chain</label>
                  <Select value={selectedChain.toString()} onValueChange={(value) => setSelectedChain(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeChains.map(chain => (
                        <SelectItem key={chain.id} value={chain.id.toString()}>
                          {chain.displayName} {chain.isTestnet && '(Testnet)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Contract Type</label>
                  <Select value={contractType} onValueChange={(value: any) => setContractType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prompt-token">PROMPT Token</SelectItem>
                      <SelectItem value="factory">Agent Factory</SelectItem>
                      <SelectItem value="lp-lock">LP Lock Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSingleChainDeploy}
                disabled={!isConnected || isDeploying}
                className="w-full"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  `Deploy to ${formatChainName(selectedChain)}`
                )}
              </Button>
            </TabsContent>

            <TabsContent value="multi" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contract Type</label>
                <Select value={contractType} onValueChange={(value: any) => setContractType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prompt-token">PROMPT Token</SelectItem>
                    <SelectItem value="factory">Agent Factory</SelectItem>
                    <SelectItem value="lp-lock">LP Lock Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleMultiChainDeploy}
                  disabled={!isConnected || isDeploying}
                  className="flex-1"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    `Deploy to All Active Chains (${activeChains.length})`
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={resetDeploymentStatuses}
                  disabled={isDeploying}
                >
                  Reset
                </Button>
              </div>

              {statusEntries.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {statusEntries.filter(([, status]) => status.status === 'success').length} / {statusEntries.length}
                    </span>
                  </div>
                  <Progress value={getProgressValue()} className="w-full" />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Deployment Status */}
      {statusEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment Status</CardTitle>
            <CardDescription>
              Track deployment progress across chains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusEntries.map(([chainIdStr, status]) => {
                const chainId = Number(chainIdStr);
                const chain = SUPPORTED_CHAINS[chainId];
                
                return (
                  <div key={chainId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status.status)}
                      <div>
                        <div className="font-medium">{chain?.displayName || `Chain ${chainId}`}</div>
                        {status.error && (
                          <div className="text-sm text-red-500">{status.error}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(status.status)}
                      
                      {status.contractAddress && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`${chain?.blockExplorer}/address/${status.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}