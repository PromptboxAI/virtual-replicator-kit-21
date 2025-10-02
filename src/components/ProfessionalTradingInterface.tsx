import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Copy } from 'lucide-react';
import { ProfessionalTradingChart } from './ProfessionalTradingChart';
import { TokenTradingInterface } from './TokenTradingInterface';
import { TradingModeGuard } from './TradingModeGuard';
import { useAgentRealtime } from '@/hooks/useAgentRealtime';
import { formatPromptAmountV3, formatPriceV3, formatTokenAmountV3 } from '@/lib/bondingCurveV3';
import { formatPriceUSD, formatMarketCapUSD } from '@/lib/formatters';
import { useAgentFDV } from '@/hooks/useAgentFDV';
import { AgentInformationSections } from './AgentInformationSections';
import { useToast } from '@/hooks/use-toast';
import { AgentMigrationStatus } from './AgentMigrationStatus';
import { MigrationBanner } from './MigrationBanner';
import { useMigrationPolling } from '@/hooks/useMigrationPolling';

interface Agent {
  id: string;
  name: string;
  symbol: string;
  avatar_url?: string;
  current_price: number;
  prompt_raised: number;
  token_holders: number;
  volume_24h: number;
  market_cap: number;
  created_at: string;
  token_graduated: boolean;
  graduation_threshold: number;
  token_address?: string;
}

interface ProfessionalTradingInterfaceProps {
  agent: Agent;
  onTradeComplete?: () => void;
}

export const ProfessionalTradingInterface = ({ 
  agent, 
  onTradeComplete 
}: ProfessionalTradingInterfaceProps) => {
  const [promptAmount, setPromptAmount] = useState<number>(0);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const { toast } = useToast();
  const marketCap = useAgentFDV(agent.id);

  const { isGraduated, agentData, isMigrating, checkMigration } = useAgentRealtime(agent.id, {
    id: agent.id,
    prompt_raised: agent.prompt_raised,
    current_price: agent.current_price,
    market_cap: agent.market_cap,
    token_holders: agent.token_holders,
    volume_24h: agent.volume_24h,
    token_address: null
  });

  // Use real-time price if available, otherwise fall back to agent prop
  const currentPrice = agentData?.current_price ?? agent.current_price;

  const handlePriceUpdate = useCallback((price: number) => {
    // Price updates are now handled via real-time data
    console.log('Price update received:', price);
  }, []);

  const handleCopyAddress = useCallback(() => {
    if (agent.token_address) {
      navigator.clipboard.writeText(agent.token_address);
      toast({
        title: "Address copied!",
        duration: 2000,
      });
    }
  }, [agent.token_address, toast]);

  const truncateAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const progressPercentage = Math.min((agent.prompt_raised / agent.graduation_threshold) * 100, 100);
  const liquidityPool = agent.prompt_raised * 0.8; // 80% goes to liquidity
  const topHolders = Math.min(agent.token_holders * 0.1, 10); // Estimate top 10 holders percentage
  
  // USD conversion for display (1 PROMPT = $0.10)
  const PROMPT_USD_RATE = 0.10;
  const promptRaisedUSD = agent.prompt_raised * PROMPT_USD_RATE;
  const graduationThresholdUSD = agent.graduation_threshold * PROMPT_USD_RATE;

  return (
    <div className="w-full space-y-6">
      {/* Migration Banner - Show when agent is graduating */}
      {isMigrating && (
        <MigrationBanner 
          agentName={agent.name}
          onComplete={() => {
            checkMigration(agent.prompt_raised, agent.token_address);
            window.location.reload();
          }}
        />
      )}

      {/* Migration Status - Show for non-V3 agents */}
      <AgentMigrationStatus 
        agentId={agent.id}
        agentName={agent.name}
      />

      {/* Token Header */}
      <Card className="p-6 bg-gradient-to-r from-background to-background/95 border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={agent.avatar_url} alt={agent.name} />
              <AvatarFallback className="text-lg font-bold">
                {agent.symbol.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
                <Badge variant="outline" className="text-sm">
                  ${agent.symbol}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>Created {formatDistanceToNow(new Date(agent.created_at))} ago</span>
                <span>•</span>
                <span>{agent.token_holders} holders</span>
              </div>
              {agent.token_address && (
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{truncateAddress(agent.token_address)}</span>
                  <button
                    onClick={handleCopyAddress}
                    className="inline-flex items-center justify-center hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
                    aria-label="Copy token address"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-foreground">
              {formatPriceV3(currentPrice)}
            </div>
            <div className="text-sm text-muted-foreground">
              PROMPT per token
            </div>
          </div>
        </div>
      </Card>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area with Graduation Progress - 70% width on desktop */}
        <div className="lg:col-span-2 space-y-6">
          <ProfessionalTradingChart
            agentId={agent.id}
            agentName={agent.name}
            agentSymbol={agent.symbol}
            agentAvatar={agent.avatar_url}
            promptAmount={promptAmount}
            tradeType={tradeType}
            onPriceUpdate={handlePriceUpdate}
            agentMarketCap={marketCap}
          />
          
          {/* Graduation Progress under chart */}
          {!isGraduated && (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">Ascension Progress</h3>
                  <Badge variant="secondary">
                    {progressPercentage.toFixed(1)}% Complete
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>${promptRaisedUSD.toFixed(2)} raised</span>
                  <span>${graduationThresholdUSD.toFixed(2)} needed</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Trading Panel - 30% width on desktop */}
        <div className="lg:col-span-1">
          <TradingModeGuard 
            tokenAddress={agent.token_graduated ? "mock-address" : undefined}
            tokenGraduated={agent.token_graduated}
          >
            <TokenTradingInterface
              agent={agent}
              onTradeComplete={onTradeComplete}
            />
          </TradingModeGuard>
        </div>
      </div>

      {/* Metrics Footer */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {!isGraduated ? (
          // Pre-graduated token metrics
          <>
            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">
                {formatMarketCapUSD(marketCap)}
              </div>
              <div className="text-sm text-muted-foreground">
                {isGraduated ? 'FDV' : 'Market Cap'}
              </div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">
                ${((agent.prompt_raised * 30) / 1000).toFixed(2)}k
              </div>
              <div className="text-sm text-muted-foreground">Liquidity</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">
                {agent.token_holders}
              </div>
              <div className="text-sm text-muted-foreground">Holders</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">
                ${agent.volume_24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">24h Vol</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">
                0%
              </div>
              <div className="text-sm text-muted-foreground">Top 10</div>
            </Card>
          </>
        ) : (
          // Post-graduated DEX token metrics
          <>
            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">
                {formatMarketCapUSD(marketCap)}
              </div>
              <div className="text-sm text-muted-foreground">
                FDV
              </div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">
                ${(liquidityPool * 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">DEX Liquidity</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">
                {agent.token_holders}
              </div>
              <div className="text-sm text-muted-foreground">Holders</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">
                ${agent.volume_24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">24h Volume</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-lg font-bold text-foreground">
                {topHolders.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Top 10 Hold</div>
            </Card>
          </>
        )}
      </div>

      {/* Agent Information Sections */}
      <AgentInformationSections agent={agent} />
    </div>
  );
};

export default ProfessionalTradingInterface;