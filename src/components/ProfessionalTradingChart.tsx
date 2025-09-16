import React, { useEffect, useState } from 'react';
import { ChartDataService, OHLCVData, PriceImpactData } from '@/services/chartDataService';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TradingViewProfessionalChart } from './TradingViewProfessionalChart';
import { formatPriceUSD, formatMarketCapUSD } from '@/lib/formatters';

interface ProfessionalTradingChartProps {
  agentId: string;
  agentName?: string;
  agentSymbol?: string;
  agentAvatar?: string;
  promptAmount?: number;
  tradeType?: 'buy' | 'sell';
  onPriceUpdate?: (price: number) => void;
}

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type ChartViewMode = 'price' | 'marketcap';
export type ChartType = 'candlestick' | 'line' | 'area';

export const ProfessionalTradingChart = ({ 
  agentId,
  agentName,
  agentSymbol,
  agentAvatar,
  promptAmount = 0, 
  tradeType = 'buy',
  onPriceUpdate 
}: ProfessionalTradingChartProps) => {
  const [priceImpact, setPriceImpact] = useState<PriceImpactData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ChartViewMode>('price');
  const [chartType, setChartType] = useState<ChartType>('candlestick');

  // Load price impact simulation when prompt amount changes
  useEffect(() => {
    const loadPriceImpact = async () => {
      if (promptAmount <= 0) {
        setPriceImpact(null);
        return;
      }

      try {
        setLoading(true);
        const impact = await ChartDataService.simulatePriceImpact(agentId, promptAmount, tradeType);
        setPriceImpact(impact);
      } catch (error) {
        console.error('Failed to load price impact:', error);
        setPriceImpact(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadPriceImpact();
  }, [agentId, promptAmount, tradeType]);

  return (
    <div className="h-[600px]">
        {/* Chart Controls */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* Price/MCAP Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'price' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('price')}
                  className="rounded-r-none border-r"
                >
                  Price
                </Button>
                <Button
                  variant={viewMode === 'marketcap' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('marketcap')}
                  className="rounded-l-none"
                >
                  MCAP
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Chart Type Controls */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={chartType === 'candlestick' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('candlestick')}
                  className="rounded-r-none border-r"
                >
                  Candles
                </Button>
                <Button
                  variant={chartType === 'line' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className="rounded-none border-r"
                >
                  Line
                </Button>
                <Button
                  variant={chartType === 'area' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('area')}
                  className="rounded-l-none"
                >
                  Area
                </Button>
              </div>
            </div>
          </div>
        </Card>

      {/* Professional TradingView Chart Component */}
      <div className="h-[520px]">
          <TradingViewProfessionalChart
            agentId={agentId}
            agentName={agentName}
            agentSymbol={agentSymbol}
            agentAvatar={agentAvatar}
            viewMode={viewMode}
            chartType={chartType}
            promptAmount={promptAmount}
            tradeType={tradeType}
            onPriceUpdate={onPriceUpdate}
          />
      </div>
      
      {/* Price Impact Display - Only show for buy/sell simulation */}
      {priceImpact && promptAmount > 0 && (
        <Card className="p-4 mt-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              Trade Impact Simulation
              <Badge variant="outline" className="text-xs">
                {promptAmount} PROMPT {tradeType}
              </Badge>
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-sm text-muted-foreground">Current Price</div>
                <div className="text-lg font-semibold">{formatPriceUSD(priceImpact.currentPrice)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Impact Price</div>
                <div className="text-lg font-semibold">{formatPriceUSD(priceImpact.impactPrice)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Price Impact:</span>
                <span className={`ml-2 font-mono ${
                  Math.abs(priceImpact.priceImpactPercent) > 5 ? 'text-red-500' : 
                  Math.abs(priceImpact.priceImpactPercent) > 2 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {priceImpact.priceImpactPercent > 0 ? '+' : ''}{priceImpact.priceImpactPercent.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Tokens:</span>
                <span className="ml-2 font-mono">{priceImpact.estimatedTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProfessionalTradingChart;