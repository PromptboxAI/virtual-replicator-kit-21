import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Rocket, CheckCircle2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const PromptTokenDeployer = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  
  if (!isAdmin) return null;
  
  const handleDeploy = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setIsDeploying(true);
    setDeploymentResult(null);
    
    try {
      console.log('Deploying PROMPT test token...');
      
      const { data, error } = await supabase.functions.invoke('deploy-prompt-token-v2', {
        body: { 
          agentId: null,
          userId: user.id
        }
      });
      
      if (error) throw error;
      
      console.log('Deployment successful:', data);
      setDeploymentResult(data);
      toast.success('PROMPT token deployed successfully!');
      
      // Refetch the active contract
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Deployment error:', error);
      toast.error('Deployment failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDeploying(false);
    }
  };
  
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          Deploy PROMPT Test Token
        </CardTitle>
        <CardDescription>
          Deploy a new PROMPT token contract to Base Sepolia network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {deploymentResult ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="space-y-2">
              <div className="font-semibold">Deployment Successful!</div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {deploymentResult.contractAddress?.slice(0, 10)}...
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Block:</span>
                  <span className="font-mono text-xs">{deploymentResult.blockNumber}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => window.open(`https://sepolia.basescan.org/address/${deploymentResult.contractAddress}`, '_blank')}
              >
                View on Basescan
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertDescription className="text-sm">
              This will deploy a new PROMPT test token contract with:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>1,000 PROMPT per faucet claim</li>
                <li>1-hour cooldown period</li>
                <li>Initial supply: 1M tokens</li>
                <li>Symbol: PROMPTTEST</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleDeploy} 
          disabled={isDeploying}
          className="w-full"
          size="lg"
        >
          {isDeploying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deploying to Base Sepolia...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              Deploy New PROMPT Contract
            </>
          )}
        </Button>
        
        {isDeploying && (
          <p className="text-xs text-muted-foreground text-center">
            This may take 30-60 seconds. Please wait...
          </p>
        )}
      </CardContent>
    </Card>
  );
};
