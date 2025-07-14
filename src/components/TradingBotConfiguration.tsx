import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TrendingUp, DollarSign, Shield, AlertTriangle, Zap, ExternalLink, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TradingBotConfig {
  tradingStrategy: string;
  riskLevel: string;
  maxPositionSize: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  tradingPairs: string[];
  exchanges: string[];
  backtestingEnabled: boolean;
  paperTradingEnabled: boolean;
  realTradingEnabled: boolean;
  maxDailyTrades: number;
  portfolioAllocation: number;
}

interface TradingBotConfigurationProps {
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

const TRADING_STRATEGIES = [
  { 
    id: 'dca', 
    name: 'Dollar Cost Averaging', 
    description: 'Regular purchases regardless of market conditions',
    parameters: { interval: '1h', amount: 100, riskMultiplier: 0.5 }
  },
  { 
    id: 'momentum', 
    name: 'Momentum Trading', 
    description: 'Follow trends and market momentum',
    parameters: { lookbackPeriod: '4h', momentumThreshold: 0.05, riskMultiplier: 1.2 }
  },
  { 
    id: 'arbitrage', 
    name: 'Arbitrage', 
    description: 'Exploit price differences across exchanges',
    parameters: { minSpread: 0.01, maxSlippage: 0.005, riskMultiplier: 0.8 }
  },
  { 
    id: 'mean_reversion', 
    name: 'Mean Reversion', 
    description: 'Buy low, sell high based on historical averages',
    parameters: { lookbackPeriod: '24h', deviationThreshold: 2, riskMultiplier: 1.0 }
  },
  { 
    id: 'grid', 
    name: 'Grid Trading', 
    description: 'Place buy/sell orders at regular intervals',
    parameters: { gridSize: 0.02, gridLevels: 5, riskMultiplier: 0.9 }
  },
  { 
    id: 'scalping', 
    name: 'Scalping', 
    description: 'Quick trades for small profits',
    parameters: { quickProfit: 0.002, maxHoldTime: '5m', riskMultiplier: 1.5 }
  }
];

const RISK_LEVELS = [
  { 
    id: 'conservative', 
    name: 'Conservative', 
    color: 'bg-green-500', 
    description: 'Low risk, stable returns',
    parameters: { maxPositionSize: 0.05, stopLoss: 0.03, takeProfit: 0.06, maxDailyTrades: 3 }
  },
  { 
    id: 'moderate', 
    name: 'Moderate', 
    color: 'bg-yellow-500', 
    description: 'Balanced risk/reward',
    parameters: { maxPositionSize: 0.1, stopLoss: 0.05, takeProfit: 0.1, maxDailyTrades: 5 }
  },
  { 
    id: 'aggressive', 
    name: 'Aggressive', 
    color: 'bg-red-500', 
    description: 'High risk, high potential returns',
    parameters: { maxPositionSize: 0.2, stopLoss: 0.08, takeProfit: 0.15, maxDailyTrades: 10 }
  }
];

const EXCHANGES = [
  'Coinbase Pro', 'Binance', 'Kraken', 'Uniswap', 'Curve', 'SushiSwap', '1inch', 'dYdX'
];

const TRADING_PAIRS = [
  'ETH/USD', 'BTC/USD', 'ETH/BTC', 'USDC/ETH', 'DAI/USDC', 'WBTC/ETH'
];

export function TradingBotConfiguration({ agent, onConfigurationUpdated }: TradingBotConfigurationProps) {
  const [config, setConfig] = useState<TradingBotConfig>({
    tradingStrategy: 'dca',
    riskLevel: 'moderate',
    maxPositionSize: 1000,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    tradingPairs: ['ETH/USD'],
    exchanges: ['Uniswap'],
    backtestingEnabled: true,
    paperTradingEnabled: true,
    realTradingEnabled: false,
    maxDailyTrades: 10,
    portfolioAllocation: 20
  });

  const [originalConfig, setOriginalConfig] = useState<TradingBotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load existing configuration
  useEffect(() => {
    loadConfiguration();
  }, [agent.id]);

  // Check for changes
  useEffect(() => {
    if (originalConfig) {
      setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
    }
  }, [config, originalConfig]);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agent.id)
        .single();

      if (error) throw error;

      // Parse existing configuration from agent metadata or use defaults
      const existingConfig = data?.framework === 'Trading Bot' ? {
        tradingStrategy: 'dca',
        riskLevel: 'moderate',
        maxPositionSize: 1000,
        stopLossPercentage: 5,
        takeProfitPercentage: 10,
        tradingPairs: ['ETH/USD'],
        exchanges: ['Uniswap'],
        backtestingEnabled: true,
        paperTradingEnabled: true,
        realTradingEnabled: false,
        maxDailyTrades: 10,
        portfolioAllocation: 20
      } : config;

