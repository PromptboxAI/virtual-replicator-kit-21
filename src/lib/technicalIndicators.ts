export interface OHLCData {
  time: any;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorValue {
  time: any;
  value: number;
}

export interface MACDValue {
  time: any;
  macd: number;
  signal: number;
  histogram: number;
}

export interface RSIValue {
  time: any;
  rsi: number;
}

export interface BollingerBandsValue {
  time: any;
  upper: number;
  middle: number;
  lower: number;
}

export interface StochasticValue {
  time: any;
  k: number;
  d: number;
}

export class TechnicalIndicators {
  
  // Simple Moving Average
  static calculateSMA(data: OHLCData[], period: number): IndicatorValue[] {
    const result: IndicatorValue[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1)
        .reduce((acc, item) => acc + item.close, 0);
      
      result.push({
        time: data[i].time,
        value: sum / period,
      });
    }
    
    return result;
  }

  // Exponential Moving Average
  static calculateEMA(data: OHLCData[], period: number): IndicatorValue[] {
    const result: IndicatorValue[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for the first value
    let ema = data.slice(0, period).reduce((acc, item) => acc + item.close, 0) / period;
    result.push({ time: data[period - 1].time, value: ema });
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
      result.push({
        time: data[i].time,
        value: ema,
      });
    }
    
    return result;
  }

  // Relative Strength Index
  static calculateRSI(data: OHLCData[], period: number = 14): RSIValue[] {
    const result: RSIValue[] = [];
    const changes: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i].close - data[i - 1].close);
    }
    
    // Calculate initial average gains and losses
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let i = 0; i < period; i++) {
      const change = changes[i];
      if (change > 0) {
        avgGain += change;
      } else {
        avgLoss += Math.abs(change);
      }
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    // Calculate RSI
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      result.push({
        time: data[i + 1].time,
        rsi: rsi,
      });
    }
    
    return result;
  }

  // MACD (Moving Average Convergence Divergence)
  static calculateMACD(data: OHLCData[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDValue[] {
    const result: MACDValue[] = [];
    
    const fastEMA = this.calculateEMA(data, fastPeriod);
    const slowEMA = this.calculateEMA(data, slowPeriod);
    
    // Calculate MACD line
    const macdLine: IndicatorValue[] = [];
    const startIndex = slowPeriod - fastPeriod;
    
    for (let i = 0; i < fastEMA.length - startIndex; i++) {
      macdLine.push({
        time: fastEMA[i + startIndex].time,
        value: fastEMA[i + startIndex].value - slowEMA[i].value,
      });
    }
    
    // Calculate Signal line (EMA of MACD)
    const signalLine = this.calculateEMAFromValues(macdLine, signalPeriod);
    
    // Combine MACD and Signal to create final result
    for (let i = 0; i < signalLine.length; i++) {
      const macdIndex = i + signalPeriod - 1;
      if (macdIndex < macdLine.length) {
        result.push({
          time: signalLine[i].time,
          macd: macdLine[macdIndex].value,
          signal: signalLine[i].value,
          histogram: macdLine[macdIndex].value - signalLine[i].value,
        });
      }
    }
    
    return result;
  }

  // Bollinger Bands
  static calculateBollingerBands(data: OHLCData[], period: number = 20, stdDev: number = 2): BollingerBandsValue[] {
    const result: BollingerBandsValue[] = [];
    const sma = this.calculateSMA(data, period);
    
    for (let i = 0; i < sma.length; i++) {
      const dataIndex = i + period - 1;
      const subset = data.slice(dataIndex - period + 1, dataIndex + 1);
      
      // Calculate standard deviation
      const mean = sma[i].value;
      const variance = subset.reduce((acc, item) => {
        return acc + Math.pow(item.close - mean, 2);
      }, 0) / period;
      
      const standardDeviation = Math.sqrt(variance);
      
      result.push({
        time: sma[i].time,
        upper: mean + (standardDeviation * stdDev),
        middle: mean,
        lower: mean - (standardDeviation * stdDev),
      });
    }
    
    return result;
  }

  // Stochastic Oscillator
  static calculateStochastic(data: OHLCData[], kPeriod: number = 14, dPeriod: number = 3): StochasticValue[] {
    const result: StochasticValue[] = [];
    const kValues: IndicatorValue[] = [];
    
    // Calculate %K
    for (let i = kPeriod - 1; i < data.length; i++) {
      const subset = data.slice(i - kPeriod + 1, i + 1);
      const highest = Math.max(...subset.map(item => item.high));
      const lowest = Math.min(...subset.map(item => item.low));
      const current = data[i].close;
      
      const k = ((current - lowest) / (highest - lowest)) * 100;
      kValues.push({
        time: data[i].time,
        value: k,
      });
    }
    
    // Calculate %D (SMA of %K)
    const dValues = this.calculateSMAFromValues(kValues, dPeriod);
    
    // Combine results
    for (let i = 0; i < dValues.length; i++) {
      const kIndex = i + dPeriod - 1;
      if (kIndex < kValues.length) {
        result.push({
          time: dValues[i].time,
          k: kValues[kIndex].value,
          d: dValues[i].value,
        });
      }
    }
    
    return result;
  }

  // Williams %R
  static calculateWilliamsR(data: OHLCData[], period: number = 14): IndicatorValue[] {
    const result: IndicatorValue[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const subset = data.slice(i - period + 1, i + 1);
      const highest = Math.max(...subset.map(item => item.high));
      const lowest = Math.min(...subset.map(item => item.low));
      const current = data[i].close;
      
      const williamsR = ((highest - current) / (highest - lowest)) * -100;
      
      result.push({
        time: data[i].time,
        value: williamsR,
      });
    }
    
    return result;
  }

  // Volume Weighted Average Price (VWAP)
  static calculateVWAP(data: OHLCData[]): IndicatorValue[] {
    const result: IndicatorValue[] = [];
    let cumulativeVolumePrice = 0;
    let cumulativeVolume = 0;
    
    for (let i = 0; i < data.length; i++) {
      const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
      const volume = data[i].volume || 1; // Default volume if not provided
      
      cumulativeVolumePrice += typicalPrice * volume;
      cumulativeVolume += volume;
      
      result.push({
        time: data[i].time,
        value: cumulativeVolumePrice / cumulativeVolume,
      });
    }
    
    return result;
  }

  // Helper method to calculate EMA from IndicatorValue array
  private static calculateEMAFromValues(data: IndicatorValue[], period: number): IndicatorValue[] {
    const result: IndicatorValue[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for the first value
    let ema = data.slice(0, period).reduce((acc, item) => acc + item.value, 0) / period;
    result.push({ time: data[period - 1].time, value: ema });
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i].value * multiplier) + (ema * (1 - multiplier));
      result.push({
        time: data[i].time,
        value: ema,
      });
    }
    
    return result;
  }

  // Helper method to calculate SMA from IndicatorValue array
  private static calculateSMAFromValues(data: IndicatorValue[], period: number): IndicatorValue[] {
    const result: IndicatorValue[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1)
        .reduce((acc, item) => acc + item.value, 0);
      
      result.push({
        time: data[i].time,
        value: sum / period,
      });
    }
    
    return result;
  }
}