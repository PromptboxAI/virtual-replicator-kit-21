import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType,
  CandlestickSeries,
  HistogramSeries
} from 'lightweight-charts';
import { ChartDataService, OHLCVData } from '@/services/chartDataService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

interface LightweightCandlestickChartProps {
  agentId: string;
  promptAmount?: number;
  tradeType?: 'buy' | 'sell';
  onPriceUpdate?: (price: number) => void;
}

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export const LightweightCandlestickChart = ({ 
  agentId, 
  promptAmount = 0, 
  tradeType = 'buy',
  onPriceUpdate 
}: LightweightCandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  
  const { theme } = useTheme();
  const [interval, setInterval] = useState<ChartInterval>('5m');
  const [isGraduated, setIsGraduated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);

  const intervals: { value: ChartInterval; label: string }[] = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
  ];

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: theme === 'dark' ? '#0a0a0a' : '#ffffff' },
        textColor: theme === 'dark' ? '#d4d4d8' : '#71717a',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#27272a' : '#f4f4f5' },
        horzLines: { color: theme === 'dark' ? '#27272a' : '#f4f4f5' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
        mode: 1, // Logarithmic mode for better V4 price scaling
      },
      crosshair: {
        mode: 1,
      },
    });

    // Add series using the correct v5 API pattern from docs
    const candlestickSeriesInstance = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    // Add volume histogram series  
    const volumeSeriesInstance = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeriesInstance;
    volumeSeriesRef.current = volumeSeriesInstance;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [theme]);

  // Load and update chart data
  useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true);
        const { data, isGraduated: graduated } = await ChartDataService.getChartData(agentId, interval);
        
        setIsGraduated(graduated);
        setChartData(data);

        if (candlestickSeriesRef.current && volumeSeriesRef.current && data.length > 0) {
          // Convert OHLCV data to TradingView format
          const candlestickData = data.map(item => ({
            time: item.time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }));

          const volumeData = data.map(item => ({
            time: item.time,
            value: item.volume,
            color: item.close >= item.open ? '#22c55e4D' : '#ef44444D', // Semi-transparent
          }));

          candlestickSeriesRef.current.setData(candlestickData);
          volumeSeriesRef.current.setData(volumeData);

          // Update price callback with latest close price
          if (onPriceUpdate && data.length > 0) {
            onPriceUpdate(data[data.length - 1].close);
          }

          // Fit content to show all data
          chartRef.current?.timeScale().fitContent();
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [agentId, interval, onPriceUpdate]);

  // Real-time updates subscription
  useEffect(() => {
    let refreshInterval: number;

    const unsubscribe = ChartDataService.subscribeToRealTimeUpdates(agentId, async (newData) => {
      console.log('Received real-time chart update:', newData);
      
      // Refresh chart data to get latest candles
      try {
        const { data } = await ChartDataService.getChartData(agentId, interval);
        setChartData(data);
        
        if (candlestickSeriesRef.current && volumeSeriesRef.current && data.length > 0) {
          const candlestickData = data.map(item => ({
            time: item.time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }));

          const volumeData = data.map(item => ({
            time: item.time,
            value: item.volume,
            color: item.close >= item.open ? '#22c55e4D' : '#ef44444D',
          }));

          candlestickSeriesRef.current.setData(candlestickData);
          volumeSeriesRef.current.setData(volumeData);

          if (onPriceUpdate) {
            onPriceUpdate(data[data.length - 1].close);
          }
        }
      } catch (error) {
        console.error('Failed to refresh chart after trade:', error);
      }
    });

    // Also set up periodic refresh every 10 seconds to catch any missed updates
    refreshInterval = window.setInterval(async () => {
      try {
        const { data } = await ChartDataService.getChartData(agentId, interval);
        if (data.length !== chartData.length) {
          setChartData(data);
          
          if (candlestickSeriesRef.current && volumeSeriesRef.current && data.length > 0) {
            const candlestickData = data.map(item => ({
              time: item.time,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close,
            }));

            const volumeData = data.map(item => ({
              time: item.time,
              value: item.volume,
              color: item.close >= item.open ? '#22c55e4D' : '#ef44444D',
            }));

            candlestickSeriesRef.current.setData(candlestickData);
            volumeSeriesRef.current.setData(volumeData);

            if (onPriceUpdate) {
              onPriceUpdate(data[data.length - 1].close);
            }
          }
        }
      } catch (error) {
        console.error('Periodic chart refresh failed:', error);
      }
    }, 10000);

    return () => {
      unsubscribe();
      window.clearInterval(refreshInterval);
    };
  }, [agentId, onPriceUpdate, interval, chartData.length]);

  return (
    <div className="w-full bg-card border border-border rounded-lg">
      {/* Chart Header */}
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

      {/* Chart Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        )}
        <div 
          ref={chartContainerRef} 
          className="w-full"
          style={{ height: '400px' }}
        />
        {chartData.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-muted-foreground">No Trading Data</h3>
              <p className="text-sm text-muted-foreground">
                {isGraduated ? 'DEX trading data will appear here' : 'Bonding curve trades will appear here'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LightweightCandlestickChart;