import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  Zap, 
  ArrowRight,
  Loader2,
  Sparkles,
  Settings,
  Code,
  MessageSquare,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface UniversalAgentConfig {
  name: string;
  description: string;
  purpose: string;
  category: string;
  functionalities: string[];
  apiKeys: Record<string, string>;
  customInstructions: string;
}

interface UniversalAgentBuilderProps {
  onNext: (config: UniversalAgentConfig) => void;
  onBack: () => void;
}

const AVAILABLE_FUNCTIONS = [
  {
    id: 'trading',
    name: 'Trading & DEX Operations',
    description: 'Execute trades, analyze markets, manage portfolios',
    requiresApiKey: 'trading_api_key',
    icon: TrendingUp
  },
  {
    id: 'social_media',
    name: 'Social Media Management',
    description: 'Post content, manage communities, engage with users',
    requiresApiKey: 'twitter_api_key',
    icon: MessageSquare
  },
  {
    id: 'telegram',
    name: 'Telegram Bot Integration',
    description: 'Create autonomous Telegram bots for community interaction',
    requiresApiKey: 'telegram_bot_token',
    icon: Bot
  },
  {
    id: 'discord',
    name: 'Discord Bot Integration',
    description: 'Manage Discord servers and community engagement',
    requiresApiKey: 'discord_bot_token',
    icon: Settings
  },
  {
    id: 'defi_analysis',
    name: 'DeFi Analytics & Monitoring',
    description: 'Monitor DeFi protocols, yield farming, liquidity pools',
    requiresApiKey: 'defi_api_key',
    icon: Zap
  },
  {
    id: 'content_creation',
    name: 'Content Generation',
    description: 'Generate articles, social posts, marketing content',
    requiresApiKey: null,
    icon: Sparkles
  },
  {
    id: 'code_execution',
    name: 'Code Analysis & Execution',
    description: 'Analyze code, execute scripts, automate tasks',
    requiresApiKey: null,
    icon: Code
  }
];

const AGENT_CATEGORIES = [
  'Trading Bot',
  'Content Creator', 
  'Community Manager',
  'DeFi Assistant',
  'Analytics Agent',
  'Gaming Agent',
  'Custom Agent'
];

export function UniversalAgentBuilder({ onNext, onBack }: UniversalAgentBuilderProps) {
  const [config, setConfig] = useState<UniversalAgentConfig>({
    name: '',
    description: '',
    purpose: '',
    category: '',
    functionalities: [],
    apiKeys: {},
    customInstructions: ''
  });
  
  const [isValidating, setIsValidating] = useState(false);
  const [needsOpenAIKey, setNeedsOpenAIKey] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof UniversalAgentConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFunctionalityToggle = (functionId: string) => {
    setConfig(prev => ({
      ...prev,
      functionalities: prev.functionalities.includes(functionId)
        ? prev.functionalities.filter(id => id !== functionId)
        : [...prev.functionalities, functionId]
    }));
  };

  const handleApiKeyChange = (keyName: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [keyName]: value
      }
    }));
  };

  const getRequiredApiKeys = () => {
    return AVAILABLE_FUNCTIONS
      .filter(func => config.functionalities.includes(func.id) && func.requiresApiKey)
      .map(func => func.requiresApiKey!)
      .filter((key, index, arr) => arr.indexOf(key) === index);
  };

  const handleNext = async () => {
    if (!config.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your agent",
        variant: "destructive"
      });
      return;
    }

    if (!config.purpose.trim()) {
      toast({
        title: "Purpose Required", 
        description: "Please describe what you want your agent to do",
        variant: "destructive"
      });
      return;
    }

    if (!config.category) {
      toast({
        title: "Category Required",
        description: "Please select a category for your agent",
        variant: "destructive"
      });
      return;
    }

    if (config.functionalities.length === 0) {
      toast({
        title: "Functions Required",
        description: "Please select at least one functionality for your agent",
        variant: "destructive"
      });
      return;
    }

    // Check required API keys
    const requiredKeys = getRequiredApiKeys();
    const missingKeys = requiredKeys.filter(key => !config.apiKeys[key]?.trim());
    
    if (missingKeys.length > 0) {
      toast({
        title: "API Keys Required",
        description: `Please provide API keys for: ${missingKeys.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    
    try {
      // First check if OpenAI API key is configured
      const { data, error } = await supabase.functions.invoke('create-openai-assistant', {
        body: {
          name: config.name,
          description: config.description,
          purpose: config.purpose,
          functionalities: config.functionalities,
          customInstructions: config.customInstructions,
          category: config.category,
          validate: true // Just validate, don't create yet
        }
      });

      if (error && error.message?.includes('OpenAI API key not configured')) {
        setNeedsOpenAIKey(true);
        setIsValidating(false);
        return;
      }

      if (error) {
        toast({
          title: "Configuration Error",
          description: error.message || "Failed to validate agent configuration",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Configuration Valid!",
        description: "Your agent configuration looks good. Proceeding to deployment...",
      });

      onNext(config);
    } catch (error: any) {
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate configuration",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const selectedFunctions = AVAILABLE_FUNCTIONS.filter(func => 
    config.functionalities.includes(func.id)
  );

  if (needsOpenAIKey) {
    return (
      <div className="space-y-6">
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertCircle className="w-5 h-5" />
              OpenAI API Key Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-orange-800 dark:text-orange-200">
              To use the OpenAI Assistants API for creating intelligent agents, we need your OpenAI API key.
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Please add your OpenAI API key to continue with agent creation. This enables professional-grade AI capabilities for your agent.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => setNeedsOpenAIKey(false)}>
            I've added the API key, try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Agent Information
          </CardTitle>
          <p className="text-muted-foreground">
            Tell us about your AI agent and what you want it to do
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                value={config.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., AlphaTrader, ContentKing, CommunityBot"
              />
            </div>
            
            <div>
              <Label htmlFor="agent-category">Category</Label>
              <Select value={config.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="agent-description">Description (Optional)</Label>
            <Input
              id="agent-description"
              value={config.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of your agent"
            />
          </div>

          <div>
            <Label htmlFor="agent-purpose">What should your agent do?</Label>
            <Textarea
              id="agent-purpose"
              value={config.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="Describe in natural language what you want your agent to accomplish. For example: 'I want a trading bot that analyzes meme coins and executes profitable trades on Uniswap while posting updates to my Telegram channel.'"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Functionality Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Agent Capabilities
          </CardTitle>
          <p className="text-muted-foreground">
            Select the functionalities your agent will need
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_FUNCTIONS.map((func) => {
              const IconComponent = func.icon;
              const isSelected = config.functionalities.includes(func.id);
              
              return (
                <div
                  key={func.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleFunctionalityToggle(func.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isSelected}
                      onChange={() => handleFunctionalityToggle(func.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className="w-4 h-4" />
                        <h4 className="font-medium">{func.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{func.description}</p>
                      {func.requiresApiKey && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Requires API Key
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Key Configuration */}
      {getRequiredApiKeys().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              API Key Configuration
            </CardTitle>
            <p className="text-muted-foreground">
              Provide API keys for the selected functionalities
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {getRequiredApiKeys().map((keyName) => (
              <div key={keyName}>
                <Label htmlFor={keyName}>
                  {keyName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                <Input
                  id={keyName}
                  type="password"
                  value={config.apiKeys[keyName] || ''}
                  onChange={(e) => handleApiKeyChange(keyName, e.target.value)}
                  placeholder={`Enter your ${keyName.replace(/_/g, ' ')}`}
                />
              </div>
            ))}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                🔒 Your API keys are encrypted and stored securely. They are only used by your agent for authorized operations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Custom Instructions (Optional)
          </CardTitle>
          <p className="text-muted-foreground">
            Add any specific instructions or personality traits for your agent
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={config.customInstructions}
            onChange={(e) => handleInputChange('customInstructions', e.target.value)}
            placeholder="e.g., Always be polite and professional. Focus on long-term profits. Post updates every hour. Use emojis in social media posts."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Selected Functions Summary */}
      {selectedFunctions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Your agent will have these capabilities:</p>
              <div className="flex flex-wrap gap-2">
                {selectedFunctions.map((func) => (
                  <Badge key={func.id} variant="secondary">
                    {func.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        
        <Button onClick={handleNext} disabled={isValidating}>
          {isValidating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}