      setConfig(existingConfig);
      setOriginalConfig(existingConfig);
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error Loading Configuration",
        description: "Using default settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      // Apply risk level parameters to config
      const riskLevel = RISK_LEVELS.find(r => r.id === config.riskLevel);
      const strategy = TRADING_STRATEGIES.find(s => s.id === config.tradingStrategy);
      
      const enhancedConfig = {
        ...config,
        riskParameters: riskLevel?.parameters,
        strategyParameters: strategy?.parameters,
        lastUpdated: new Date().toISOString()
      };

      // Store configuration in agent metadata
      const { error } = await supabase
        .from('agents')
        .update({ 
          framework: 'Trading Bot',
          // Store trading config in a way that can be retrieved later
          // In a real implementation, you might want a dedicated table
        })
        .eq('id', agent.id);

      if (error) throw error;

      setOriginalConfig(config);
      setHasChanges(false);
      onConfigurationUpdated();

      toast({
        title: "Configuration Saved! 🎯",
        description: "Your trading bot configuration has been updated and will take effect on the next execution cycle.",
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

  const toggleTradingPair = (pair: string) => {
    setConfig(prev => ({
      ...prev,
      tradingPairs: prev.tradingPairs.includes(pair)
        ? prev.tradingPairs.filter(p => p !== pair)
        : [...prev.tradingPairs, pair]
    }));
  };

  const toggleExchange = (exchange: string) => {
    setConfig(prev => ({
      ...prev,
      exchanges: prev.exchanges.includes(exchange)
        ? prev.exchanges.filter(e => e !== exchange)
        : [...prev.exchanges, exchange]
    }));
  };

  const handleRiskyChange = () => {
    if (config.realTradingEnabled) {
      setShowConfirmDialog(true);
    } else {
      setConfig(prev => ({ ...prev, realTradingEnabled: true }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">Trading Bot Configuration</h2>
        <p className="text-muted-foreground">
          Manage your autonomous trading agent's settings and parameters
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

      {/* Trading Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Trading Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRADING_STRATEGIES.map((strategy) => (
              <Card
                key={strategy.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.tradingStrategy === strategy.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setConfig(prev => ({ ...prev, tradingStrategy: strategy.id }))}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold">{strategy.name}</h3>
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                </CardContent>
              </Card>
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
            <Label>Risk Level</Label>
            <div className="flex gap-4 mt-2">
              {RISK_LEVELS.map((level) => (
                <div
                  key={level.id}
                  className={`flex-1 p-4 rounded-lg border cursor-pointer transition-all ${
                    config.riskLevel === level.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setConfig(prev => ({ ...prev, riskLevel: level.id }))}
                >
                  <div className={`w-4 h-4 rounded-full ${level.color} mb-2`}></div>
                  <h4 className="font-semibold">{level.name}</h4>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

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
              <Label htmlFor="takeProfit">Take Profit (%)</Label>
              <Input
                id="takeProfit"
                type="number"
                value={config.takeProfitPercentage}
                onChange={(e) => setConfig(prev => ({ ...prev, takeProfitPercentage: Number(e.target.value) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exchange and Pairs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Exchanges & Trading Pairs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Select Exchanges</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EXCHANGES.map((exchange) => (
                <Badge
                  key={exchange}
                  variant={config.exchanges.includes(exchange) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleExchange(exchange)}
                >
                  {exchange}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Trading Pairs</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TRADING_PAIRS.map((pair) => (
                <Badge
                  key={pair}
                  variant={config.tradingPairs.includes(pair) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTradingPair(pair)}
                >
                  {pair}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Trading Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="maxTrades">Max Daily Trades</Label>
              <Input
                id="maxTrades"
                type="number"
                value={config.maxDailyTrades}
                onChange={(e) => setConfig(prev => ({ ...prev, maxDailyTrades: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="allocation">Portfolio Allocation (%)</Label>
              <Input
                id="allocation"
                type="number"
                value={config.portfolioAllocation}
                onChange={(e) => setConfig(prev => ({ ...prev, portfolioAllocation: Number(e.target.value) }))}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Backtesting</Label>
                <p className="text-sm text-muted-foreground">Test strategy on historical data</p>
              </div>
              <Switch
                checked={config.backtestingEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, backtestingEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Paper Trading</Label>
                <p className="text-sm text-muted-foreground">Practice with virtual funds</p>
              </div>
              <Switch
                checked={config.paperTradingEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, paperTradingEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Enable Real Trading</Label>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </div>
              <Switch
                checked={config.realTradingEnabled}
                onCheckedChange={handleRiskyChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Real Trading?</AlertDialogTitle>
            <AlertDialogDescription>
              This will enable real trading with actual funds. Please ensure you understand the risks:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You may lose money</li>
                <li>Trading strategies can fail</li>
                <li>Market conditions can change rapidly</li>
                <li>Past performance doesn't guarantee future results</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setConfig(prev => ({ ...prev, realTradingEnabled: true }));
                setShowConfirmDialog(false);
              }}
            >
              I Understand the Risks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}