import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Coins, Zap, Shield, TrendingUp, Layers, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeFiAssistantConfig {
  name: string;
  description: string;
  protocols: string[];
  strategies: string[];
  yieldTargets: {
    minAPY: number;
    maxRisk: string;
  };
  portfolioRebalancing: boolean;
  liquidityManagement: boolean;
  crossChainEnabled: boolean;
  supportedChains: string[];
  autoCompounding: boolean;
  riskManagement: {
    stopLoss: boolean;
    diversification: boolean;
    impermanentLossProtection: boolean;
  };
}

interface DeFiAssistantBuilderProps {
  onNext: (config: DeFiAssistantConfig) => void;
  onBack: () => void;
}

const DEFI_PROTOCOLS = [
  { id: 'uniswap', name: 'Uniswap', type: 'DEX', description: 'Decentralized exchange and liquidity provision' },
  { id: 'aave', name: 'Aave', type: 'Lending', description: 'Lending and borrowing protocol' },
  { id: 'compound', name: 'Compound', type: 'Lending', description: 'Autonomous interest rate protocol' },
  { id: 'curve', name: 'Curve', type: 'DEX', description: 'Stablecoin and asset exchange' },
  { id: 'yearn', name: 'Yearn Finance', type: 'Yield', description: 'Yield optimization platform' },
  { id: 'convex', name: 'Convex', type: 'Yield', description: 'Curve yield boosting' },
  { id: 'lido', name: 'Lido', type: 'Staking', description: 'Liquid staking solutions' },
  { id: 'makerdao', name: 'MakerDAO', type: 'Lending', description: 'Decentralized stablecoin protocol' }
];

const DEFI_STRATEGIES = [
  { id: 'yield_farming', name: 'Yield Farming', description: 'Optimize rewards across multiple protocols' },
  { id: 'liquidity_provision', name: 'Liquidity Provision', description: 'Provide liquidity for trading fees' },
  { id: 'lending_arbitrage', name: 'Lending Arbitrage', description: 'Exploit rate differences' },
  { id: 'stablecoin_farming', name: 'Stablecoin Farming', description: 'Low-risk stable yield strategies' },
  { id: 'impermanent_loss_hedge', name: 'IL Hedging', description: 'Minimize impermanent loss exposure' },
  { id: 'cross_chain_arbitrage', name: 'Cross-Chain Arbitrage', description: 'Exploit price differences across chains' }
];

const SUPPORTED_CHAINS = [
  'Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche', 'BNB Chain', 'Fantom', 'Base'
];

const RISK_LEVELS = [
  { id: 'conservative', name: 'Conservative', color: 'bg-green-500' },
  { id: 'moderate', name: 'Moderate', color: 'bg-yellow-500' },
  { id: 'aggressive', name: 'Aggressive', color: 'bg-red-500' }
];

