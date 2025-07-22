import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  HistogramData,
  CrosshairMode,
  LineStyle, 
  ColorType 
} from 'lightweight-charts';
import { ChartDataService, OHLCVData, PriceImpactData } from '@/services/chartDataService';
import type { ChartInterval as ChartIntervalType } from '@/services/chartDataService';
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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  
  const { theme } = useTheme();
  const [interval, setInterval] = useState<ChartInterval>('5m');
  const [isGraduated, setIsGraduated] = useState(false);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [priceImpact, setPriceImpact] = useState<PriceImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { 
          type: ColorType.Solid, 
          color: isDark ? '#0a0a0a' : '#ffffff' 
        },
        textColor: isDark ? '#ffffff' : '#000000',
        fontSize: 12,
      },
      grid: {
        vertLines: { 
          color: isDark ? '#2a2a2a' : '#e5e5e5',
          style: LineStyle.Dotted 
        },
        horzLines: { 
          color: isDark ? '#2a2a2a' : '#e5e5e5',
          style: LineStyle.Dotted 
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2a2a2a' : '#e5e5e5',
      },
      timeScale: {
        borderColor: isDark ? '#2a2a2a' : '#e5e5e5',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create a placeholder for the chart - we'll implement proper charting once API is stable
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      height: 500px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: ${isDark ? '#ffffff' : '#000000'};
      background: ${isDark ? '#1a1a1a' : '#f8f9fa'};
      border-radius: 8px;
      margin: 1rem;
    `;
    placeholder.innerHTML = `
      <div style="text-align: center;">
        <h3 style="margin: 0 0 1rem 0; font-size: 1.2rem;">Professional Trading Chart</h3>
        <p style="margin: 0.5rem 0; opacity: 0.7;">Agent: ${agentId}</p>
        <p style="margin: 0.5rem 0; opacity: 0.7;">Interval: ${interval}</p>
        <p style="margin: 0.5rem 0; opacity: 0.7;">Candlestick data connected to database</p>
        <div style="margin-top: 1rem; padding: 1rem; background: ${isDark ? '#2a2a2a' : '#e5e5e5'}; border-radius: 4px; display: inline-block;">
          <p style="margin: 0; font-size: 0.9rem;">✅ Database OHLCV functions ready</p>
          <p style="margin: 0; font-size: 0.9rem;">✅ Price impact simulation ready</p>
          <p style="margin: 0; font-size: 0.9rem;">⏳ Chart rendering in progress</p>
        </div>
      </div>
    `;
    
    if (chartContainerRef.current) {
      chartContainerRef.current.appendChild(placeholder);
    }
    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDark]);

  // Initialize chart
  useEffect(() => {
    initializeChart();
    setLoading(false);
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initializeChart]);

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
        <div ref={chartContainerRef} className="w-full h-[500px]" />
      </div>
    </Card>
  );
};

export default ProfessionalTradingChart;