import { OHLCBucket } from '@/hooks/useOHLCData';

export interface MappedOHLCBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  fx: number;
}

/**
 * Phase 4: Robust OHLC data adapter
 * Converts string-based RPC data to numbers, filters invalid data, and ensures proper sorting
 * 
 * ✅ IMPORTANT UNITS:
 * - OHLCBucket.v (volume): Raw token units from DB (not normalized by 1e9)
 * - MappedOHLCBar.volume: Also raw token units - chart display handles normalization
 * - Token decimals: 1e9 (1 display token = 1,000,000,000 raw units)
 */
export function mapOHLCRows(rows: OHLCBucket[]): MappedOHLCBar[] {
  return rows
    .map(r => ({
      time: Math.floor(new Date(r.t).getTime() / 1000),
      open: +r.o,
      high: +r.h,
      low: +r.l,
      close: +r.c,
      volume: +r.v,  // ✅ Raw token units (not normalized by 1e9)
      fx: +r.fx,
    }))
    .filter(b => [b.open, b.high, b.low, b.close].every(Number.isFinite))
    .sort((a, b) => (a.time as number) - (b.time as number));
}