export function DeFiAssistantBuilder({ onNext, onBack }: DeFiAssistantBuilderProps) {
  const [config, setConfig] = useState<DeFiAssistantConfig>({
    name: '',
    description: '',
    protocols: [],
    strategies: [],
    yieldTargets: {
      minAPY: 5,
      maxRisk: 'moderate'
    },
    portfolioRebalancing: true,
    liquidityManagement: true,
    crossChainEnabled: false,
    supportedChains: ['Ethereum'],
    autoCompounding: true,
    riskManagement: {
      stopLoss: true,
      diversification: true,
      impermanentLossProtection: false
    }
  });

  const { toast } = useToast();

  const handleNext = () => {
    if (!config.name || !config.description) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields to continue",
        variant: "destructive"
      });
      return;
    }

    if (config.protocols.length === 0) {
      toast({
        title: "Protocol Required",
        description: "Please select at least one DeFi protocol",
        variant: "destructive"
      });
      return;
    }

    if (config.strategies.length === 0) {
      toast({
        title: "Strategy Required",
        description: "Please select at least one DeFi strategy",
        variant: "destructive"
      });
      return;
    }

    onNext(config);
  };

  const toggleProtocol = (protocolId: string) => {
    setConfig(prev => ({
      ...prev,
      protocols: prev.protocols.includes(protocolId)
        ? prev.protocols.filter(p => p !== protocolId)
        : [...prev.protocols, protocolId]
    }));
  };

  const toggleStrategy = (strategyId: string) => {
    setConfig(prev => ({
      ...prev,
      strategies: prev.strategies.includes(strategyId)
        ? prev.strategies.filter(s => s !== strategyId)
        : [...prev.strategies, strategyId]
    }));
  };

  const toggleChain = (chain: string) => {
    setConfig(prev => ({
      ...prev,
      supportedChains: prev.supportedChains.includes(chain)
        ? prev.supportedChains.filter(c => c !== chain)
        : [...prev.supportedChains, chain]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Coins className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold">DeFi Assistant Configuration</h2>
        <p className="text-muted-foreground">Configure your DeFi yield optimization agent</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Assistant Name *</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., DeFi Yield Optimizer"
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your DeFi assistant's purpose and strategy..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* DeFi Protocols */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            DeFi Protocols
          </CardTitle>
          <CardDescription>Select the protocols your assistant will interact with</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFI_PROTOCOLS.map((protocol) => (
              <Card
                key={protocol.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.protocols.includes(protocol.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => toggleProtocol(protocol.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{protocol.name}</h3>
                    <Badge variant="outline">{protocol.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{protocol.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DeFi Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Yield Strategies
          </CardTitle>
          <CardDescription>Choose your assistant's optimization strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFI_STRATEGIES.map((strategy) => (
              <Card
                key={strategy.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  config.strategies.includes(strategy.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => toggleStrategy(strategy.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{strategy.name}</h3>
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Yield Targets & Risk */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Yield Targets & Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minAPY">Minimum Target APY (%)</Label>
              <Input
                id="minAPY"
                type="number"
                value={config.yieldTargets.minAPY}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  yieldTargets: { ...prev.yieldTargets, minAPY: Number(e.target.value) }
                }))}
              />
            </div>
            <div>
              <Label>Maximum Risk Level</Label>
              <div className="flex gap-2 mt-2">
                {RISK_LEVELS.map((level) => (
                  <Badge
                    key={level.id}
                    variant={config.yieldTargets.maxRisk === level.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      yieldTargets: { ...prev.yieldTargets, maxRisk: level.id }
                    }))}
                  >
                    {level.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Stop Loss Protection</Label>
                <p className="text-sm text-muted-foreground">Automatic position closure on losses</p>
              </div>
              <Switch
                checked={config.riskManagement.stopLoss}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  riskManagement: { ...prev.riskManagement, stopLoss: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Portfolio Diversification</Label>
                <p className="text-sm text-muted-foreground">Spread risk across multiple protocols</p>
              </div>
              <Switch
                checked={config.riskManagement.diversification}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  riskManagement: { ...prev.riskManagement, diversification: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Impermanent Loss Protection</Label>
                <p className="text-sm text-muted-foreground">Hedge against IL in liquidity pools</p>
              </div>
              <Switch
                checked={config.riskManagement.impermanentLossProtection}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  riskManagement: { ...prev.riskManagement, impermanentLossProtection: checked }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automation Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Compounding</Label>
              <p className="text-sm text-muted-foreground">Automatically reinvest earned rewards</p>
            </div>
            <Switch
              checked={config.autoCompounding}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoCompounding: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Portfolio Rebalancing</Label>
              <p className="text-sm text-muted-foreground">Maintain optimal asset allocation</p>
            </div>
            <Switch
              checked={config.portfolioRebalancing}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, portfolioRebalancing: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Liquidity Management</Label>
              <p className="text-sm text-muted-foreground">Optimize liquidity provision</p>
            </div>
            <Switch
              checked={config.liquidityManagement}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, liquidityManagement: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Cross-Chain Operations</Label>
              <p className="text-sm text-muted-foreground">Execute strategies across multiple chains</p>
            </div>
            <Switch
              checked={config.crossChainEnabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, crossChainEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Supported Chains */}
      {config.crossChainEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Supported Blockchains</CardTitle>
            <CardDescription>Select which chains your assistant can operate on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_CHAINS.map((chain) => (
                <Badge
                  key={chain}
                  variant={config.supportedChains.includes(chain) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleChain(chain)}
                >
                  {chain}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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