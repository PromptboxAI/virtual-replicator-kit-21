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
import { useTheme } from 'next-themes';
import { useChartRealtime } from '@/hooks/useChartRealtime';
import { useChartDrawings } from '@/hooks/useChartDrawings';
import { useMobileGestures } from '@/hooks/useMobileGestures';
import { useAdvancedIndicators } from '@/hooks/useAdvancedIndicators';
import { useAgentMetrics } from '@/hooks/useAgentMetrics';
import { useOHLCData } from '@/hooks/useOHLCData';
import { adaptBucketsForChart } from '@/lib/chartAdapter';
import { Units } from '@/lib/units';
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
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [showTechnicalIndicators, setShowTechnicalIndicators] = useState(false);
  const [showGraduationOverlay, setShowGraduationOverlay] = useState(true);
  const [showPriceImpact, setShowPriceImpact] = useState(true);
  const { theme } = useTheme();
  
  // Get metrics for supply policy
  const { metrics } = useAgentMetrics(agentId);
  
  // Get OHLC data with per-bucket FX
  const intervalMap: Record<ChartInterval, string> = {
    '1': '1m', '5': '5m', '15': '15m', '60': '1h', '240': '4h', '1D': '1d'
  };
  const { data: ohlcData, loading: ohlcLoading } = useOHLCData(agentId, intervalMap[interval]);

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
    data: ohlcData?.buckets || [],
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
          priceScaleId: 'left',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        
        chart.applyOptions({
          leftPriceScale: { 
            visible: false, 
            borderVisible: false,
            scaleMargins: { top: 0.8, bottom: 0 },
          },
          rightPriceScale: { 
            visible: true, 
            borderVisible: false,
          },
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
      priceFormat: {
        type: 'price',
        precision: 10,
        minMove: 0.0000000001,
      },
        });
        mainSeriesRef.current = candleSeries;
      } else if (chartType === 'line') {
        const line = chart.addSeries(LineSeries, {
          color: '#8b5cf6',
          lineWidth: 2,
          priceFormat: {
            type: 'price',
            precision: 10,
            minMove: 0.0000000001,
          },
        });
        mainSeriesRef.current = line;
      } else if (chartType === 'area') {
        const area = chart.addSeries(AreaSeries, {
          topColor: 'rgba(139, 92, 246, 0.56)',
          bottomColor: 'rgba(139, 92, 246, 0.04)',
          lineColor: '#8b5cf6',
          lineWidth: 2,
          priceFormat: {
            type: 'price',
            precision: 10,
            minMove: 0.0000000001,
          },
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

  // Process OHLC data with adapter
  useEffect(() => {
    if (!ohlcData?.buckets || !metrics || !chartRef.current || !mainSeriesRef.current) {
      setLoading(ohlcLoading);
      return;
    }

    setLoading(false);
    
    try {
      const policy = metrics.supply.policy;
      const supply = policy === 'FDV' ? metrics.supply.total : metrics.supply.circulating;
      
      if (!supply || ohlcData.buckets.length === 0) return;

      // Convert OHLC data based on chart type
      if (chartType === 'candlestick') {
        // Candlestick needs { time, open, high, low, close }
        const candleData = ohlcData.buckets.map(b => {
          const timeSeconds = new Date(b.t).getTime() / 1000;
          const fx = parseFloat(b.fx);
          const supplyNum = parseFloat(supply);
          
          // Convert PROMPT to USD, then apply mode transformation
          const open = parseFloat(b.o) * fx;
          const high = parseFloat(b.h) * fx;
          const low = parseFloat(b.l) * fx;
          const close = parseFloat(b.c) * fx;
          
          if (viewMode === 'marketcap') {
            return {
              time: timeSeconds,
              open: open * supplyNum,
              high: high * supplyNum,
              low: low * supplyNum,
              close: close * supplyNum,
            };
          }
          
          return { time: timeSeconds, open, high, low, close };
        });
        
        mainSeriesRef.current.setData(candleData);
        setCurrentPrice(candleData[candleData.length - 1].close);
      } else {
        // Line/Area needs { time, value }
        const adapted = adaptBucketsForChart(
          ohlcData.buckets,
          supply,
          viewMode
        );
        
        mainSeriesRef.current.setData(adapted);
        setCurrentPrice(adapted[adapted.length - 1].value);
      }
      
      // Notify parent of USD price using the bucket's FX rate (not current FX)
      const latestBucket = ohlcData.buckets[ohlcData.buckets.length - 1];
      const latestPriceUSD = parseFloat(latestBucket.c) * parseFloat(latestBucket.fx);
      onPriceUpdate?.(latestPriceUSD);

      // Update volume if enabled
      if (showVolume && volumeSeriesRef.current) {
        try {
          const TOKEN_DECIMALS = 9; // Standard token decimals
          const volumeData = ohlcData.buckets.map((b, i) => ({
            time: new Date(b.t).getTime() / 1000,
            value: parseFloat(b.v) / 10**TOKEN_DECIMALS,
            color: i > 0 && parseFloat(b.c) >= parseFloat(ohlcData.buckets[i-1].c) 
              ? '#10b98155' 
              : '#ef444455',
          }));
          volumeSeriesRef.current.setData(volumeData);
        } catch (error) {
          console.warn('Error setting volume data:', error);
        }
      }
      
      // Enhanced price parity check (dev only)
      if (process.env.NODE_ENV === 'development' && chartType === 'candlestick' && metrics?.price?.usd) {
        const lastBucket = ohlcData.buckets[ohlcData.buckets.length - 1];
        const chartPriceUSD = parseFloat(lastBucket.c) * parseFloat(lastBucket.fx);
        const metricsPriceUSD = typeof metrics.price.usd === 'number' 
          ? metrics.price.usd 
          : parseFloat(metrics.price.usd);
        
        console.info('Chart price update (USD):', chartPriceUSD);
        
        if (Number.isFinite(chartPriceUSD) && Number.isFinite(metricsPriceUSD) && metricsPriceUSD > 0) {
          const diff = Math.abs(chartPriceUSD - metricsPriceUSD) / Math.max(1e-12, metricsPriceUSD);
          if (diff > 0.05) {
            console.warn('⚠️ Price Parity Alert', { 
              agentId,
              chartPriceUSD: chartPriceUSD.toFixed(10), 
              metricsPriceUSD: metricsPriceUSD.toFixed(10), 
              diff: `${(diff*100).toFixed(2)}%`,
              lastBucketFX: lastBucket.fx,
              metricsFX: metrics.price.fx,
              lastBucketTime: lastBucket.t
            });
          }
        }
      }

      // Fit chart to data
      chartRef.current.timeScale().fitContent();
    } catch (error) {
      console.error('Failed to process chart data:', error);
    }
  }, [ohlcData, metrics, viewMode, chartType, showVolume, onPriceUpdate, ohlcLoading]);

  // Real-time updates (disabled - we rely on OHLC polling for now)
  const handleRealtimeUpdate = useCallback((newData: any) => {
    // TODO: Re-enable when real-time uses per-bucket FX
    console.log('Real-time update received but not applied:', newData);
  }, []);

  const handlePriceChange = useCallback((price: number) => {
    // Animate price changes
    const oldPrice = currentPrice;
    if (oldPrice !== price) {
      setPriceAnimation(price > oldPrice ? 'up' : 'down');
      setTimeout(() => setPriceAnimation(null), 1000);
    }
    
    setCurrentPrice(price);
    onPriceUpdate?.(price);
  }, [currentPrice, onPriceUpdate]);

  const { isConnected } = useChartRealtime({
    agentId,
    onUpdate: handleRealtimeUpdate,
    onPriceChange: handlePriceChange,
    enabled: !loading
  });

  // ✅ Show empty state if no trades exist
  if (!ohlcLoading && (!ohlcData?.buckets || ohlcData.buckets.length === 0)) {
    return (
      <Card className="flex h-full bg-background border border-border rounded-lg overflow-hidden">
        <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground p-8">
          <Activity className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No trades yet</p>
          <p className="text-sm">Chart will appear after the first trade</p>
        </div>
      </Card>
    );
  }

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
                {currentPrice > 0 && metrics && (
                  <div className="text-right">
                    <div className={`text-lg font-bold transition-colors duration-1000 ${
                      priceAnimation === 'up' ? 'text-green-500' : 
                      priceAnimation === 'down' ? 'text-red-500' : 'text-primary'
                    }`}>
                      {viewMode === 'marketcap' 
                        ? Units.formatCap(currentPrice.toString(), 'USD')
                        : Units.formatPrice(currentPrice.toString(), 'USD')}
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
              const dataStr = JSON.stringify(ohlcData?.buckets || [], null, 2);
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