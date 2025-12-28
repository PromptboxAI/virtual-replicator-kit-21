import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useSignMessage } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Circle, Loader2, XCircle, Copy, ExternalLink, Rocket, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  REWARD_DISTRIBUTOR_V6_ADDRESS,
  TEAM_VESTING_V6_ADDRESS,
  LP_LOCKER_V6_ADDRESS,
  GRADUATION_MANAGER_V6_ADDRESS,
  AGENT_FACTORY_V6_ADDRESS,
} from '@/lib/contractsV6';

// Deployed V6 contracts for seeding (Base Sepolia)
const V6_DEPLOYED_CONTRACTS = [
  { type: 'RewardDistributor_V6', address: REWARD_DISTRIBUTOR_V6_ADDRESS },
  { type: 'TeamVesting_V6', address: TEAM_VESTING_V6_ADDRESS },
  { type: 'LPLocker_V6', address: LP_LOCKER_V6_ADDRESS },
  { type: 'GraduationManager_V6', address: GRADUATION_MANAGER_V6_ADDRESS },
  { type: 'AgentFactory_V6', address: AGENT_FACTORY_V6_ADDRESS },
];

interface DeploymentStep {
  step: number;
  name: string;
  status: 'pending' | 'deploying' | 'completed' | 'skipped' | 'failed';
  contractType: string;
  address?: string;
  txHash?: string;
  error?: string;
}

interface DeploymentResult {
  success: boolean;
  chainId: number;
  network: string;
  blockExplorer: string;
  steps: DeploymentStep[];
  addresses: {
    rewardDistributor: string;
    teamVesting: string;
    lpLocker: string;
    graduationManager: string;
    agentFactory: string;
    promptToken: string;
    vault: string;
  };
  error?: string;
  resumable?: boolean;
}

interface ExistingContract {
  contract_type: string;
  contract_address: string;
  transaction_hash: string;
  created_at: string;
}

const NETWORKS = [
  { id: 84532, name: 'Base Sepolia', explorer: 'https://sepolia.basescan.org' },
  { id: 8453, name: 'Base Mainnet', explorer: 'https://basescan.org', disabled: true },
];

