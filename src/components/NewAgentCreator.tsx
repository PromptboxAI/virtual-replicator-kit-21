import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Rocket, Zap, Shield, Loader2, Sparkles } from 'lucide-react';

export function NewAgentCreator() {
  const { address } = useAccount();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [agentData, setAgentData] = useState({
    name: '',
    symbol: '',
    description: '',
    category: 'ai-assistant'
  });

  const createAgentV2 = async () => {
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

    try {
      // Step 1: Create agent record in database
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          name: agentData.name,
          symbol: agentData.symbol.toUpperCase(),
          description: agentData.description,
          category: agentData.category,
          creator_id: address,
          framework: 'G.A.M.E.',
          test_mode: true, // Start in test mode
          status: 'DEPLOYING'
        })
        .select()
        .single();

      if (agentError) throw agentError;

      toast({
        title: "✨ Agent Created",
        description: "Now deploying V2 token contract with slippage protection...",
      });

      // Step 2: Deploy V2 token contract
      const promptTokenAddress = localStorage.getItem('promptTokenAddress') || 
                                 '0x0000000000000000000000000000000000000000';

      const { data: deployment, error: deployError } = await supabase.functions.invoke('deploy-agent-token-v2', {
        body: {
          name: agentData.name,
          symbol: agentData.symbol.toUpperCase(),
          agentId: agent.id,
          promptTokenAddress: promptTokenAddress
        }
      });

      if (deployError) throw deployError;

      if (!deployment?.success) {
        throw new Error(deployment?.error || 'Contract deployment failed');
      }

      // Step 3: Update agent with contract address
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          token_address: deployment.contractAddress,
          status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (updateError) throw updateError;

      toast({
        title: "🚀 Agent Deployed Successfully!",
        description: `V2 contract deployed with enhanced slippage protection`,
      });

      // Navigate to the new agent page
      navigate(`/agent/${agent.id}`);

    } catch (error: any) {
      console.error('Agent creation error:', error);
      
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create agent",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const agentCategories = [
    "DeFi", "Gaming", "Social", "Trading", "Content", "Analytics", "NFTs", "Education"
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Create New Agent (V2)
          </CardTitle>
          <CardDescription>
            Launch your AI agent with enhanced V2 token economics and slippage protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* V2 Features Alert */}
          <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950">
            <Shield className="w-4 h-4 text-purple-600" />
            <AlertDescription className="text-purple-900 dark:text-purple-100">
              <strong>V2 Enhanced Features:</strong> Built-in slippage protection, improved bonding curve, 
              enhanced gas efficiency, and future migration support.
            </AlertDescription>
          </Alert>

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
                    symbol: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                  })}
                  placeholder="AGENT"
                  disabled={isCreating}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  2-6 characters, letters and numbers only
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
              <h4 className="font-medium text-purple-900 dark:text-purple-100">Slippage Protection</h4>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Built-in protection against price slippage during trades
              </p>
            </div>
            
            <div className="p-4 border border-green-200 rounded-lg bg-green-50/50 dark:bg-green-950/50">
              <Zap className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-medium text-green-900 dark:text-green-100">Gas Optimized</h4>
              <p className="text-xs text-green-700 dark:text-green-300">
                Improved gas efficiency for all token operations
              </p>
            </div>
            
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50 dark:bg-blue-950/50">
              <Rocket className="w-6 h-6 text-blue-600 mb-2" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Future Ready</h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Migration support and future feature compatibility
              </p>
            </div>
          </div>

          <Button
            onClick={createAgentV2}
            disabled={isCreating || !address || !agentData.name || !agentData.symbol}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Creating Agent V2...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Create Agent V2
              </>
            )}
          </Button>

          {!address && (
            <p className="text-center text-sm text-muted-foreground">
              Connect your wallet to create an agent
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}