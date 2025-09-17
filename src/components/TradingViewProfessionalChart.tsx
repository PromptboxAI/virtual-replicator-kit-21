import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChartDataService, OHLCVData } from '@/services/chartDataService';
import { formatMarketCapUSD, formatPriceUSD } from '@/lib/formatters';
import { 
  Settings, Volume2, RotateCcw
} from 'lucide-react';

interface TradingViewProfessionalChartProps {
  agentId: string;
  agentName?: string;
  agentSymbol?: string;
  agentAvatar?: string;
  viewMode: 'price' | 'marketcap';
  chartType: 'candlestick' | 'line' | 'area';
  promptAmount?: number;
  tradeType?: 'buy' | 'sell';
  onPriceUpdate?: (price: number) => void;
}

export type ChartInterval = '1' | '5' | '15' | '60' | '240' | '1D';

export const TradingViewProfessionalChart = ({ 
  agentId,
  agentName,
  agentSymbol,
  agentAvatar, 
  viewMode,
  chartType,
  onPriceUpdate 
}: TradingViewProfessionalChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState<ChartInterval>('5');
  const [isGraduated, setIsGraduated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);

  const intervals: { value: ChartInterval; label: string }[] = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: '1D', label: '1D' },
  ];

  // Load chart data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const intervalMap: Record<ChartInterval, any> = {
          '1': '1m', '5': '5m', '15': '15m', '60': '1h', '240': '4h', '1D': '1d'
        };
        
        const result = await ChartDataService.getChartData(agentId, intervalMap[interval]);
        setChartData(result.data);
        setIsGraduated(result.isGraduated);
        
        if (result.data.length > 0) {
          const latestPrice = result.data[result.data.length - 1].close;
          setCurrentPrice(viewMode === 'marketcap' ? latestPrice * 1000000000 : latestPrice);
          onPriceUpdate?.(latestPrice);
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      }
      setLoading(false);
    };

    loadData();
  }, [agentId, interval, viewMode, onPriceUpdate]);

  // Real-time updates
  useEffect(() => {
    const unsubscribe = ChartDataService.subscribeToRealTimeUpdates(agentId, (newData: OHLCVData) => {
      setCurrentPrice(viewMode === 'marketcap' ? newData.close * 1000000000 : newData.close);
      onPriceUpdate?.(newData.close);
      
      // Update chart data
      setChartData(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].time === newData.time) {
          updated[lastIndex] = newData;
        } else {
          updated.push(newData);
        }
        return updated.slice(-1000); // Keep last 1000 points
      });
    });

    return unsubscribe;
  }, [agentId, viewMode, onPriceUpdate]);

  const renderSimpleChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No trading data available yet
        </div>
      );
    }

    const maxPrice = Math.max(...chartData.map(d => d.high));
    const minPrice = Math.min(...chartData.map(d => d.low));
    const priceRange = maxPrice - minPrice;

    return (
      <div className="relative w-full h-full p-4">
        <svg className="w-full h-full">
          {/* Price line */}
          <polyline
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            points={chartData.map((d, i) => {
              const x = (i / (chartData.length - 1)) * 100;
              const y = 100 - ((d.close - minPrice) / priceRange) * 80;
              return `${x},${y}`;
            }).join(' ')}
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Volume bars */}
          {showVolume && chartData.map((d, i) => {
            const maxVolume = Math.max(...chartData.map(v => v.volume));
            const x = (i / (chartData.length - 1)) * 100;
            const height = (d.volume / maxVolume) * 15;
            return (
              <rect
                key={i}
                x={`${x}%`}
                y={`${85}%`}
                width="1"
                height={`${height}%`}
                fill="#374151"
                opacity="0.6"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const [showVolume, setShowVolume] = useState(true);

  return (
    <div className="flex h-full bg-background border border-border rounded-lg overflow-hidden">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-border bg-background/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={agentAvatar} />
                <AvatarFallback>
                  {agentSymbol?.substring(1, 3) || agentName?.substring(0, 2) || 'AT'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{agentSymbol || agentName || 'Agent Token'}</h3>
                <Badge variant={isGraduated ? "default" : "secondary"} className="text-xs">
                  {isGraduated ? "DEX Trading" : "Bonding Curve"}
                </Badge>
              </div>
              <div className="text-sm font-mono">
                {currentPrice > 0 && (
                  <span className="text-primary">
                    {viewMode === 'marketcap' 
                      ? formatMarketCapUSD(currentPrice)
                      : formatPriceUSD(currentPrice)
                    }
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-1">
              {intervals.map((int) => (
                <Button
                  key={int.value}
                  variant={interval === int.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setInterval(int.value)}
                  className="text-xs px-3 py-1 h-7"
                >
                  {int.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showVolume ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowVolume(!showVolume)}
                className="text-xs px-3 py-1 h-7"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-xs px-3 py-1 h-7">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="text-muted-foreground">Loading chart data...</div>
            </div>
          )}
          <div ref={chartContainerRef} className="w-full h-full" style={{ minHeight: '400px' }}>
            {renderSimpleChart()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingViewProfessionalChart;