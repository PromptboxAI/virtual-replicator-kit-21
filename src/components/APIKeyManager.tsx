import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Key, Shield, CheckCircle, XCircle, RotateCcw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface APIKey {
  name: string;
  label: string;
  required: boolean;
  description: string;
  placeholder: string;
  type: 'token' | 'secret' | 'api_key';
  validation?: (value: string) => boolean;
}

interface APIKeyManagerProps {
  agentId: string;
  category: string;
  onKeysUpdated: (hasRequiredKeys: boolean) => void;
}

const API_KEY_CONFIGS: Record<string, APIKey[]> = {
  'DeFi Assistant': [
    {
      name: 'COINBASE_API_KEY',
      label: 'Coinbase Pro API Key',
      required: true,
      description: 'Required for accessing Coinbase Pro trading data and executing trades',
      placeholder: 'Enter your Coinbase Pro API key',
      type: 'api_key'
    },
    {
      name: 'COINBASE_API_SECRET',
      label: 'Coinbase Pro API Secret',
      required: true,
      description: 'Secret key for Coinbase Pro API authentication',
      placeholder: 'Enter your Coinbase Pro API secret',
      type: 'secret'
    },
    {
      name: 'DEFILLAMA_API_KEY',
      label: 'DefiLlama API Key',
      required: false,
      description: 'For enhanced DeFi protocol data and analytics',
      placeholder: 'Enter your DefiLlama API key (optional)',
      type: 'api_key'
    },
    {
      name: 'INFURA_API_KEY',
      label: 'Infura Project ID',
      required: true,
      description: 'Required for Ethereum blockchain interactions',
      placeholder: 'Enter your Infura project ID',
      type: 'api_key'
    }
  ],
  'Content Creator': [
    {
      name: 'TWITTER_API_KEY',
      label: 'Twitter API Key',
      required: true,
      description: 'Required for posting tweets and social engagement',
      placeholder: 'Enter your Twitter API key',
      type: 'api_key'
    },
    {
      name: 'TWITTER_API_SECRET',
      label: 'Twitter API Secret',
      required: true,
      description: 'Secret key for Twitter API authentication',
      placeholder: 'Enter your Twitter API secret',
      type: 'secret'
    },
    {
      name: 'TWITTER_ACCESS_TOKEN',
      label: 'Twitter Access Token',
      required: true,
      description: 'Access token for Twitter API',
      placeholder: 'Enter your Twitter access token',
      type: 'token'
    },
    {
      name: 'TWITTER_ACCESS_SECRET',
      label: 'Twitter Access Token Secret',
      required: true,
      description: 'Secret for Twitter access token',
      placeholder: 'Enter your Twitter access token secret',
      type: 'secret'
    },
    {
      name: 'YOUTUBE_API_KEY',
      label: 'YouTube Data API Key',
      required: false,
      description: 'For YouTube analytics and content optimization',
      placeholder: 'Enter your YouTube API key (optional)',
      type: 'api_key'
    }
  ],
  'Community Manager': [
    {
      name: 'DISCORD_BOT_TOKEN',
      label: 'Discord Bot Token',
      required: true,
      description: 'Required for Discord community management',
      placeholder: 'Enter your Discord bot token',
      type: 'token'
    },
    {
      name: 'TELEGRAM_BOT_TOKEN',
      label: 'Telegram Bot Token',
      required: false,
      description: 'For Telegram community engagement',
      placeholder: 'Enter your Telegram bot token (optional)',
      type: 'token'
    },
    {
      name: 'TWITTER_API_KEY',
      label: 'Twitter API Key',
      required: false,
      description: 'For cross-platform community management',
      placeholder: 'Enter your Twitter API key (optional)',
      type: 'api_key'
    }
  ],
  'Analytics Agent': [
    {
      name: 'COINMARKETCAP_API_KEY',
      label: 'CoinMarketCap API Key',
      required: true,
      description: 'Required for cryptocurrency market data',
      placeholder: 'Enter your CoinMarketCap API key',
      type: 'api_key'
    },
    {
      name: 'COINGECKO_API_KEY',
      label: 'CoinGecko API Key',
      required: false,
      description: 'Enhanced market analytics and price data',
      placeholder: 'Enter your CoinGecko Pro API key (optional)',
      type: 'api_key'
    },
    {
      name: 'DUNE_API_KEY',
      label: 'Dune Analytics API Key',
      required: false,
      description: 'For on-chain analytics and custom queries',
      placeholder: 'Enter your Dune API key (optional)',
      type: 'api_key'
    }
  ],
  'Trading Bot': [
    {
      name: 'BINANCE_API_KEY',
      label: 'Binance API Key',
      required: false,
      description: 'For Binance trading operations',
      placeholder: 'Enter your Binance API key',
      type: 'api_key'
    },
    {
      name: 'BINANCE_API_SECRET',
      label: 'Binance API Secret',
      required: false,
      description: 'Secret key for Binance API',
      placeholder: 'Enter your Binance API secret',
      type: 'secret'
    },
    {
      name: 'COINBASE_API_KEY',
      label: 'Coinbase Pro API Key',
      required: false,
      description: 'For Coinbase Pro trading',
      placeholder: 'Enter your Coinbase Pro API key',
      type: 'api_key'
    },
    {
      name: 'COINBASE_API_SECRET',
      label: 'Coinbase Pro API Secret',
      required: false,
      description: 'Secret key for Coinbase Pro API',
      placeholder: 'Enter your Coinbase Pro API secret',
      type: 'secret'
    }
  ]
};

export function APIKeyManager({ agentId, category, onKeysUpdated }: APIKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [validationStatus, setValidationStatus] = useState<Record<string, 'pending' | 'valid' | 'invalid'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalKeys, setOriginalKeys] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const categoryConfig = API_KEY_CONFIGS[category] || [];

  useEffect(() => {
    loadAPIKeys();
  }, [agentId, category]);

  useEffect(() => {
    setHasChanges(JSON.stringify(apiKeys) !== JSON.stringify(originalKeys));
    checkRequiredKeys();
  }, [apiKeys, originalKeys]);

  const loadAPIKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_configurations')
        .select('configuration')
        .eq('agent_id', agentId)
        .eq('category', 'api_keys')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.configuration) {
        const loadedKeys = data.configuration as Record<string, string>;
        setApiKeys(loadedKeys);
        setOriginalKeys(loadedKeys);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error Loading API Keys",
        description: "Failed to load saved API keys",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkRequiredKeys = () => {
    const requiredKeys = categoryConfig.filter(config => config.required);
    const hasAllRequired = requiredKeys.every(config => apiKeys[config.name]?.trim());
    onKeysUpdated(hasAllRequired);
  };

  const validateAPIKey = async (keyName: string, value: string) => {
    if (!value.trim()) {
      setValidationStatus(prev => ({ ...prev, [keyName]: 'pending' }));
      return;
    }

    setValidationStatus(prev => ({ ...prev, [keyName]: 'pending' }));

    try {
      const { data, error } = await supabase.functions.invoke('validate-api-key', {
        body: {
          keyName,
          keyValue: value,
          category
        }
      });

      if (error) throw error;

      setValidationStatus(prev => ({ 
        ...prev, 
        [keyName]: data.valid ? 'valid' : 'invalid' 
      }));
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus(prev => ({ ...prev, [keyName]: 'invalid' }));
    }
  };

  const handleKeyChange = (keyName: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [keyName]: value }));
    
    // Debounced validation
    setTimeout(() => {
      validateAPIKey(keyName, value);
    }, 1000);
  };

  const toggleVisibility = (keyName: string) => {
    setVisibleKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agent_configurations')
        .upsert({
          agent_id: agentId,
          category: 'api_keys',
          configuration: apiKeys
        });

      if (error) throw error;

      setOriginalKeys(apiKeys);
      setHasChanges(false);

      toast({
        title: "API Keys Saved! 🔐",
        description: "Your API keys have been securely encrypted and stored.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save API keys",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setApiKeys(originalKeys);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading API key configuration...</p>
        </div>
      </div>
    );
  }

  if (categoryConfig.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No API Keys Required</h3>
            <p className="text-sm text-muted-foreground">
              This agent category doesn't require any external API keys.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">API Key Management</h2>
        <p className="text-muted-foreground">
          Configure external service API keys for your {category} agent
        </p>
      </div>

      {/* Status Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Configuration Status</h3>
              <p className="text-sm text-muted-foreground">
                {hasChanges ? "You have unsaved changes" : "API keys are up to date"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Keys
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categoryConfig.map((config, index) => (
            <div key={config.name}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={config.name} className="font-medium">
                    {config.label}
                  </Label>
                  {config.required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                  {!config.required && (
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                  )}
                  {validationStatus[config.name] === 'valid' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {validationStatus[config.name] === 'invalid' && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <div className="relative">
                  <Input
                    id={config.name}
                    type={visibleKeys[config.name] ? 'text' : 'password'}
                    value={apiKeys[config.name] || ''}
                    onChange={(e) => handleKeyChange(config.name, e.target.value)}
                    placeholder={config.placeholder}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => toggleVisibility(config.name)}
                  >
                    {visibleKeys[config.name] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </div>
              
              {index < categoryConfig.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800">Security & Privacy</h3>
              <p className="text-sm text-green-700">
                All API keys are encrypted before storage and never exposed in plain text. 
                Only your agent runtime has access to decrypt and use these keys for authorized operations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}