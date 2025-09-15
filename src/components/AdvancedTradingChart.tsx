import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  AreaSeries,
  CrosshairMode,
  LineStyle,
  PriceScaleMode
} from 'lightweight-charts';
import { ChartDataService, OHLCVData } from '@/services/chartDataService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { 
  Pencil, Trash2, ZoomIn, ZoomOut, TrendingUp, Minus, Square, Circle, 
  Type, Magnet, Triangle, ArrowUp, ArrowDown, RotateCcw, Move, Ruler
} from 'lucide-react';
import { formatMarketCapUSD, formatPriceUSD, PROMPT_USD_RATE } from '@/lib/formatters';

interface AdvancedTradingChartProps {
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
export type DrawingTool = 'none' | 'trendline' | 'horizontal' | 'ruler' | 'fib-retracement' | 'fib-extension' | 'fib-fan' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'brush' | 'eraser' | 'magnet';

export const AdvancedTradingChart = ({ 
  agentId,
  agentName,
  agentSymbol,
  agentAvatar, 
  viewMode,
  chartType,
  promptAmount = 0, 
  tradeType = 'buy',
  onPriceUpdate 
}: AdvancedTradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const mainSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  
  const { theme } = useTheme();
  const [interval, setInterval] = useState<ChartInterval>('5m');
  const [isGraduated, setIsGraduated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const [showVolume, setShowVolume] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  const intervals: { value: ChartInterval; label: string }[] = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
  ];

  const drawingTools = [
    { value: 'none' as DrawingTool, label: 'Select', icon: Move, group: 'navigation' },
    { value: 'trendline' as DrawingTool, label: 'Trend Line', icon: TrendingUp, group: 'lines' },
    { value: 'horizontal' as DrawingTool, label: 'Horizontal Line', icon: Minus, group: 'lines' },
    { value: 'ruler' as DrawingTool, label: 'Vertical Line', icon: Ruler, group: 'lines' },
  ];

  const fibonacciTools = [
    { name: 'fib-retracement', icon: ArrowUp, label: 'Fibonacci Retracement' },
    { name: 'fib-extension', icon: ArrowDown, label: 'Fibonacci Extension' },
    { name: 'fib-fan', icon: Triangle, label: 'Fibonacci Fan' },
  ];

  const shapeTools = [
    { name: 'rectangle', icon: Square, label: 'Rectangle' },
    { name: 'circle', icon: Circle, label: 'Circle' },
    { name: 'triangle', icon: Triangle, label: 'Triangle' },
  ];

  const annotationTools = [
    { name: 'text', icon: Type, label: 'Text' },
    { name: 'brush', icon: Pencil, label: 'Brush' },
    { name: 'eraser', icon: Trash2, label: 'Eraser' },
  ];

  const specialTools = [
    { name: 'magnet', icon: Magnet, label: 'Magnet' },
  ];

  // Convert price data to market cap data
  const convertToMarketCap = (data: OHLCVData[], totalSupply: number = 100000000): OHLCVData[] => {
    return data.map(item => ({
      ...item,
      // Convert USD price to market cap (price is already in USD from formatters)
      open: item.open * totalSupply,
      high: item.high * totalSupply,
      low: item.low * totalSupply,
      close: item.close * totalSupply,
    }));
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: theme === 'dark' ? '#d4d4d8' : '#71717a',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#27272a' : '#f4f4f5' },
        horzLines: { color: theme === 'dark' ? '#27272a' : '#f4f4f5' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
        mode: PriceScaleMode.Normal,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: theme === 'dark' ? '#52525b' : '#a1a1aa',
          style: LineStyle.Dashed,
        },
        horzLine: {
          width: 1,
          color: theme === 'dark' ? '#52525b' : '#a1a1aa',
          style: LineStyle.Dashed,
        },
      },
    });

    chartRef.current = chart;

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

  // Update chart series based on type and view mode
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove existing series
    if (mainSeriesRef.current) {
      chartRef.current.removeSeries(mainSeriesRef.current);
    }
    if (volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current);
    }

    // Create new series based on chart type
    let mainSeries;
    
    if (chartType === 'candlestick') {
      mainSeries = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        priceFormat: {
          type: 'price',
          precision: viewMode === 'marketcap' ? 2 : 8,
          minMove: viewMode === 'marketcap' ? 0.01 : 0.00000001,
        },
      });
    } else if (chartType === 'line') {
      mainSeries = chartRef.current.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: viewMode === 'marketcap' ? 2 : 8,
          minMove: viewMode === 'marketcap' ? 0.01 : 0.00000001,
        },
      });
    } else { // area
      mainSeries = chartRef.current.addSeries(AreaSeries, {
        topColor: 'rgba(59, 130, 246, 0.4)',
        bottomColor: 'rgba(59, 130, 246, 0.0)',
        lineColor: '#3b82f6',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: viewMode === 'marketcap' ? 2 : 8,
          minMove: viewMode === 'marketcap' ? 0.01 : 0.00000001,
        },
      });
    }

    // Add volume series if enabled
    if (showVolume) {
      const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });

      chartRef.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      volumeSeriesRef.current = volumeSeries;
    }

    mainSeriesRef.current = mainSeries;
  }, [chartType, viewMode, showVolume, theme]);

  // Load and update chart data
  useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true);
        const { data, isGraduated: graduated } = await ChartDataService.getChartData(agentId, interval);
        
        setIsGraduated(graduated);
        
        // Convert data based on view mode
        const processedData = viewMode === 'marketcap' ? convertToMarketCap(data) : data;
        setChartData(processedData);

        if (mainSeriesRef.current && processedData.length > 0) {
          if (chartType === 'candlestick') {
            const candlestickData = processedData.map(item => ({
              time: item.time,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close,
            }));
            mainSeriesRef.current.setData(candlestickData);
          } else {
            const lineData = processedData.map(item => ({
              time: item.time,
              value: item.close,
            }));
            mainSeriesRef.current.setData(lineData);
          }

          // Update volume data
          if (volumeSeriesRef.current) {
            const volumeData = processedData.map(item => ({
              time: item.time,
              value: viewMode === 'marketcap' ? item.volume : item.volume,
              color: item.close >= item.open ? '#22c55e4D' : '#ef44444D',
            }));
            volumeSeriesRef.current.setData(volumeData);
          }

          // Update price callback and current price display
          if (processedData.length > 0) {
            const latestPrice = viewMode === 'marketcap' 
              ? processedData[processedData.length - 1].close
              : data[data.length - 1].close;
            setCurrentPrice(latestPrice);
            if (onPriceUpdate) {
              onPriceUpdate(data[data.length - 1].close); // Always use raw price for callbacks
            }
          }

          // Fit content
          chartRef.current?.timeScale().fitContent();
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [agentId, interval, viewMode, chartType, onPriceUpdate]);

  const handleZoomIn = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const range = timeScale.getVisibleRange();
      if (range) {
        const duration = range.to - range.from;
        const newDuration = duration * 0.8;
        const center = (range.from + range.to) / 2;
        timeScale.setVisibleRange({
          from: center - newDuration / 2,
          to: center + newDuration / 2,
        });
      }
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const range = timeScale.getVisibleRange();
      if (range) {
        const duration = range.to - range.from;
        const newDuration = duration * 1.2;
        const center = (range.from + range.to) / 2;
        timeScale.setVisibleRange({
          from: center - newDuration / 2,
          to: center + newDuration / 2,
        });
      }
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  return (
    <div className="flex h-full bg-background border border-border rounded-lg overflow-hidden">
      {/* Left Toolbar - TradingView Style */}
      <div className="w-12 bg-background/50 border-r border-border flex flex-col items-center py-2 gap-1">
        {drawingTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.value}
              variant={activeTool === tool.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTool(tool.value)}
              className="w-10 h-10 p-0"
              title={tool.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
        <div className="w-8 h-px bg-border my-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="w-10 h-10 p-0"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="w-10 h-10 p-0"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetZoom}
          className="w-10 h-10 p-0"
          title="Reset Zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

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
                  {isGraduated ? "DEX" : "Bonding"}
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

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={showVolume ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowVolume(!showVolume)}
                className="text-xs px-3 py-1 h-7"
              >
                Volume
              </Button>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="text-muted-foreground">Loading chart data...</div>
            </div>
          )}
          <div 
            ref={chartContainerRef} 
            className="w-full h-full cursor-crosshair"
          />
          {chartData.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
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

export default AdvancedTradingChart;