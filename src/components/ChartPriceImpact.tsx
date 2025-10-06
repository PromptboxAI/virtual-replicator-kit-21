import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PriceImpactData } from '@/lib/chartPriceImpact';
import { formatPriceUSD, formatMarketCapUSD } from '@/lib/formatters';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ChartPriceImpactProps {
  impactData: PriceImpactData | null;
  viewMode: 'price' | 'marketcap';
  tradeType: 'buy' | 'sell';
  promptAmount: number;
  visible: boolean;
  fxRate: number; // Required - no default
}

export const ChartPriceImpact: React.FC<ChartPriceImpactProps> = ({
  impactData,
  viewMode,
  tradeType,
  promptAmount,
  visible,
  fxRate
}) => {
  if (!visible || !impactData || promptAmount <= 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return viewMode === 'marketcap' 
      ? formatMarketCapUSD(price * 1000000000)
      : formatPriceUSD(price, fxRate);
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(2)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(2)}K`;
    }
    return tokens.toFixed(2);
  };

  const getImpactColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getImpactIcon = () => {
    switch (impactData.slippageLevel) {
      case 'low': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'high': return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const getSlippageLabel = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'Low Impact';
      case 'medium': return 'Medium Impact';
      case 'high': return 'High Impact';
    }
  };

  return (
    <Card className="absolute top-16 right-4 p-4 bg-background/95 backdrop-blur-sm border shadow-lg z-10 min-w-[280px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Price Impact Preview</h3>
          <Badge 
            variant={impactData.slippageLevel === 'low' ? 'default' : 'destructive'}
            className="flex items-center gap-1"
          >
            {getImpactIcon()}
            {getSlippageLabel(impactData.slippageLevel)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Current {viewMode === 'price' ? 'Price' : 'Market Cap'}</div>
            <div className="font-mono font-medium">
              {formatPrice(impactData.currentPrice)}
            </div>
          </div>
          
          <div>
            <div className="text-muted-foreground">After {tradeType === 'buy' ? 'Buy' : 'Sell'}</div>
            <div className={`font-mono font-medium ${getImpactColor(impactData.slippageLevel)}`}>
              {formatPrice(impactData.impactPrice)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Price Impact</div>
            <div className={`font-bold ${getImpactColor(impactData.slippageLevel)}`}>
              {impactData.priceImpact > 0 ? '+' : ''}{impactData.priceImpact.toFixed(3)}%
            </div>
          </div>
          
          <div>
            <div className="text-muted-foreground">Est. Tokens</div>
            <div className="font-mono font-medium">
              {formatTokens(impactData.estimatedTokens)}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span>Trade Amount:</span>
            <span className="font-mono">{promptAmount} PROMPT</span>
          </div>
        </div>

        {impactData.slippageLevel === 'high' && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium">High slippage warning</span>
            </div>
            <div className="mt-1">
              Consider reducing trade size to minimize price impact.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};