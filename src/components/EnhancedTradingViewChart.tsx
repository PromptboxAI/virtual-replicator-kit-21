import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  LineStyle, 
  CrosshairMode, 
  Time,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries
} from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ChartDataService, OHLCVData } from '@/services/chartDataService';
import { formatMarketCapUSD, formatPriceUSD, PROMPT_USD_RATE } from '@/lib/formatters';
import { useTheme } from 'next-themes';
import { useChartRealtime } from '@/hooks/useChartRealtime';
import { useChartDrawings } from '@/hooks/useChartDrawings';
import { useMobileGestures } from '@/hooks/useMobileGestures';
import { useAdvancedIndicators } from '@/hooks/useAdvancedIndicators';
import { TechnicalIndicators } from '@/lib/technicalIndicators';
import { ChartToolbar } from '@/components/ChartToolbar';
import { ChartPriceImpact } from '@/components/ChartPriceImpact';
import { 
  Settings, Volume2, TrendingUp, TrendingDown,
  BarChart3, Activity, Wifi, WifiOff
} from 'lucide-react';

interface EnhancedTradingViewChartProps {
  agentId: string;
  agentName?: string;
  agentSymbol?: string;
  agentAvatar?: string;
  viewMode: 'price' | 'marketcap';
  chartType: 'candlestick' | 'line' | 'area';
  promptAmount?: number;
  tradeType?: 'buy' | 'sell';
  onPriceUpdate?: (price: number) => void;
  agentMarketCap?: number; // Actual market cap from database in PROMPT
}

export type ChartInterval = '1' | '5' | '15' | '60' | '240' | '1D';

