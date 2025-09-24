import { useEffect, useRef, useState } from 'react';
import { IChartApi } from 'lightweight-charts';
import { TechnicalIndicators, OHLCData } from '@/lib/technicalIndicators';

interface UseAdvancedIndicatorsProps {
  chart: IChartApi | null;
  data: any[];
  enabled?: boolean;
}

export const useAdvancedIndicators = ({ chart, data, enabled = false }: UseAdvancedIndicatorsProps) => {
  const indicatorSeriesRef = useRef<Map<string, any>>(new Map());
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(new Set());

  const addIndicator = (type: 'rsi' | 'macd' | 'bollinger' | 'stochastic' | 'sma' | 'ema') => {
    if (!chart || !data || data.length < 20) return;

    try {
      const ohlcData: OHLCData[] = data.map(item => ({
        time: item.time,
        open: item.open || item.value,
        high: item.high || item.value,
        low: item.low || item.value,
        close: item.close || item.value,
        volume: item.volume || 0,
      }));

      let indicatorData: any[] = [];
      let series: any;

      switch (type) {
        case 'rsi':
          indicatorData = TechnicalIndicators.calculateRSI(ohlcData, 14);
          series = (chart as any).addLineSeries({
            color: '#ff6b6b',
            lineWidth: 2,
            priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
            priceScaleId: 'rsi',
          });
          
          // Add RSI levels
          const rsiUpperLevel = (chart as any).addLineSeries({
            color: '#dc2626',
            lineStyle: 1, // Dashed
            lineWidth: 1,
            priceScaleId: 'rsi',
          });
          const rsiLowerLevel = (chart as any).addLineSeries({
            color: '#dc2626',
            lineStyle: 1, // Dashed
            lineWidth: 1,
            priceScaleId: 'rsi',
          });
          
          rsiUpperLevel.setData(indicatorData.map(item => ({ time: item.time, value: 70 })));
          rsiLowerLevel.setData(indicatorData.map(item => ({ time: item.time, value: 30 })));
          
          series.setData(indicatorData.map(item => ({ time: item.time, value: item.rsi })));
          indicatorSeriesRef.current.set(`${type}_upper`, rsiUpperLevel);
          indicatorSeriesRef.current.set(`${type}_lower`, rsiLowerLevel);
          break;

        case 'macd':
          const macdData = TechnicalIndicators.calculateMACD(ohlcData, 12, 26, 9);
          
          // MACD line
          const macdSeries = (chart as any).addLineSeries({
            color: '#3b82f6',
            lineWidth: 2,
            priceScaleId: 'macd',
          });
          
          // Signal line
          const signalSeries = (chart as any).addLineSeries({
            color: '#ef4444',
            lineWidth: 2,
            priceScaleId: 'macd',
          });
          
          // Histogram
          const histogramSeries = (chart as any).addHistogramSeries({
            color: '#10b981',
            priceScaleId: 'macd',
          });
          
          macdSeries.setData(macdData.map(item => ({ time: item.time, value: item.macd })));
          signalSeries.setData(macdData.map(item => ({ time: item.time, value: item.signal })));
          histogramSeries.setData(macdData.map(item => ({ 
            time: item.time, 
            value: item.histogram,
            color: item.histogram >= 0 ? '#10b981' : '#ef4444'
          })));
          
          indicatorSeriesRef.current.set(`${type}_macd`, macdSeries);
          indicatorSeriesRef.current.set(`${type}_signal`, signalSeries);
          indicatorSeriesRef.current.set(`${type}_histogram`, histogramSeries);
          return;

        case 'bollinger':
          const bbData = TechnicalIndicators.calculateBollingerBands(ohlcData, 20, 2);
          
          const upperBand = (chart as any).addLineSeries({
            color: '#9ca3af',
            lineWidth: 1,
          });
          const middleBand = (chart as any).addLineSeries({
            color: '#6b7280',
            lineWidth: 2,
          });
          const lowerBand = (chart as any).addLineSeries({
            color: '#9ca3af',
            lineWidth: 1,
          });
          
          upperBand.setData(bbData.map(item => ({ time: item.time, value: item.upper })));
          middleBand.setData(bbData.map(item => ({ time: item.time, value: item.middle })));
          lowerBand.setData(bbData.map(item => ({ time: item.time, value: item.lower })));
          
          indicatorSeriesRef.current.set(`${type}_upper`, upperBand);
          indicatorSeriesRef.current.set(`${type}_middle`, middleBand);
          indicatorSeriesRef.current.set(`${type}_lower`, lowerBand);
          return;

        case 'stochastic':
          const stochData = TechnicalIndicators.calculateStochastic(ohlcData, 14, 3);
          
          const kLine = (chart as any).addLineSeries({
            color: '#8b5cf6',
            lineWidth: 2,
            priceScaleId: 'stochastic',
          });
          const dLine = (chart as any).addLineSeries({
            color: '#f59e0b',
            lineWidth: 2,
            priceScaleId: 'stochastic',
          });
          
          kLine.setData(stochData.map(item => ({ time: item.time, value: item.k })));
          dLine.setData(stochData.map(item => ({ time: item.time, value: item.d })));
          
          indicatorSeriesRef.current.set(`${type}_k`, kLine);
          indicatorSeriesRef.current.set(`${type}_d`, dLine);
          return;

        case 'sma':
          indicatorData = TechnicalIndicators.calculateSMA(ohlcData, 20);
          series = (chart as any).addLineSeries({
            color: '#f59e0b',
            lineWidth: 2,
          });
          series.setData(indicatorData);
          break;

        case 'ema':
          indicatorData = TechnicalIndicators.calculateEMA(ohlcData, 20);
          series = (chart as any).addLineSeries({
            color: '#06b6d4',
            lineWidth: 2,
          });
          series.setData(indicatorData);
          break;
      }

      if (series) {
        indicatorSeriesRef.current.set(type, series);
      }
      
      setActiveIndicators(prev => new Set([...prev, type]));
      console.log(`Added ${type.toUpperCase()} indicator`);
      
    } catch (error) {
      console.error(`Error adding ${type} indicator:`, error);
    }
  };

  const removeIndicator = (type: string) => {
    const series = indicatorSeriesRef.current.get(type);
    if (series && chart) {
      chart.removeSeries(series);
      indicatorSeriesRef.current.delete(type);
    }
    
    // Remove related series for complex indicators
    if (type === 'rsi') {
      ['upper', 'lower'].forEach(suffix => {
        const relatedSeries = indicatorSeriesRef.current.get(`${type}_${suffix}`);
        if (relatedSeries && chart) {
          chart.removeSeries(relatedSeries);
          indicatorSeriesRef.current.delete(`${type}_${suffix}`);
        }
      });
    } else if (type === 'macd') {
      ['macd', 'signal', 'histogram'].forEach(suffix => {
        const relatedSeries = indicatorSeriesRef.current.get(`${type}_${suffix}`);
        if (relatedSeries && chart) {
          chart.removeSeries(relatedSeries);
          indicatorSeriesRef.current.delete(`${type}_${suffix}`);
        }
      });
    } else if (type === 'bollinger') {
      ['upper', 'middle', 'lower'].forEach(suffix => {
        const relatedSeries = indicatorSeriesRef.current.get(`${type}_${suffix}`);
        if (relatedSeries && chart) {
          chart.removeSeries(relatedSeries);
          indicatorSeriesRef.current.delete(`${type}_${suffix}`);
        }
      });
    } else if (type === 'stochastic') {
      ['k', 'd'].forEach(suffix => {
        const relatedSeries = indicatorSeriesRef.current.get(`${type}_${suffix}`);
        if (relatedSeries && chart) {
          chart.removeSeries(relatedSeries);
          indicatorSeriesRef.current.delete(`${type}_${suffix}`);
        }
      });
    }
    
    setActiveIndicators(prev => {
      const newSet = new Set(prev);
      newSet.delete(type);
      return newSet;
    });
    
    console.log(`Removed ${type.toUpperCase()} indicator`);
  };

  const clearAllIndicators = () => {
    indicatorSeriesRef.current.forEach((series, key) => {
      if (chart) {
        chart.removeSeries(series);
      }
    });
    indicatorSeriesRef.current.clear();
    setActiveIndicators(new Set());
    console.log('Cleared all indicators');
  };

  const toggleIndicator = (type: 'rsi' | 'macd' | 'bollinger' | 'stochastic' | 'sma' | 'ema') => {
    if (activeIndicators.has(type)) {
      removeIndicator(type);
    } else {
      addIndicator(type);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllIndicators();
    };
  }, []);

  return {
    activeIndicators,
    addIndicator,
    removeIndicator,
    clearAllIndicators,
    toggleIndicator,
    isIndicatorActive: (type: string) => activeIndicators.has(type),
  };
};