import { IChartApi, ISeriesApi, Time } from 'lightweight-charts';

export interface GraduationThreshold {
  price: number;
  marketCap: number;
  color: string;
  label: string;
}

export interface TradeMarker {
  time: Time;
  price: number;
  volume: number;
  type: 'buy' | 'sell';
  size: 'small' | 'medium' | 'large';
}

export class ChartOverlayManager {
  private chart: IChartApi;
  private graduationLine: ISeriesApi<any> | null = null;
  private tradeMarkers: ISeriesApi<any> | null = null;
  private volumeSpikes: ISeriesApi<any> | null = null;
  private agentId: string;

  constructor(chart: IChartApi, agentId: string) {
    this.chart = chart;
    this.agentId = agentId;
  }

  addGraduationThreshold(threshold: GraduationThreshold, viewMode: 'price' | 'marketcap') {
    if (this.graduationLine) {
      this.chart.removeSeries(this.graduationLine);
    }

    const targetPrice = viewMode === 'marketcap' ? threshold.marketCap : threshold.price;

    this.graduationLine = this.chart.addSeries('Line', {
      color: threshold.color,
      lineWidth: 2,
      lineStyle: 1, // Dashed
      priceLineVisible: true,
      title: threshold.label,
    });

    // Create line across entire chart
    const timeScale = this.chart.timeScale();
    const visibleRange = timeScale.getVisibleLogicalRange();
    
    if (visibleRange) {
      const startTime = timeScale.coordinateToTime(0) as Time;
      const endTime = timeScale.coordinateToTime(1000) as Time;
      
      this.graduationLine.setData([
        { time: startTime, value: targetPrice },
        { time: endTime, value: targetPrice },
      ]);
    }

    console.log('Added graduation threshold at:', targetPrice);
  }

  addTradeMarkers(trades: TradeMarker[], viewMode: 'price' | 'marketcap') {
    if (this.tradeMarkers) {
      this.chart.removeSeries(this.tradeMarkers);
    }

    this.tradeMarkers = this.chart.addSeries('Line', {
      color: 'transparent',
      priceLineVisible: false,
    });

    // Convert trades to chart data
    const chartData = trades.map(trade => ({
      time: trade.time,
      value: viewMode === 'marketcap' ? trade.price * 1000000000 : trade.price,
    }));

    this.tradeMarkers.setData(chartData);
    // Note: Markers not fully supported in this implementation
    console.log('Added', trades.length, 'trade markers (simplified)');
  }

  addVolumeSpikes(spikes: { time: Time; price: number; volume: number }[], viewMode: 'price' | 'marketcap') {
    if (this.volumeSpikes) {
      this.chart.removeSeries(this.volumeSpikes);
    }

    this.volumeSpikes = this.chart.addSeries('Line', {
      color: 'transparent',
      priceLineVisible: false,
    });

    const chartData = spikes.map(spike => ({
      time: spike.time,
      value: viewMode === 'marketcap' ? spike.price * 1000000000 : spike.price,
    }));

    this.volumeSpikes.setData(chartData);
    // Note: Markers not fully supported in this implementation
    console.log('Added', spikes.length, 'volume spike markers (simplified)');
  }

  addLiquidityPoolEvent(time: Time, price: number, eventType: 'created' | 'migrated', viewMode: 'price' | 'marketcap') {
    // Create a special marker for LP events
    const lpSeries = this.chart.addSeries('Line', {
      color: 'transparent',
      priceLineVisible: false,
    });

    const chartPrice = viewMode === 'marketcap' ? price * 1000000000 : price;
    
    lpSeries.setData([{ time, value: chartPrice }]);
    // Note: Markers not fully supported in this implementation
    console.log('Added LP event marker (simplified):', eventType, 'at', time);
  }

  addCurrentPositionIndicator(time: Time, price: number, position: number, viewMode: 'price' | 'marketcap') {
    const positionSeries = this.chart.addSeries('Line', {
      color: 'transparent',
      priceLineVisible: false,
    });

    const chartPrice = viewMode === 'marketcap' ? price * 1000000000 : price;
    
    positionSeries.setData([{ time, value: chartPrice }]);
    // Note: Markers not fully supported in this implementation
    console.log('Added position indicator (simplified):', position, 'at', time);
  }

  private getMarkerShape(size: 'small' | 'medium' | 'large'): 'circle' | 'square' | 'arrowUp' | 'arrowDown' {
    switch (size) {
      case 'small': return 'circle';
      case 'medium': return 'square';
      case 'large': return 'arrowUp';
      default: return 'circle';
    }
  }

  private getMarkerText(trade: TradeMarker): string {
    const action = trade.type === 'buy' ? 'Buy' : 'Sell';
    return `${action}: ${this.formatVolume(trade.volume)}`;
  }

  private formatVolume(volume: number): string {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(0);
  }

  private formatTokens(tokens: number): string {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toFixed(2);
  }

  clearAllOverlays() {
    if (this.graduationLine) {
      this.chart.removeSeries(this.graduationLine);
      this.graduationLine = null;
    }
    if (this.tradeMarkers) {
      this.chart.removeSeries(this.tradeMarkers);
      this.tradeMarkers = null;
    }
    if (this.volumeSpikes) {
      this.chart.removeSeries(this.volumeSpikes);
      this.volumeSpikes = null;
    }
    console.log('Cleared all overlays');
  }

  updateGraduationThreshold(viewMode: 'price' | 'marketcap') {
    // Standard graduation threshold
    const threshold: GraduationThreshold = {
      price: 0.075, // $0.075 per token
      marketCap: 75000, // $75K market cap
      color: '#8b5cf6',
      label: 'Graduation Threshold'
    };

    this.addGraduationThreshold(threshold, viewMode);
  }

  destroy() {
    this.clearAllOverlays();
  }
}