import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Big from 'big.js';

export interface OHLCCandle {
  bucket_time: string;
  open_prompt: string;
  high_prompt: string;
  low_prompt: string;
  close_prompt: string;
  volume_agent: string;
  fx_rate: string;
}

export interface OHLCData {
  agentId: string;
  timeframe: string;
  candles: OHLCCandle[];
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
   * Convert a candle from PROMPT to USD using its bucket's FX rate
   */
  const convertToUSD = (candle: OHLCCandle) => {
    const fx = Big(candle.fx_rate);
    return {
      time: candle.bucket_time,
      open: Big(candle.open_prompt).times(fx).toNumber(),
      high: Big(candle.high_prompt).times(fx).toNumber(),
      low: Big(candle.low_prompt).times(fx).toNumber(),
      close: Big(candle.close_prompt).times(fx).toNumber(),
      volume: Big(candle.volume_agent).toNumber(),
    };
  };

  /**
   * Get candles in USD (converted with per-bucket FX)
   */
  const candlesUSD = data?.candles.map(convertToUSD) || [];

  return {
    data,
    candlesUSD,
    loading,
    error,
    convertToUSD
  };
}
