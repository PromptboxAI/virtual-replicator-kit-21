import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, DollarSign, Shield, AlertTriangle, Zap, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TradingBotConfig {
  name: string;
  description: string;
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

interface TradingBotBuilderProps {
  onNext: (config: TradingBotConfig) => void;
  onBack: () => void;
}

const TRADING_STRATEGIES = [
  { id: 'dca', name: 'Dollar Cost Averaging', description: 'Regular purchases regardless of market conditions' },
  { id: 'momentum', name: 'Momentum Trading', description: 'Follow trends and market momentum' },
  { id: 'arbitrage', name: 'Arbitrage', description: 'Exploit price differences across exchanges' },
  { id: 'mean_reversion', name: 'Mean Reversion', description: 'Buy low, sell high based on historical averages' },
  { id: 'grid', name: 'Grid Trading', description: 'Place buy/sell orders at regular intervals' },
  { id: 'scalping', name: 'Scalping', description: 'Quick trades for small profits' }
];

const RISK_LEVELS = [
  { id: 'conservative', name: 'Conservative', color: 'bg-green-500', description: 'Low risk, stable returns' },
  { id: 'moderate', name: 'Moderate', color: 'bg-yellow-500', description: 'Balanced risk/reward' },
  { id: 'aggressive', name: 'Aggressive', color: 'bg-red-500', description: 'High risk, high potential returns' }
];

const EXCHANGES = [
  'Coinbase Pro', 'Binance', 'Kraken', 'Uniswap', 'Curve', 'SushiSwap', '1inch', 'dYdX'
];

const TRADING_PAIRS = [
  'ETH/USD', 'BTC/USD', 'ETH/BTC', 'USDC/ETH', 'DAI/USDC', 'WBTC/ETH'
];

export function TradingBotBuilder({ onNext, onBack }: TradingBotBuilderProps) {
  const [config, setConfig] = useState<TradingBotConfig>({
    name: '',
    description: '',
    tradingStrategy: '',
    riskLevel: 'moderate',
    maxPositionSize: 1000,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    tradingPairs: [],
    exchanges: [],
    backtestingEnabled: true,
    paperTradingEnabled: true,
    realTradingEnabled: false,
    maxDailyTrades: 10,
    portfolioAllocation: 20
  });

  const { toast } = useToast();

  const handleNext = () => {
    if (!config.name || !config.description || !config.tradingStrategy) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields to continue",
        variant: "destructive"
      });
      return;
    }

    if (config.exchanges.length === 0) {
      toast({
        title: "Exchange Required",
        description: "Please select at least one exchange for trading",
        variant: "destructive"
      });
      return;
    }

    onNext(config);
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">Trading Bot Configuration</h2>
        <p className="text-muted-foreground">Configure your autonomous trading agent</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Bot Name *</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Alpha Trading Bot"
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your trading bot's purpose and strategy..."
              rows={3}
            />
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
            <Label>Select Exchanges *</Label>
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
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, realTradingEnabled: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue to API Setup
        </Button>
      </div>
    </div>
  );
}