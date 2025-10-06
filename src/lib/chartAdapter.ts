import Big from 'big.js';

interface OHLCBucket {
  t: string;      // ISO-8601 timestamp
  o: string;
  h: string;
  l: string;
  c: string;      // close price in PROMPT
  v: string;
  fx: string;     // FX rate at bucket time
}

/**
 * Phase 4: Chart adapter for OHLC data with per-bucket FX rates
 * Converts PROMPT prices to USD using per-bucket FX and applies market cap transformation
 */
export function adaptBucketsForChart(
  buckets: OHLCBucket[],
  supplyStr: string, // total pre-grad, circulating post-grad
  mode: 'price' | 'marketcap'
) {
  return buckets.map(b => {
    const priceUsd = Big(b.c).times(b.fx);
    const y = mode === 'marketcap' ? priceUsd.times(supplyStr) : priceUsd;
    return { 
      time: new Date(b.t).getTime() / 1000, 
      value: Number(y.toString()) 
    };
  });
}
