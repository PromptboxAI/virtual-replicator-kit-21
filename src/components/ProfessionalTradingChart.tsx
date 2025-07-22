
import React, { useEffect, useState } from 'react';
import { ChartDataService, OHLCVData, PriceImpactData } from '@/services/chartDataService';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LightweightCandlestickChart } from './LightweightCandlestickChart';

interface ProfessionalTradingChartProps {
  agentId: string;
  promptAmount?: number;
  tradeType?: 'buy' | 'sell';
  onPriceUpdate?: (price: number) => void;
}

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export const ProfessionalTradingChart = ({ 
  agentId, 
  promptAmount = 0, 
  tradeType = 'buy',
  onPriceUpdate 
}: ProfessionalTradingChartProps) => {
  const [priceImpact, setPriceImpact] = useState<PriceImpactData | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="space-y-4">
      <LightweightCandlestickChart
        agentId={agentId}
        promptAmount={promptAmount}
        tradeType={tradeType}
        onPriceUpdate={onPriceUpdate}
      />
      
      {/* Price Impact Display */}
      {priceImpact && (
        <Card className="p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Price Impact Simulation</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current Price:</span>
                <span className="ml-2 font-mono">${priceImpact.currentPrice.toFixed(8)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Impact Price:</span>
                <span className="ml-2 font-mono">${priceImpact.impactPrice.toFixed(8)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Price Impact:</span>
                <span className={`ml-2 font-mono ${
                  Math.abs(priceImpact.priceImpactPercent) > 5 ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  {priceImpact.priceImpactPercent.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Tokens:</span>
                <span className="ml-2 font-mono">{priceImpact.estimatedTokens.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProfessionalTradingChart;
