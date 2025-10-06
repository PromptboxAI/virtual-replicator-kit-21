import Big from 'big.js';

interface OHLCBucket {
  bucket_time: string;
  close_prompt: string;
  fx_rate: string;
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
    const priceUsd = Big(b.close_prompt).times(b.fx_rate);
    const y = mode === 'marketcap' ? priceUsd.times(supplyStr) : priceUsd;
    return { 
      time: new Date(b.bucket_time).getTime() / 1000, 
      value: Number(y.toString()) 
    };
  });
}
