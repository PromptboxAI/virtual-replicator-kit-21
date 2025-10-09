import { describe, it, expect } from 'vitest';
import { mapOHLCRows } from './chartDataAdapter';
import type { OHLCBucket } from '@/hooks/useOHLCData';

describe('chartDataAdapter', () => {
  it('should convert string buckets to numbers', () => {
    const input: OHLCBucket[] = [{
      t: '2024-01-01T00:00:00Z',
      o: '0.0000075',
      h: '0.0000080',
      l: '0.0000070',
      c: '0.0000078',
      v: '1000000000',
      fx: '0.10'
    }];
    
    const result = mapOHLCRows(input);
    
    expect(result[0].open).toBe(0.0000075);
    expect(result[0].high).toBe(0.0000080);
    expect(result[0].low).toBe(0.0000070);
    expect(result[0].close).toBe(0.0000078);
    expect(result[0].volume).toBe(1000000000);
    expect(result[0].fx).toBe(0.10);
    expect(typeof result[0].time).toBe('number');
  });
  
  it('should filter out invalid data (NaN, Infinity)', () => {
    const input: OHLCBucket[] = [
      { t: '2024-01-01T00:00:00Z', o: 'NaN', h: '1', l: '1', c: '1', v: '1', fx: '0.1' },
      { t: '2024-01-02T00:00:00Z', o: '1', h: 'Infinity', l: '1', c: '1', v: '1', fx: '0.1' },
      { t: '2024-01-03T00:00:00Z', o: '1', h: '2', l: '1', c: '1.5', v: '1', fx: '0.1' }
    ];
    
    const result = mapOHLCRows(input);
    
    // Only the third bucket should be valid
    expect(result.length).toBe(1);
    expect(result[0].open).toBe(1);
    expect(result[0].high).toBe(2);
  });
  
  it('should sort by time ascending', () => {
    const input: OHLCBucket[] = [
      { t: '2024-01-03T00:00:00Z', o: '3', h: '3', l: '3', c: '3', v: '1', fx: '0.1' },
      { t: '2024-01-01T00:00:00Z', o: '1', h: '1', l: '1', c: '1', v: '1', fx: '0.1' },
      { t: '2024-01-02T00:00:00Z', o: '2', h: '2', l: '2', c: '2', v: '1', fx: '0.1' }
    ];
    
    const result = mapOHLCRows(input);
    
    expect(result[0].time).toBeLessThan(result[1].time);
    expect(result[1].time).toBeLessThan(result[2].time);
    expect(result[0].open).toBe(1);
    expect(result[1].open).toBe(2);
    expect(result[2].open).toBe(3);
  });

  it('should convert timestamps to Unix seconds', () => {
    const input: OHLCBucket[] = [{
      t: '2024-01-01T12:00:00Z',
      o: '1',
      h: '1',
      l: '1',
      c: '1',
      v: '1',
      fx: '0.1'
    }];
    
    const result = mapOHLCRows(input);
    
    // Unix timestamp should be in seconds, not milliseconds
    expect(result[0].time).toBe(Math.floor(new Date('2024-01-01T12:00:00Z').getTime() / 1000));
    expect(result[0].time).toBeGreaterThan(1700000000); // Sanity check (after 2023)
  });

  it('should handle empty input', () => {
    const result = mapOHLCRows([]);
    expect(result).toEqual([]);
  });

  it('should preserve FX rate per bucket', () => {
    const input: OHLCBucket[] = [
      { t: '2024-01-01T00:00:00Z', o: '1', h: '1', l: '1', c: '1', v: '1', fx: '0.09' },
      { t: '2024-01-02T00:00:00Z', o: '1', h: '1', l: '1', c: '1', v: '1', fx: '0.10' },
      { t: '2024-01-03T00:00:00Z', o: '1', h: '1', l: '1', c: '1', v: '1', fx: '0.11' }
    ];
    
    const result = mapOHLCRows(input);
    
    expect(result[0].fx).toBe(0.09);
    expect(result[1].fx).toBe(0.10);
    expect(result[2].fx).toBe(0.11);
  });
});
