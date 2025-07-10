import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, Brain, Target, Twitter, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GameAgentConfig {
  name: string;
  description: string;
  goal: string;
  model: string;
  twitterIntegration: boolean;
  autonomousTrading: boolean;
}

interface GameAgentBuilderProps {
  onDeploy: (config: GameAgentConfig & { apiKey: string }) => Promise<void>;
}

const GAME_MODELS = [
  "Llama-3.1-405B-Instruct",
  "Llama-3.3-70B-Instruct", 
  "DeepSeek-R1",
  "DeepSeek-V3",
  "Qwen-2.5-72B-Instruct"
];

export function GameAgentBuilder({ onDeploy }: GameAgentBuilderProps) {
  const [config, setConfig] = useState<GameAgentConfig>({
    name: '',
    description: '',
    goal: '',
    model: 'Llama-3.1-405B-Instruct',
    twitterIntegration: false,
    autonomousTrading: false
  });
  const [apiKey, setApiKey] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  const handleDeploy = async () => {
    if (!config.name || !config.description || !config.goal) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please provide your G.A.M.E. API key",
        variant: "destructive"
      });
      return;
    }

    setIsDeploying(true);
    try {
      await onDeploy({ ...config, apiKey });
      toast({
        title: "Agent Deployed!",
        description: "Your G.A.M.E. agent has been successfully deployed",
      });
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          G.A.M.E. Agent Builder
        </CardTitle>
        <CardDescription>
          Create an autonomous AI agent using the G.A.M.E. framework with real deployment capabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter agent name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your agent's personality and capabilities"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="goal">Primary Goal *</Label>
            <Textarea
              id="goal"
              value={config.goal}
              onChange={(e) => setConfig(prev => ({ ...prev, goal: e.target.value }))}
              placeholder="What should your agent achieve? This drives its autonomous behavior."
              rows={2}
            />
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <Label htmlFor="model">AI Model</Label>
          <Select value={config.model} onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GAME_MODELS.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <Label>Agent Features</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Autonomous Planning
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Goal-Driven Behavior
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Custom Functions
            </Badge>
            {config.twitterIntegration && (
              <Badge className="flex items-center gap-1">
                <Twitter className="h-3 w-3" />
                Twitter Integration
              </Badge>
            )}
          </div>
        </div>

        {/* Integration Options */}
        <div className="space-y-3">
          <Label>Integration Options</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.twitterIntegration}
                onChange={(e) => setConfig(prev => ({ ...prev, twitterIntegration: e.target.checked }))}
                className="rounded border border-input bg-background"
              />
              <span className="text-sm">Enable Twitter Integration</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autonomousTrading}
                onChange={(e) => setConfig(prev => ({ ...prev, autonomousTrading: e.target.checked }))}
                className="rounded border border-input bg-background"
              />
              <span className="text-sm">Enable Autonomous Trading</span>
            </label>
          </div>
        </div>

        {/* API Key */}
        <div>
          <Label htmlFor="apiKey">G.A.M.E. API Key *</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your G.A.M.E. API key"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Get your API key from{' '}
            <a 
              href="https://console.game.virtuals.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              G.A.M.E. Console
            </a>
          </p>
        </div>

        {/* Deploy Button */}
        <Button 
          onClick={handleDeploy} 
          disabled={isDeploying}
          className="w-full"
        >
          {isDeploying ? 'Deploying Agent...' : 'Deploy G.A.M.E. Agent'}
        </Button>
      </CardContent>
    </Card>
  );
}