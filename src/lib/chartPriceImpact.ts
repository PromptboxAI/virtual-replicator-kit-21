import { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { ChartDataService } from '@/services/chartDataService';

export interface PriceImpactData {
  currentPrice: number;
  impactPrice: number;
  priceImpact: number;
  estimatedTokens: number;
  slippageLevel: 'low' | 'medium' | 'high';
}

export class ChartPriceImpactManager {
  private chart: IChartApi;
  private impactOverlay: ISeriesApi<any> | null = null;
  private impactLine: ISeriesApi<any> | null = null;
  private agentId: string;
  private currentImpactData: PriceImpactData | null = null;

  constructor(chart: IChartApi, agentId: string) {
    this.chart = chart;
    this.agentId = agentId;
  }

  async simulateAndDisplayPriceImpact(
    promptAmount: number, 
    tradeType: 'buy' | 'sell',
    viewMode: 'price' | 'marketcap'
  ) {
    if (promptAmount <= 0) {
      this.clearPriceImpact();
      return;
    }

    try {
      // Get price impact simulation from service
      const impactData = await ChartDataService.simulatePriceImpact(
        this.agentId, 
        promptAmount, 
        tradeType
      );

      if (!impactData) {
        console.warn('No price impact data received');
        return;
      }

      // Calculate processed prices for display
      const currentPrice = viewMode === 'marketcap' 
        ? impactData.currentPrice * 1000000000 
        : impactData.currentPrice;
      
      const impactPrice = viewMode === 'marketcap'
        ? impactData.impactPrice * 1000000000
        : impactData.impactPrice;

      this.currentImpactData = {
        currentPrice: impactData.currentPrice,
        impactPrice: impactData.impactPrice,
        priceImpact: impactData.priceImpactPercent,
        estimatedTokens: impactData.estimatedTokens,
        slippageLevel: this.getSlippageLevel(impactData.priceImpactPercent)
      };

      // Display the impact visualization
      this.displayPriceImpactOverlay(currentPrice, impactPrice, tradeType);
      
      console.log('Price impact simulation:', this.currentImpactData);

    } catch (error) {
      console.error('Error simulating price impact:', error);
      this.clearPriceImpact();
    }
  }

  private displayPriceImpactOverlay(
    currentPrice: number, 
    impactPrice: number, 
    tradeType: 'buy' | 'sell'
  ) {
    this.clearPriceImpact();

    // Create semi-transparent overlay showing price impact
    this.impactOverlay = this.chart.addSeries('Area', {
      topColor: tradeType === 'buy' 
        ? 'rgba(16, 185, 129, 0.2)' 
        : 'rgba(239, 68, 68, 0.2)',
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineColor: tradeType === 'buy' ? '#10b981' : '#ef4444',
      lineWidth: 2,
      lineStyle: 1, // Dashed
      priceLineVisible: false,
    });

    // Create impact price line
    this.impactLine = this.chart.addSeries('Line', {
      color: this.getImpactColor(this.currentImpactData?.slippageLevel || 'low'),
      lineWidth: 3,
      lineStyle: 1, // Dashed
      priceLineVisible: true,
      title: `Impact Price: ${this.currentImpactData?.priceImpact.toFixed(2)}%`,
    });

    // Get time range for overlay
    const timeScale = this.chart.timeScale();
    const visibleRange = timeScale.getVisibleLogicalRange();
    
    if (visibleRange) {
      const now = Math.floor(Date.now() / 1000) as Time;
      const future = (Math.floor(Date.now() / 1000) + 300) as Time; // 5 minutes future
      
      // Area showing price impact range
      const areaData = [
        { time: now, value: Math.min(currentPrice, impactPrice) },
        { time: future, value: Math.max(currentPrice, impactPrice) },
      ];
      
      this.impactOverlay.setData(areaData);

      // Impact price line
      const lineData = [
        { time: now, value: impactPrice },
        { time: future, value: impactPrice },
      ];
      
      this.impactLine.setData(lineData);

      // Note: Markers not fully supported in this implementation
      console.log('Price impact visualization added:', this.currentImpactData?.priceImpact.toFixed(2), '% impact');
    }
  }

  private getSlippageLevel(priceImpact: number): 'low' | 'medium' | 'high' {
    const impact = Math.abs(priceImpact);
    if (impact < 1) return 'low';
    if (impact < 5) return 'medium';
    return 'high';
  }

  private getImpactColor(level: 'low' | 'medium' | 'high'): string {
    switch (level) {
      case 'low': return '#10b981'; // Green
      case 'medium': return '#f59e0b'; // Yellow  
      case 'high': return '#ef4444'; // Red
      default: return '#6b7280';
    }
  }

  getCurrentImpactData(): PriceImpactData | null {
    return this.currentImpactData;
  }

  clearPriceImpact() {
    if (this.impactOverlay) {
      this.chart.removeSeries(this.impactOverlay);
      this.impactOverlay = null;
    }
    if (this.impactLine) {
      this.chart.removeSeries(this.impactLine);
      this.impactLine = null;
    }
    this.currentImpactData = null;
  }

  updatePriceImpactForAmount(
    promptAmount: number, 
    tradeType: 'buy' | 'sell',
    viewMode: 'price' | 'marketcap'
  ) {
    // Debounce rapid updates
    clearTimeout((this as any).updateTimeout);
    (this as any).updateTimeout = setTimeout(() => {
      this.simulateAndDisplayPriceImpact(promptAmount, tradeType, viewMode);
    }, 300);
  }

  destroy() {
    this.clearPriceImpact();
    clearTimeout((this as any).updateTimeout);
  }
}