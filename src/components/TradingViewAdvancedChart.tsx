import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { ChartDataService, OHLCVData } from '@/services/chartDataService';
import { formatMarketCapUSD, formatPriceUSD } from '@/lib/formatters';

interface TradingViewAdvancedChartProps {
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

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export const TradingViewAdvancedChart = ({ 
  agentId,
  agentName,
  agentSymbol,
  agentAvatar, 
  viewMode,
  chartType,
  promptAmount = 0, 
  tradeType = 'buy',
  onPriceUpdate 
}: TradingViewAdvancedChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  
  const { theme } = useTheme();
  const [interval, setInterval] = useState<ChartInterval>('5m');
  const [isGraduated, setIsGraduated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  const intervals: { value: ChartInterval; label: string }[] = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
  ];

  // Load chart data and set up real-time updates
  useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true);
        const { data, isGraduated: graduated } = await ChartDataService.getChartData(agentId, interval);
        
        setIsGraduated(graduated);
        setChartData(data);

        if (data.length > 0) {
          const latestPrice = data[data.length - 1].close;
          setCurrentPrice(latestPrice);
          if (onPriceUpdate) {
            onPriceUpdate(latestPrice);
          }
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();

    // Set up real-time updates
    const unsubscribe = ChartDataService.subscribeToRealTimeUpdates(agentId, (newData: OHLCVData) => {
      setCurrentPrice(newData.close);
      if (onPriceUpdate) {
        onPriceUpdate(newData.close);
      }
      
      // Update chart data
      setChartData(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].time === newData.time) {
          updated[lastIndex] = newData;
        } else {
          updated.push(newData);
        }
        return updated.slice(-1000); // Keep last 1000 data points
      });
    });

    return () => {
      unsubscribe();
    };
  }, [agentId, interval, onPriceUpdate]);

  // Create TradingView widget for professional appearance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous widget
    if (widgetRef.current) {
      chartContainerRef.current.innerHTML = '';
    }

    const symbolName = agentSymbol?.replace('$', '') || agentName || 'AGENT';
    
    // Create TradingView widget container
    const container = document.createElement('div');
    container.id = `tradingview_${Date.now()}`;
    container.style.height = '100%';
    container.style.width = '100%';
    chartContainerRef.current.appendChild(container);

    // Load TradingView script and create widget
    if (!(window as any).TradingView) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: `CRYPTO:${symbolName}USD`,
        interval: interval === '1m' ? '1' : interval === '5m' ? '5' : interval === '15m' ? '15' : interval === '1h' ? '60' : interval === '4h' ? '240' : 'D',
        timezone: 'Etc/UTC',
        theme: theme === 'dark' ? 'dark' : 'light',
        style: chartType === 'candlestick' ? '1' : chartType === 'line' ? '2' : '3',
        locale: 'en',
        toolbar_bg: theme === 'dark' ? '#1e293b' : '#ffffff',
        enable_publishing: false,
        allow_symbol_change: false,
        save_image: false,
        studies: ['Volume@tv-basicstudies'],
        show_popup_button: false,
        popup_width: '1000',
        popup_height: '650',
        container_id: container.id,
        hide_top_toolbar: true,
        hide_legend: false,
        withdateranges: true,
        range: '1D',
        hide_side_toolbar: false,
        details: false,
        hotlist: false,
        calendar: false,
        studies_overrides: {},
        overrides: {
          'paneProperties.background': theme === 'dark' ? '#0f172a' : '#ffffff',
          'paneProperties.vertGridProperties.color': theme === 'dark' ? '#334155' : '#e2e8f0',
          'paneProperties.horzGridProperties.color': theme === 'dark' ? '#334155' : '#e2e8f0',
          'symbolWatermarkProperties.transparency': 90,
          'scalesProperties.textColor': theme === 'dark' ? '#cbd5e1' : '#475569',
          'mainSeriesProperties.candleStyle.upColor': '#22c55e',
          'mainSeriesProperties.candleStyle.downColor': '#ef4444',
          'mainSeriesProperties.candleStyle.drawWick': true,
          'mainSeriesProperties.candleStyle.drawBorder': true,
          'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
          'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
        }
      });
      container.appendChild(script);
      widgetRef.current = container;
    }

    return () => {
      if (chartContainerRef.current && widgetRef.current) {
        try {
          chartContainerRef.current.removeChild(widgetRef.current);
        } catch (e) {
          // Ignore removal errors
        }
      }
    };
  }, [theme, interval, chartType, agentSymbol, agentName]);

  return (
    <div className="flex h-full bg-background border border-border rounded-lg overflow-hidden">
      {/* Main Chart Area */}
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
                  <span className={currentPrice >= (chartData[chartData.length - 2]?.close || 0) ? "text-green-500" : "text-red-500"}>
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
          </div>
        </div>

        {/* TradingView Chart Container */}
        <div className="flex-1 relative bg-background">
          {loading && (
            <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-20">
              <div className="text-muted-foreground">Loading professional chart...</div>
            </div>
          )}
          <div 
            ref={chartContainerRef} 
            className="w-full h-full"
          />
          {chartData.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-muted-foreground">No Trading Data</h3>
                <p className="text-sm text-muted-foreground">
                  {isGraduated ? 'DEX trading data will appear here' : 'Bonding curve trades will appear here'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {viewMode === 'marketcap' 
                    ? 'Market cap progression toward $75,000 graduation' 
                    : 'Price per token changes with each trade'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingViewAdvancedChart;

// Add TradingView types to window
declare global {
  interface Window {
    TradingView: any;
  }
}