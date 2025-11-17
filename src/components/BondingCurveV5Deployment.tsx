import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DeploymentStatus {
  bondingCurve?: {
    address: string;
    txHash: string;
  };
  factory?: {
    address: string;
    txHash: string;
  };
}

export default function BondingCurveV5Deployment() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({});
  const [error, setError] = useState<string | null>(null);
  
  // Contract addresses
  const [promptTokenAddress, setPromptTokenAddress] = useState(
    localStorage.getItem('PROMPT_TOKEN_ADDRESS') || ''
  );
  const [platformVaultAddress, setPlatformVaultAddress] = useState(
    localStorage.getItem('PLATFORM_VAULT_ADDRESS') || ''
  );
  const [treasuryAddress, setTreasuryAddress] = useState(
    localStorage.getItem('TREASURY_ADDRESS') || ''
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const deployBondingCurve = async () => {
    if (!promptTokenAddress || !platformVaultAddress || !treasuryAddress) {
      setError('Please provide all required addresses');
      return;
    }

    setIsDeploying(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('deploy-bonding-curve-v5', {
        body: {
          chainId: 84532, // Base Sepolia
          promptTokenAddress,
          platformVaultAddress,
          treasuryAddress
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const newStatus = {
        ...deploymentStatus,
        bondingCurve: {
          address: data.contractAddress,
          txHash: data.transactionHash
        }
      };
      setDeploymentStatus(newStatus);
      
      // Save to localStorage
      localStorage.setItem('BONDING_CURVE_V5_ADDRESS', data.contractAddress);
      
      toast.success('BondingCurveV5 deployed successfully!');
      
      // Auto-deploy factory if bonding curve deployed
      if (!deploymentStatus.factory) {
        await deployFactory(data.contractAddress);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Deployment failed: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const deployFactory = async (bondingCurveAddr?: string) => {
    const bcAddress = bondingCurveAddr || deploymentStatus.bondingCurve?.address;
    
    if (!bcAddress) {
      setError('BondingCurve must be deployed first');
      return;
    }

    setIsDeploying(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('deploy-agent-factory-v5', {
        body: {
          chainId: 84532,
          bondingCurveAddress: bcAddress
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setDeploymentStatus({
        ...deploymentStatus,
        factory: {
          address: data.contractAddress,
          txHash: data.transactionHash
        }
      });
      
      // Save to localStorage
      localStorage.setItem('AGENT_FACTORY_V5_ADDRESS', data.contractAddress);
      
      toast.success('AgentFactoryV5 deployed successfully!');
    } catch (err: any) {
      setError(err.message);
      toast.error(`Factory deployment failed: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const isFullyDeployed = Boolean(deploymentStatus.bondingCurve && deploymentStatus.factory);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bonding Curve V5 Deployment</CardTitle>
        <CardDescription>
          Deploy BondingCurveV5 and AgentFactoryV5 contracts to Base Sepolia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="promptToken">PROMPT Token Address</Label>
            <Input
              id="promptToken"
              value={promptTokenAddress}
              onChange={(e) => setPromptTokenAddress(e.target.value)}
              placeholder="0x..."
              disabled={isDeploying}
            />
          </div>
          
          <div>
            <Label htmlFor="platformVault">Platform Vault Address</Label>
            <Input
              id="platformVault"
              value={platformVaultAddress}
              onChange={(e) => setPlatformVaultAddress(e.target.value)}
              placeholder="0x..."
              disabled={isDeploying}
            />
          </div>
          
          <div>
            <Label htmlFor="treasury">Treasury Address</Label>
            <Input
              id="treasury"
              value={treasuryAddress}
              onChange={(e) => setTreasuryAddress(e.target.value)}
              placeholder="0x..."
              disabled={isDeploying}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Deployment Status */}
        {deploymentStatus.bondingCurve && (
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-semibold">BondingCurveV5 Deployed</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Address:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs">{deploymentStatus.bondingCurve.address.slice(0, 10)}...{deploymentStatus.bondingCurve.address.slice(-8)}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(deploymentStatus.bondingCurve!.address, 'Address')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {deploymentStatus.factory && (
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-semibold">AgentFactoryV5 Deployed</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Address:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs">{deploymentStatus.factory.address.slice(0, 10)}...{deploymentStatus.factory.address.slice(-8)}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(deploymentStatus.factory!.address, 'Address')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isFullyDeployed && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              All V5 contracts deployed successfully! You can now create V5 agents.
            </AlertDescription>
          </Alert>
        )}

        {/* Deploy Button */}
        <Button
          onClick={deployBondingCurve}
          disabled={isDeploying || !promptTokenAddress || !platformVaultAddress || !treasuryAddress || isFullyDeployed}
          className="w-full"
        >
          {isDeploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deploying Contracts...
            </>
          ) : isFullyDeployed ? (
            'Contracts Deployed'
          ) : (
            'Deploy V5 Contracts'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Note: Contracts require compiled bytecode. Update edge functions with actual compiled contracts before production deployment.
        </p>
      </CardContent>
    </Card>
  );
}
