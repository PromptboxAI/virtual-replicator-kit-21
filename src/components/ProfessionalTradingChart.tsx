import React, { useEffect, useState } from 'react';
import { ChartDataService, OHLCVData, PriceImpactData } from '@/services/chartDataService';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const { theme } = useTheme();
  const [interval, setInterval] = useState<ChartInterval>('5m');
  const [isGraduated, setIsGraduated] = useState(false);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [priceImpact, setPriceImpact] = useState<PriceImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  // Load chart data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await ChartDataService.getOHLCVData(agentId, interval);
        setChartData(data);
        
        if (promptAmount > 0) {
          const impact = await ChartDataService.simulatePriceImpact(agentId, promptAmount, tradeType);
          setPriceImpact(impact);
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [agentId, interval, promptAmount, tradeType]);

  const intervals: { value: ChartInterval; label: string }[] = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
  ];

  return (
    <Card className="relative w-full bg-background border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isGraduated ? "default" : "secondary"}>
              {isGraduated ? "DEX Trading" : "Bonding Curve"}
            </Badge>
            {promptAmount > 0 && (
              <Badge variant="outline" className="text-xs">
                Simulating {promptAmount} PROMPT
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {intervals.map((int) => (
              <Button
                key={int.value}
                variant={interval === int.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setInterval(int.value)}
                className="text-xs px-2 py-1"
              >
                {int.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        )}
        <div className="w-full h-[500px] flex items-center justify-center bg-muted/20 rounded-lg">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Candlestick Chart</h3>
            <p className="text-sm text-muted-foreground">
              {chartData.length > 0 ? `${chartData.length} data points loaded` : 'Loading bonding curve trade data...'}
            </p>
            {priceImpact && (
              <div className="text-sm">
                <p>Current: ${priceImpact.currentPrice}</p>
                <p>Impact: {priceImpact.priceImpactPercent}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfessionalTradingChart;