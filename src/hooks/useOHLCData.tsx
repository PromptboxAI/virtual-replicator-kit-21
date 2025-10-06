import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Big from 'big.js';

export interface OHLCBucket {
  t: string;      // ISO-8601 timestamp
  o: string;      // open price in PROMPT
  h: string;      // high price in PROMPT
  l: string;      // low price in PROMPT
  c: string;      // close price in PROMPT
  v: string;      // volume in agent tokens
  fx: string;     // FX rate (PROMPT to USD) at bucket time
}

export interface OHLCData {
  agentId: string;
  timeframe: string;
  buckets: OHLCBucket[];
  count: number;
}

/**
 * Hook for fetching OHLC data with per-bucket FX rates
 * Converts PROMPT prices to USD using the FX rate from trade time
 */
export function useOHLCData(
  agentId: string | undefined,
  timeframe: string = '1h',
  limit: number = 100,
  pollingInterval: number = 10000
) {
  const [data, setData] = useState<OHLCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchOHLC = async () => {
      try {
        const { data: responseData, error: fetchError } = await supabase.functions.invoke(
          'get-ohlc',
          {
            body: { agentId, timeframe, limit }
          }
        );

        console.log('OHLC fetch response:', { responseData, fetchError });

        if (fetchError) {
          console.error('Error fetching OHLC data:', fetchError);
          setError(fetchError.message);
          return;
        }

        setData(responseData);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch OHLC data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchOHLC();

    // Set up polling
    const interval = setInterval(fetchOHLC, pollingInterval);

    return () => clearInterval(interval);
  }, [agentId, timeframe, limit, pollingInterval]);

  /**
   * Convert a bucket from PROMPT to USD using its FX rate
   */
  const convertToUSD = (bucket: OHLCBucket) => {
    const fx = Big(bucket.fx);
    return {
      time: bucket.t,
      open: Big(bucket.o).times(fx).toNumber(),
      high: Big(bucket.h).times(fx).toNumber(),
      low: Big(bucket.l).times(fx).toNumber(),
      close: Big(bucket.c).times(fx).toNumber(),
      volume: Big(bucket.v).toNumber(),
    };
  };

  /**
   * Get buckets in USD (converted with per-bucket FX)
   */
  const bucketsUSD = data?.buckets.map(convertToUSD) || [];

  return {
    data,
    bucketsUSD,
    loading,
    error,
    convertToUSD
  };
}
