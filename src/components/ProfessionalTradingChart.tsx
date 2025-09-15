import React, { useEffect, useState } from 'react';
import { ChartDataService, OHLCVData, PriceImpactData } from '@/services/chartDataService';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdvancedTradingChart } from './AdvancedTradingChart';

interface ProfessionalTradingChartProps {
  agentId: string;
  promptAmount?: number;
  tradeType?: 'buy' | 'sell';
  onPriceUpdate?: (price: number) => void;
}

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type ChartViewMode = 'price' | 'marketcap';
export type ChartType = 'candlestick' | 'line' | 'area';

export const ProfessionalTradingChart = ({ 
  agentId, 
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
      <Card className="p-3 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'price' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('price')}
                className="text-xs h-7"
              >
                Price / MCAP
              </Button>
            </div>
            <div className="h-4 w-px bg-border mx-2" />
            <div className="flex items-center gap-1">
              <Button
                variant={chartType === 'candlestick' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('candlestick')}
                className="text-xs h-7"
              >
                📊
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                className="text-xs h-7"
              >
                📈
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('area')}
                className="text-xs h-7"
              >
                🔺
              </Button>
            </div>
            <div className="h-4 w-px bg-border mx-2" />
            <Button
              variant={viewMode === 'price' ? 'outline' : 'default'}
              size="sm"
              onClick={() => setViewMode(viewMode === 'price' ? 'marketcap' : 'price')}
              className="text-xs h-7"
            >
              {viewMode === 'price' ? 'Show MCAP' : 'Show Price'}
            </Button>
          </div>
          
          <Badge variant="outline" className="text-xs">
            {viewMode === 'price' ? 'PROMPT per Token' : 'Total Market Cap USD'}
          </Badge>
        </div>
      </Card>

      {/* Advanced Chart Component */}
      <div className="h-[520px]">
        <AdvancedTradingChart
          agentId={agentId}
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
                <span className="text-muted-foreground">Current Price:</span>
                <span className="ml-2 font-mono">{priceImpact.currentPrice.toFixed(8)} PROMPT</span>
              </div>
              <div>
                <span className="text-muted-foreground">Impact Price:</span>
                <span className="ml-2 font-mono">{priceImpact.impactPrice.toFixed(8)} PROMPT</span>
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