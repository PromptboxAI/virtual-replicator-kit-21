import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Shield, Coins, TrendingUp, Save, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeFiConfig {
  protocols: string[];
  strategies: string[];
  riskTolerance: number;
  maxPositionSize: number;
  stopLossPercentage: number;
  autoCompounding: boolean;
  crossChainOperations: boolean;
  yieldOptimization: boolean;
  liquidityProvision: boolean;
  apyTarget: number;
  diversificationLevel: number;
  rebalanceFrequency: string;
  impermanentLossProtection: boolean;
}

interface ConfigurationProps {
  agent: {
    id: string;
    name: string;
    symbol: string;
    description: string;
    avatar_url: string | null;
    category: string | null;
    framework: string | null;
    is_active: boolean;
  };
  onConfigurationUpdated: () => void;
}

const DEFI_PROTOCOLS = [
  'Uniswap', 'Aave', 'Compound', 'Curve', 'SushiSwap', 'MakerDAO', 
  'Yearn Finance', 'Balancer', 'Convex', 'Lido', 'Rocket Pool', 'Frax'
];

const YIELD_STRATEGIES = [
  'Yield Farming', 'Liquidity Mining', 'Lending & Borrowing', 
  'Staking', 'Liquidity Provision', 'Arbitrage', 'Auto-Compounding', 'Cross-Chain Yield'
];

const REBALANCE_FREQUENCIES = [
  { value: 'hourly', label: 'Every Hour' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

export function DeFiAssistantConfiguration({ agent, onConfigurationUpdated }: ConfigurationProps) {
  const [config, setConfig] = useState<DeFiConfig>({
    protocols: ['Uniswap', 'Aave'],
    strategies: ['Yield Farming', 'Liquidity Provision'],
    riskTolerance: 5,
    maxPositionSize: 1000,
    stopLossPercentage: 10,
    autoCompounding: true,
    crossChainOperations: false,
    yieldOptimization: true,
    liquidityProvision: true,
    apyTarget: 15,
    diversificationLevel: 3,
    rebalanceFrequency: 'daily',
    impermanentLossProtection: true
  });

  const [originalConfig, setOriginalConfig] = useState<DeFiConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, [agent.id]);

  useEffect(() => {
    if (originalConfig) {
      setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
    }
  }, [config, originalConfig]);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('category', 'DeFi Assistant')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const loadedConfig = data.configuration as unknown as DeFiConfig;
        setConfig(loadedConfig);
        setOriginalConfig(loadedConfig);
      } else {
        setOriginalConfig(config);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error Loading Configuration",
        description: "Using default settings",
        variant: "destructive"
      });
      setOriginalConfig(config);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agent_configurations')
        .upsert({
          agent_id: agent.id,
          category: 'DeFi Assistant',
          configuration: config as any
        });

      if (error) throw error;

      setOriginalConfig(config);
      setHasChanges(false);
      onConfigurationUpdated();

      toast({
        title: "DeFi Configuration Saved! 💎",
        description: "Your DeFi assistant configuration has been updated and will optimize yields autonomously.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setConfig(originalConfig);
      setHasChanges(false);
    }
  };

  const toggleProtocol = (protocol: string) => {
    setConfig(prev => ({
      ...prev,
      protocols: prev.protocols.includes(protocol)
        ? prev.protocols.filter(p => p !== protocol)
        : [...prev.protocols, protocol]
    }));
  };

  const toggleStrategy = (strategy: string) => {
    setConfig(prev => ({
      ...prev,
      strategies: prev.strategies.includes(strategy)
        ? prev.strategies.filter(s => s !== strategy)
        : [...prev.strategies, strategy]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading DeFi configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Coins className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">DeFi Assistant Configuration</h2>
        <p className="text-muted-foreground">
          Configure your autonomous DeFi yield optimization and risk management settings
        </p>
      </div>

      {/* Configuration Status */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Configuration Status</h3>
              <p className="text-sm text-muted-foreground">
                {hasChanges ? "You have unsaved changes" : "Configuration is up to date"}
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
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            DeFi Protocols
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium">Select protocols for yield optimization</Label>
          <div className="flex flex-wrap gap-2 mt-3">
            {DEFI_PROTOCOLS.map((protocol) => (
              <Badge
                key={protocol}
                variant={config.protocols.includes(protocol) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleProtocol(protocol)}
              >
                {protocol}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Yield Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Yield Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium">Choose your preferred yield generation methods</Label>
          <div className="flex flex-wrap gap-2 mt-3">
            {YIELD_STRATEGIES.map((strategy) => (
              <Badge
                key={strategy}
                variant={config.strategies.includes(strategy) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleStrategy(strategy)}
              >
                {strategy}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Risk Tolerance: {config.riskTolerance}/10</Label>
            <div className="mt-2">
              <Slider
                value={[config.riskTolerance]}
                onValueChange={(value) => setConfig(prev => ({ ...prev, riskTolerance: value[0] }))}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxPosition">Max Position Size ($)</Label>
              <Input
                id="maxPosition"
                type="number"
                value={config.maxPositionSize}
                onChange={(e) => setConfig(prev => ({ ...prev, maxPositionSize: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="stopLoss">Stop Loss (%)</Label>
              <Input
                id="stopLoss"
                type="number"
                value={config.stopLossPercentage}
                onChange={(e) => setConfig(prev => ({ ...prev, stopLossPercentage: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="apyTarget">Target APY (%)</Label>
              <Input
                id="apyTarget"
                type="number"
                value={config.apyTarget}
                onChange={(e) => setConfig(prev => ({ ...prev, apyTarget: Number(e.target.value) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Compounding</Label>
                <p className="text-sm text-muted-foreground">Automatically reinvest rewards</p>
              </div>
              <Switch
                checked={config.autoCompounding}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoCompounding: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Cross-Chain Operations</Label>
                <p className="text-sm text-muted-foreground">Enable multi-chain yield farming</p>
              </div>
              <Switch
                checked={config.crossChainOperations}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, crossChainOperations: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Yield Optimization</Label>
                <p className="text-sm text-muted-foreground">Automatically move funds to highest yield</p>
              </div>
              <Switch
                checked={config.yieldOptimization}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, yieldOptimization: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Impermanent Loss Protection</Label>
                <p className="text-sm text-muted-foreground">Minimize IL in LP positions</p>
              </div>
              <Switch
                checked={config.impermanentLossProtection}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, impermanentLossProtection: checked }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <Label>Diversification Level: {config.diversificationLevel}</Label>
              <div className="mt-2">
                <Slider
                  value={[config.diversificationLevel]}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, diversificationLevel: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Focused</span>
                  <span>Diversified</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="rebalance">Rebalance Frequency</Label>
              <Select value={config.rebalanceFrequency} onValueChange={(value) => setConfig(prev => ({ ...prev, rebalanceFrequency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REBALANCE_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">DeFi Risk Notice</h3>
              <p className="text-sm text-yellow-700">
                DeFi protocols involve smart contract risks, impermanent loss, and market volatility. 
                Your agent will operate autonomously based on these settings. Always understand the risks involved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}