export const EnhancedTradingViewChart = ({ 
  agentId,
  agentName,
  agentSymbol,
  agentAvatar, 
  viewMode,
  chartType,
  promptAmount = 0,
  tradeType = 'buy',
  onPriceUpdate,
  agentMarketCap
}: EnhancedTradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  const [interval, setInterval] = useState<ChartInterval>('5');
  const [isGraduated, setIsGraduated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [showTechnicalIndicators, setShowTechnicalIndicators] = useState(false);
  const [showGraduationOverlay, setShowGraduationOverlay] = useState(true);
  const [showPriceImpact, setShowPriceImpact] = useState(true);
  const { theme } = useTheme();

  // Initialize chart drawing tools
  const {
    activeDrawingMode,
    drawings,
    drawingCount,
    setDrawingMode,
    createHorizontalLine,
    createTextAnnotation,
    removeDrawing,
    clearAllDrawings,
    toggleDrawingVisibility,
  } = useChartDrawings({
    chart: chartRef.current,
    agentId,
    enabled: true,
  });

  // Initialize mobile gestures
  const {
    gestureActive,
    resetZoom,
    zoomIn,
    zoomOut,
  } = useMobileGestures({
    chart: chartRef.current,
    containerRef: chartContainerRef,
    enabled: true,
  });

  // Initialize advanced indicators
  const {
    activeIndicators,
    toggleIndicator,
    isIndicatorActive,
    clearAllIndicators,
  } = useAdvancedIndicators({
    chart: chartRef.current,
    data: chartData,
    enabled: showTechnicalIndicators,
  });

  const intervals: { value: ChartInterval; label: string }[] = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: '1D', label: '1D' },
  ];

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? '#e5e7eb' : '#374151',
      },
      grid: {
        vertLines: { color: isDark ? '#374151' : '#e5e7eb' },
        horzLines: { color: isDark ? '#374151' : '#e5e7eb' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.2 : 0.1,
        },
      },
      timeScale: {
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add volume series if enabled (using v5 API)
    if (showVolume) {
      try {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: isDark ? '#6b7280' : '#9ca3af',
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        });
        
        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        
        volumeSeriesRef.current = volumeSeries;
      } catch (error) {
        console.warn('Volume series not supported:', error);
      }
    }

    // Add main price series based on chart type (using v5 API)
    try {
      if (chartType === 'candlestick') {
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderUpColor: '#10b981',
          borderDownColor: '#ef4444',
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });
        mainSeriesRef.current = candleSeries;
      } else if (chartType === 'line') {
        const line = chart.addSeries(LineSeries, {
          color: '#8b5cf6',
          lineWidth: 2,
        });
        mainSeriesRef.current = line;
      } else if (chartType === 'area') {
        const area = chart.addSeries(AreaSeries, {
          topColor: 'rgba(139, 92, 246, 0.56)',
          bottomColor: 'rgba(139, 92, 246, 0.04)',
          lineColor: '#8b5cf6',
          lineWidth: 2,
        });
        mainSeriesRef.current = area;
      }
    } catch (error) {
      console.error('Error creating chart series:', error);
      // Fallback to basic line series using v5 API
      const line = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 2,
      });
      mainSeriesRef.current = line;
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(chartContainerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (chart) {
        chart.remove();
      }
    };
  }, [chartType, showVolume, theme]);

  // Calculate technical indicators
  const calculateSMA = useCallback((data: any[], period: number) => {
    const smaData = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc: number, item: any) => acc + item.close, 0);
      smaData.push({
        time: data[i].time,
        value: sum / period,
      });
    }
    return smaData;
  }, []);

  // Load and update chart data
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
        
        if (result.data.length > 0 && chartRef.current && mainSeriesRef.current) {
          const processedData = result.data.map(item => {
            // For price view, use actual price from trades
            // For market cap view, calculate market cap at that point (price * 1B total supply)
            const TOTAL_SUPPLY = 1_000_000_000; // 1 billion tokens
            
            if (chartType === 'candlestick') {
              return {
                time: item.time as Time,
                open: viewMode === 'marketcap' ? item.open * TOTAL_SUPPLY : item.open,
                high: viewMode === 'marketcap' ? item.high * TOTAL_SUPPLY : item.high,
                low: viewMode === 'marketcap' ? item.low * TOTAL_SUPPLY : item.low,
                close: viewMode === 'marketcap' ? item.close * TOTAL_SUPPLY : item.close,
              };
            } else {
              return {
                time: item.time as Time,
                value: viewMode === 'marketcap' ? item.close * TOTAL_SUPPLY : item.close,
              };
            }
          });

          const latestItem = result.data[result.data.length - 1];
          const TOTAL_SUPPLY = 1_000_000_000;
          const latestPrice = viewMode === 'marketcap' 
            ? latestItem.close * TOTAL_SUPPLY * PROMPT_USD_RATE // Convert PROMPT mcap to USD
            : latestItem.close; // Keep in PROMPT for formatPriceUSD to convert
          setCurrentPrice(latestPrice);
          onPriceUpdate?.(latestItem.close);

          // Update main series data
          mainSeriesRef.current.setData(processedData);

          // Update volume data if available
          if (showVolume && volumeSeriesRef.current) {
            try {
              const volumeData = result.data.map(item => ({
                time: item.time as Time,
                value: item.volume,
                color: item.close >= item.open ? '#10b981' : '#ef4444',
              }));
              volumeSeriesRef.current.setData(volumeData);
            } catch (error) {
              console.warn('Error setting volume data:', error);
            }
          }

          // Add technical indicators if enabled
          if (showTechnicalIndicators && result.data.length > 20) {
            try {
              const TOTAL_SUPPLY = 1_000_000_000;
              const sma20 = calculateSMA(result.data.map(item => ({
                ...item,
                close: viewMode === 'marketcap' ? item.close * TOTAL_SUPPLY : item.close,
              })), 20);
              
              const smaLine = chartRef.current!.addSeries(LineSeries, {
                color: '#f59e0b',
                lineWidth: 1,
              });
              smaLine.setData(sma20);
            } catch (error) {
              console.warn('Error adding technical indicators:', error);
            }
          }

          // Fit chart to data
          chartRef.current.timeScale().fitContent();
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      }
      setLoading(false);
    };

    loadData();
  }, [agentId, interval, viewMode, chartType, showVolume, showTechnicalIndicators, calculateSMA, onPriceUpdate]);

  // Enhanced real-time updates with price animation
  const handleRealtimeUpdate = useCallback((newData: OHLCVData) => {
    const TOTAL_SUPPLY = 1_000_000_000;
    const processedPrice = viewMode === 'marketcap' 
      ? newData.close * TOTAL_SUPPLY * PROMPT_USD_RATE // Convert PROMPT mcap to USD
      : newData.close; // Keep in PROMPT for formatPriceUSD to convert
    
    // Animate price changes
    const oldPrice = currentPrice;
    if (oldPrice !== processedPrice) {
      setPriceAnimation(processedPrice > oldPrice ? 'up' : 'down');
      setTimeout(() => setPriceAnimation(null), 1000);
    }
    
    setCurrentPrice(processedPrice);
    onPriceUpdate?.(newData.close);
    
    // Update chart with new data point
    if (mainSeriesRef.current) {
      try {
        if (chartType === 'candlestick') {
          const candleData = {
            time: newData.time as Time,
            open: viewMode === 'marketcap' ? newData.open * TOTAL_SUPPLY : newData.open,
            high: viewMode === 'marketcap' ? newData.high * TOTAL_SUPPLY : newData.high,
            low: viewMode === 'marketcap' ? newData.low * TOTAL_SUPPLY : newData.low,
            close: processedPrice,
          };
          mainSeriesRef.current.update(candleData);
        } else {
          mainSeriesRef.current.update({
            time: newData.time as Time,
            value: processedPrice,
          });
        }

        if (showVolume && volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: newData.time as Time,
            value: newData.volume,
            color: newData.close >= newData.open ? '#10b981' : '#ef4444',
          });
        }
      } catch (error) {
        console.warn('Error updating real-time data:', error);
      }
    }
  }, [viewMode, currentPrice, onPriceUpdate, chartType, showVolume]);

  const handlePriceChange = useCallback((price: number) => {
    const TOTAL_SUPPLY = 1_000_000_000;
    const processedPrice = viewMode === 'marketcap' 
      ? price * TOTAL_SUPPLY * PROMPT_USD_RATE // Convert PROMPT mcap to USD
      : price; // Keep in PROMPT for formatPriceUSD to convert
    
    // Animate price changes
    const oldPrice = currentPrice;
    if (oldPrice !== processedPrice) {
      setPriceAnimation(processedPrice > oldPrice ? 'up' : 'down');
      setTimeout(() => setPriceAnimation(null), 1000);
    }
    
    setCurrentPrice(processedPrice);
    onPriceUpdate?.(price);
  }, [viewMode, currentPrice, onPriceUpdate]);

  const { isConnected } = useChartRealtime({
    agentId,
    onUpdate: handleRealtimeUpdate,
    onPriceChange: handlePriceChange,
    enabled: !loading
  });

  return (
    <Card className="flex h-full bg-background border border-border rounded-lg overflow-hidden">
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
                <div className="text-sm font-medium text-foreground">{agentName || 'Unknown Agent'}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {agentSymbol || '$AGENT'}
                  {isConnected ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                </div>
              </div>
              <div className="text-sm font-mono">
                {currentPrice > 0 && (
                  <div className="text-right">
                    <div className={`text-lg font-bold transition-colors duration-1000 ${
                      priceAnimation === 'up' ? 'text-green-500' : 
                      priceAnimation === 'down' ? 'text-red-500' : 'text-primary'
                    }`}>
                      {viewMode === 'marketcap' 
                        ? formatMarketCapUSD(currentPrice)
                        : formatPriceUSD(currentPrice)
                      }
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {viewMode === 'price' ? 'Price (USD)' : 'Market Cap'}
                      {isConnected && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
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
          </div>
        </div>

        {/* Chart Toolbar */}
        <ChartToolbar
          // Drawing tools
          activeDrawingMode={activeDrawingMode}
          onDrawingModeChange={setDrawingMode}
          drawingCount={drawingCount}
          onClearDrawings={clearAllDrawings}
          
          // Chart controls
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onFullscreen={() => {
            if (chartContainerRef.current) {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                chartContainerRef.current.requestFullscreen();
              }
            }
          }}
          
          // Screenshot and export
          onScreenshot={() => {
            if (chartRef.current) {
              const canvas = (chartRef.current as any).takeScreenshot();
              if (canvas) {
                const link = document.createElement('a');
                link.download = `${agentName || 'chart'}-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
              }
            }
          }}
          onExportData={() => {
            const dataStr = JSON.stringify(chartData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${agentName || 'chart'}-data-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          
          // Overlay toggles  
          graduationVisible={showGraduationOverlay}
          onToggleGraduation={() => setShowGraduationOverlay(!showGraduationOverlay)}
        />

        {/* Chart */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="text-muted-foreground">Loading chart data...</div>
            </div>
          )}
          
          {gestureActive && (
            <div className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs z-20">
              Touch gesture active
            </div>
          )}
          
          <div ref={chartContainerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
        </div>

        {/* Price Impact Overlay */}
        {promptAmount > 0 && showPriceImpact && (
          <div className="absolute bottom-4 right-4 bg-background/90 border border-border rounded-lg p-3 shadow-lg">
            <div className="text-xs text-muted-foreground mb-1">Trade Impact</div>
            <div className="flex items-center gap-2">
              <Badge variant={tradeType === 'buy' ? 'default' : 'destructive'} className="text-xs">
                {tradeType === 'buy' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {promptAmount} PROMPT
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EnhancedTradingViewChart;