export function V6DeploymentPanel() {
  const { user } = usePrivy();
  const { address: wagmiAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [selectedChain, setSelectedChain] = useState<number>(84532);
  const [isDeploying, setIsDeploying] = useState(false);
  const [steps, setSteps] = useState<DeploymentStep[]>([]);
  const [result, setResult] = useState<DeploymentResult | null>(null);
  const [existingContracts, setExistingContracts] = useState<ExistingContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Prefer wagmi address (external wallet) over Privy embedded wallet
  const walletAddress = wagmiAddress || user?.wallet?.address;

  // Fetch existing deployed contracts
  useEffect(() => {
    async function fetchExisting() {
      setIsLoading(true);
      const network = selectedChain === 84532 ? 'base_sepolia' : 'base_mainnet';
      const { data } = await supabase
        .from('deployed_contracts')
        .select('contract_type, contract_address, transaction_hash, created_at')
        .eq('version', 'v6')
        .eq('network', network)
        .eq('is_active', true);
      
      setExistingContracts((data as ExistingContract[]) || []);
      setIsLoading(false);
    }
    fetchExisting();
  }, [selectedChain]);

  const getExistingContract = (type: string) => 
    existingContracts.find(c => c.contract_type === type);

  // Sync deployed contracts to database (for contracts that failed to save)
  const [isSyncing, setIsSyncing] = useState(false);
  const handleSyncToDatabase = async () => {
    if (selectedChain !== 84532) {
      toast.error('Only Base Sepolia is supported for sync');
      return;
    }
    
    setIsSyncing(true);
    const network = 'base_sepolia';
    let successCount = 0;
    let skipCount = 0;
    
    try {
      for (const contract of V6_DEPLOYED_CONTRACTS) {
        // Skip if already in database
        if (existingContracts.some(c => c.contract_type === contract.type)) {
          skipCount++;
          continue;
        }
        
        // Skip placeholder addresses
        if (contract.address.startsWith('0x000000')) {
          continue;
        }
        
        const { error } = await supabase.from('deployed_contracts').insert({
          contract_address: contract.address,
          contract_type: contract.type,
          version: 'v6',
          network,
          is_active: true,
          name: contract.type,
          symbol: 'V6',
          deployment_timestamp: new Date().toISOString(),
        });
        
        if (error) {
          console.error('Failed to save:', contract.type, error.message);
        } else {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Synced ${successCount} contracts to database`);
        // Refresh the list
        const { data } = await supabase
          .from('deployed_contracts')
          .select('contract_type, contract_address, transaction_hash, created_at')
          .eq('version', 'v6')
          .eq('network', network)
          .eq('is_active', true);
        setExistingContracts((data as ExistingContract[]) || []);
      } else if (skipCount === V6_DEPLOYED_CONTRACTS.length) {
        toast.info('All contracts already synced');
      } else {
        toast.error('No contracts were synced');
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Failed to sync contracts');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeploy = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsDeploying(true);
    setSteps([]);
    setResult(null);

    try {
      // Create message to sign
      const message = `Deploy V6 Contracts\nChain: ${selectedChain}\nTimestamp: ${Date.now()}`;
      
      // Request signature using wagmi (works with external wallets like MetaMask)
      let signature: string;
      try {
        signature = await signMessageAsync({ message, account: wagmiAddress as `0x${string}` });
      } catch (signError) {
        console.error('Signature error:', signError);
        throw new Error('Signature rejected or wallet not connected');
      }
      
      if (!signature) {
        throw new Error('Signature rejected');
      }

      toast.info('Signature verified. Starting deployment...');

      // Call edge function
      const response = await supabase.functions.invoke('deploy-v6-contracts', {
        body: {
          chainId: selectedChain,
          adminWallet: walletAddress,
          signature,
          message,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data as DeploymentResult;
      setSteps(data.steps || []);
      setResult(data);

      if (data.success) {
        toast.success('V6 contracts deployed successfully!');
        // Refresh existing contracts
        const network = selectedChain === 84532 ? 'base_sepolia' : 'base_mainnet';
        const { data: refreshed } = await supabase
          .from('deployed_contracts')
          .select('contract_type, contract_address, transaction_hash, created_at')
          .eq('version', 'v6')
          .eq('network', network)
          .eq('is_active', true);
        setExistingContracts((refreshed as ExistingContract[]) || []);
      } else {
        toast.error(data.error || 'Deployment failed');
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Deployment failed');
      console.error('Deployment error:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStepIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'deploying':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'skipped':
        return <CheckCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getExplorerUrl = (address: string, type: 'address' | 'tx' = 'address') => {
    const network = NETWORKS.find(n => n.id === selectedChain);
    return `${network?.explorer}/${type}/${address}`;
  };

  const allDeployed = existingContracts.length >= 5;

  return (
    <div className="space-y-6">
      {/* Network Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            V6 Contract Deployment
          </CardTitle>
          <CardDescription>
            Deploy the V6 bonding curve system contracts with resume capability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={String(selectedChain)}
                onValueChange={(v) => setSelectedChain(Number(v))}
                disabled={isDeploying}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((network) => (
                    <SelectItem
                      key={network.id}
                      value={String(network.id)}
                      disabled={network.disabled}
                    >
                      {network.name} {network.disabled && '(Coming Soon)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleDeploy}
              disabled={isDeploying || !walletAddress}
              className="gap-2"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : allDeployed ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Redeploy
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  {existingContracts.length > 0 ? 'Resume Deploy' : 'Deploy V6 Contracts'}
                </>
              )}
            </Button>

            {/* Sync button - for contracts deployed but not saved to DB */}
            {!allDeployed && REWARD_DISTRIBUTOR_V6_ADDRESS && !REWARD_DISTRIBUTOR_V6_ADDRESS.startsWith('0x000000') && (
              <Button
                onClick={handleSyncToDatabase}
                disabled={isSyncing}
                variant="outline"
                className="gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Sync to DB
                  </>
                )}
              </Button>
            )}
          </div>

          {!walletAddress && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              Connect your wallet to deploy contracts
            </div>
          )}

          {walletAddress && (
            <div className="text-sm text-muted-foreground">
              Deploying as: <code className="bg-muted px-2 py-1 rounded">{walletAddress}</code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment Progress */}
      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStepIcon(step.status)}
                    <div>
                      <div className="font-medium">
                        Step {step.step}: {step.name}
                      </div>
                      {step.address && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {step.address.slice(0, 10)}...{step.address.slice(-8)}
                        </div>
                      )}
                      {step.error && (
                        <div className="text-xs text-red-500">{step.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        step.status === 'completed'
                          ? 'default'
                          : step.status === 'failed'
                          ? 'destructive'
                          : step.status === 'skipped'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {step.status}
                    </Badge>
                    {step.address && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(step.address!, step.name)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    {step.txHash && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => window.open(getExplorerUrl(step.txHash!, 'tx'), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing/Deployed Contracts */}
      <Card>
        <CardHeader>
          <CardTitle>Deployed V6 Contracts</CardTitle>
          <CardDescription>
            Contracts already deployed on {NETWORKS.find(n => n.id === selectedChain)?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : existingContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No V6 contracts deployed yet on this network
            </div>
          ) : (
            <div className="space-y-3">
              {['RewardDistributor_V6', 'TeamVesting_V6', 'LPLocker_V6', 'GraduationManager_V6', 'AgentFactory_V6'].map((type) => {
                const contract = getExistingContract(type);
                return (
                  <div
                    key={type}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      contract ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {contract ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{type.replace('_V6', '')}</div>
                        {contract && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {contract.contract_address}
                          </div>
                        )}
                      </div>
                    </div>
                    {contract && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(contract.contract_address, type)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => window.open(getExplorerUrl(contract.contract_address), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Summary */}
      {result && result.success && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Deployment Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="font-mono">{result.network}</span>
              </div>
              <div className="flex justify-between">
                <span>Contracts Deployed:</span>
                <span>{result.steps.filter(s => s.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Contracts Skipped:</span>
                <span>{result.steps.filter(s => s.status === 'skipped').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
