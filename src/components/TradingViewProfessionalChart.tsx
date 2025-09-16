import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChartDataService, OHLCVData } from '@/services/chartDataService';
import { formatMarketCapUSD, formatPriceUSD } from '@/lib/formatters';
import { 
  Settings, Volume2, TrendingUp, RotateCcw, Maximize2,
  PenTool, Minus, Square, Triangle, Type, Target
} from 'lucide-react';

// TradingView Widget TypeScript declarations
declare global {
  interface Window {
    TradingView: {
      widget: new (config: any) => any;
    };
  }
}

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

// TradingView Datafeed Implementation
class CustomDatafeed {
  private agentId: string;
  private lastBar: any = null;
  private subscribers: any = {};

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  onReady(callback: any) {
    setTimeout(() => {
      callback({
        supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
        supports_marks: true,
        supports_timescale_marks: true,
        supports_time: true,
        exchanges: [
          {
            value: 'AGENT',
            name: 'Agent Platform',
            desc: 'Agent Trading Platform',
          },
        ],
        symbols_types: [
          {
            name: 'crypto',
            value: 'crypto',
          },
        ],
      });
    }, 0);
  }

  searchSymbols(userInput: string, exchange: string, symbolType: string, onResult: any) {
    // Return empty for search - we only show our agent token
    onResult([]);
  }

  resolveSymbol(symbolName: string, onResolve: any, onError: any) {
    const symbolInfo = {
      name: symbolName,
      ticker: symbolName,
      description: `${symbolName} Token`,
      type: 'crypto',
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: 'AGENT',
      minmov: 1,
      pricescale: 100000000,
      has_intraday: true,
      has_weekly_and_monthly: false,
      supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
      volume_precision: 2,
      data_status: 'streaming',
    };

    setTimeout(() => onResolve(symbolInfo), 0);
  }

  async getBars(symbolInfo: any, resolution: string, periodParams: any, onResult: any, onError: any) {
    try {
      console.log('Getting bars for:', symbolInfo.name, 'resolution:', resolution);
      
      // Map resolution to our interval format
      const intervalMap: Record<string, string> = {
        '1': '1m',
        '5': '5m', 
        '15': '15m',
        '60': '1h',
        '240': '4h',
        '1D': '1d'
      };

      const interval = intervalMap[resolution] || '5m';
      const { data } = await ChartDataService.getChartData(this.agentId, interval as any);
      
      if (data.length === 0) {
        onResult([], { noData: true });
        return;
      }

      const bars = data.map((item: OHLCVData) => ({
        time: item.time * 1000, // TradingView expects milliseconds
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));

      this.lastBar = bars[bars.length - 1];
      onResult(bars, { noData: false });
    } catch (error) {
      console.error('Error getting bars:', error);
      onError(error);
    }
  }

  subscribeBars(symbolInfo: any, resolution: string, onRealtimeCallback: any, subscriberUID: string, onResetCacheNeededCallback: any) {
    console.log('Subscribing to bars:', symbolInfo.name);
    this.subscribers[subscriberUID] = onRealtimeCallback;

    // Set up real-time updates
    const unsubscribe = ChartDataService.subscribeToRealTimeUpdates(this.agentId, (newData: OHLCVData) => {
      const bar = {
        time: newData.time * 1000,
        open: newData.open,
        high: newData.high,
        low: newData.low,
        close: newData.close,
        volume: newData.volume,
      };

      if (this.lastBar && bar.time === this.lastBar.time) {
        // Update existing bar
        onRealtimeCallback(bar);
      } else {
        // New bar
        onRealtimeCallback(bar);
      }
      
      this.lastBar = bar;
    });

    // Store unsubscribe function for cleanup
    this.subscribers[`${subscriberUID}_unsubscribe`] = unsubscribe;
  }

  unsubscribeBars(subscriberUID: string) {
    console.log('Unsubscribing from bars:', subscriberUID);
    delete this.subscribers[subscriberUID];
    
    // Call unsubscribe function if it exists
    const unsubscribeFn = this.subscribers[`${subscriberUID}_unsubscribe`];
    if (unsubscribeFn) {
      unsubscribeFn();
      delete this.subscribers[`${subscriberUID}_unsubscribe`];
    }
  }
}

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
  const tvWidgetRef = useRef<any>(null);
  const datafeedRef = useRef<CustomDatafeed | null>(null);
  
  const [interval, setInterval] = useState<ChartInterval>('5');
  const [isGraduated, setIsGraduated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [showVolume, setShowVolume] = useState(true);

  const intervals: { value: ChartInterval; label: string }[] = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: '1D', label: '1D' },
  ];

  // Initialize TradingView widget
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: agentSymbol || `CRYPTO:${agentId.slice(0, 8)}USD`,
      interval: interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(0, 0, 0, 0)",
      gridColor: "rgba(255, 255, 255, 0.06)",
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com"
    });

    if (chartContainerRef.current) {
      chartContainerRef.current.appendChild(script);
    }

    setLoading(false);


    return () => {
      // Cleanup script if needed
      if (chartContainerRef.current) {
        const scripts = chartContainerRef.current.getElementsByTagName('script');
        for (let i = scripts.length - 1; i >= 0; i--) {
          scripts[i].remove();
        }
      }
    };
  }, [agentId, agentSymbol, interval]);

  // Load initial data and set up real-time updates
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data, isGraduated: graduated } = await ChartDataService.getChartData(agentId, '5m');
        setIsGraduated(graduated);
        
        if (data.length > 0) {
          const latestPrice = data[data.length - 1].close;
          setCurrentPrice(latestPrice);
          if (onPriceUpdate) {
            onPriceUpdate(latestPrice);
          }
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();

    // Set up real-time price updates
    const unsubscribe = ChartDataService.subscribeToRealTimeUpdates(agentId, (newData: OHLCVData) => {
      setCurrentPrice(newData.close);
      if (onPriceUpdate) {
        onPriceUpdate(newData.close);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [agentId, onPriceUpdate]);

  const handleFullscreen = () => {
    if (tvWidgetRef.current) {
      tvWidgetRef.current.chart().executeActionById('chartProperties');
    }
  };

  const handleReset = () => {
    if (tvWidgetRef.current && tvWidgetRef.current.chart) {
      tvWidgetRef.current.chart().executeActionById('timeScaleReset');
    }
  };

  return (
    <div className="flex h-full bg-background border border-border rounded-lg overflow-hidden">
      {/* Professional Chart Container */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="p-3 border-b border-border bg-background/80">
          <div className="flex items-center justify-between">
            {/* Agent Info and Current Price */}
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
                      ? formatMarketCapUSD(currentPrice * 100000000)
                      : formatPriceUSD(currentPrice)
                    }
                  </span>
                )}
              </div>
            </div>

            {/* Time Intervals */}
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

            {/* Chart Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs px-3 py-1 h-7"
                title="Reset Chart"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="text-xs px-3 py-1 h-7"
                title="Chart Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* TradingView Chart Container */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="text-muted-foreground">Loading professional chart...</div>
            </div>
          )}
          <div 
            ref={chartContainerRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default TradingViewProfessionalChart;