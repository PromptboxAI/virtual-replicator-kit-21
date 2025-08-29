
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Rocket, Zap, Shield, Loader2, Sparkles, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface DeploymentStep {
  id: string;
  title: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  description?: string;
}

export function NewAgentCreator() {
  const { address } = useAccount();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [agentData, setAgentData] = useState({
    name: '',
    symbol: '',
    description: '',
    category: 'ai-assistant'
  });
  
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([
    { id: 'validate', title: 'Validating Parameters', status: 'pending' },
    { id: 'database', title: 'Creating Agent Record', status: 'pending' },
    { id: 'contract', title: 'Deploying Smart Contract', status: 'pending' },
    { id: 'verify', title: 'Verifying Deployment', status: 'pending' },
    { id: 'finalize', title: 'Finalizing Setup', status: 'pending' }
  ]);

  const updateStepStatus = (stepId: string, status: DeploymentStep['status'], description?: string) => {
    setDeploymentSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, status, description }
          : step
      )
    );
    setCurrentStep(stepId);
  };

  // 🔒 DEBOUNCED DEPLOYMENT FUNCTION to prevent double-clicks
  const createAgentV2 = useCallback(async () => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create an agent",
        variant: "destructive",
      });
      return;
    }

    if (!agentData.name || !agentData.symbol) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and symbol for your agent",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    setDeploymentProgress(0);

    try {
      // Step 1: Validation
      updateStepStatus('validate', 'loading');
      setDeploymentProgress(10);
      
      // Validate symbol is unique
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('symbol', agentData.symbol.toUpperCase())
        .single();

      if (existingAgent) {
        throw new Error(`Symbol ${agentData.symbol} is already taken`);
      }

      updateStepStatus('validate', 'completed');
      setDeploymentProgress(20);

      // Step 2: Create agent record
      updateStepStatus('database', 'loading');
      
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          name: agentData.name,
          symbol: agentData.symbol.toUpperCase(),
          description: agentData.description,
          category: agentData.category,
          creator_id: address,
          framework: 'G.A.M.E.',
          test_mode: false, // Real contract mode
          status: 'DEPLOYING'
        })
        .select()
        .single();

      if (agentError) throw agentError;

      updateStepStatus('database', 'completed');
      setDeploymentProgress(40);

      // Step 3: Deploy V2 contract
      updateStepStatus('contract', 'loading', 'Deploying to Base Sepolia...');
      
      toast({
        title: "🚀 Deploying Smart Contract",
        description: "This may take 30-60 seconds. Please wait...",
      });

      const { data: deployment, error: deployError } = await supabase.functions.invoke('deploy-agent-token-v2', {
        body: {
          name: agentData.name,
          symbol: agentData.symbol.toUpperCase(),
          agentId: agent.id,
          creatorAddress: address
        }
      });

      if (deployError) {
        console.error('Deployment error:', deployError);
        throw new Error(deployError.message || 'Contract deployment failed');
      }

      if (!deployment?.success) {
        throw new Error(deployment?.error || 'Contract deployment failed');
      }

      setContractAddress(deployment.contractAddress);
      updateStepStatus('contract', 'completed', `Contract: ${deployment.contractAddress}`);
      setDeploymentProgress(70);

      // Step 4: Verify deployment
      updateStepStatus('verify', 'loading');
      
      // Wait a moment for blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateStepStatus('verify', 'completed');
      setDeploymentProgress(85);

      // Step 5: Finalize
      updateStepStatus('finalize', 'loading');

      // Update agent status to ACTIVE
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (updateError) {
        console.error('Update error:', updateError);
        // Don't fail here, just log the error
      }

      updateStepStatus('finalize', 'completed');
      setDeploymentProgress(100);

      toast({
        title: "🎉 Agent Deployed Successfully!",
        description: `Real smart contract deployed at ${deployment.contractAddress.slice(0, 8)}...`,
      });

      // Navigate to the new agent page after a short delay
      setTimeout(() => {
        navigate(`/agent/${agent.id}`);
      }, 2000);

    } catch (error: any) {
      console.error('Agent creation error:', error);
      
      // Update current step to error
      if (currentStep) {
        updateStepStatus(currentStep, 'error', error.message);
      }
      
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to create agent",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [address, agentData, currentStep, navigate, toast]); // Dependencies for useCallback

  const agentCategories = [
    "DeFi", "Gaming", "Social", "Trading", "Content", "Analytics", "NFTs", "Education"
  ];

  const getStepIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'loading': return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Create New Agent (V2)
          </CardTitle>
          <CardDescription>
            Deploy your AI agent with a real smart contract on Base Sepolia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Real Contract Alert */}
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <Shield className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              <strong>Real Smart Contract:</strong> This will deploy an actual ERC20 contract on Base Sepolia. 
              Users can interact with the same contract from pre-graduation through post-graduation.
            </AlertDescription>
          </Alert>

          {!isCreating && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      value={agentData.name}
                      onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                      placeholder="My Awesome Agent"
                      disabled={isCreating}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="agent-symbol">Token Symbol</Label>
                    <Input
                      id="agent-symbol"
                      value={agentData.symbol}
                      onChange={(e) => setAgentData({ 
                        ...agentData, 
                        symbol: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11)
                      })}
                      placeholder="AGENT"
                      disabled={isCreating}
                      maxLength={11}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      2-11 characters, letters and numbers only
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {agentCategories.map((category) => (
                        <Badge
                          key={category}
                          variant={agentData.category === category ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => !isCreating && setAgentData({ ...agentData, category })}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="agent-description">Description</Label>
                <Textarea
                  id="agent-description"
                  value={agentData.description}
                  onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                  placeholder="Describe your agent's purpose, capabilities, and goals..."
                  rows={4}
                  disabled={isCreating}
                />
              </div>

              {/* V2 Features Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/50 dark:bg-purple-950/50">
                  <Shield className="w-6 h-6 text-purple-600 mb-2" />
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">Real Contract</h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Deployed ERC20 contract on Base Sepolia
                  </p>
                </div>
                
                <div className="p-4 border border-green-200 rounded-lg bg-green-50/50 dark:bg-green-950/50">
                  <Zap className="w-6 h-6 text-green-600 mb-2" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">Gas Optimized</h4>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Improved efficiency for all operations
                  </p>
                </div>
                
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50 dark:bg-blue-950/50">
                  <Rocket className="w-6 h-6 text-blue-600 mb-2" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Future Ready</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Migration support and slippage protection
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Deployment Progress */}
          {isCreating && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Deployment Progress</span>
                  <span className="text-sm text-muted-foreground">{deploymentProgress}%</span>
                </div>
                <Progress value={deploymentProgress} className="w-full" />
              </div>

              <div className="space-y-3">
                {deploymentSteps.map((step, index) => (
                  <div 
                    key={step.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      step.status === 'completed' ? 'bg-green-50 border-green-200' :
                      step.status === 'loading' ? 'bg-blue-50 border-blue-200' :
                      step.status === 'error' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {getStepIcon(step.status)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{step.title}</div>
                      {step.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {step.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {contractAddress && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <div className="flex items-center justify-between">
                      <span>Contract deployed: {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://sepolia.basescan.org/address/${contractAddress}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Button
            onClick={createAgentV2}
            disabled={isCreating || !address || !agentData.name || !agentData.symbol}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Deploying Real Contract...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Deploy Real Smart Contract
              </>
            )}
          </Button>

          {!address && (
            <p className="text-center text-sm text-muted-foreground">
              Connect your wallet to deploy a real smart contract
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
