import { useEffect, useState } from 'react';
import { useAgentMetrics } from './useAgentMetrics';
import { Units } from '@/lib/units';
import Big from 'big.js';

/**
 * Unified Price Consistency Hook
 * Ensures all price displays across the platform use consistent data sources
 */
export function usePriceConsistency(agentId: string | undefined) {
  const { metrics, loading, error } = useAgentMetrics(agentId);
  const [priceData, setPriceData] = useState<{
    promptPrice: string;
    usdPrice: string;
    fx: string;
    formatted: {
      usd: string;
      prompt: string;
      tooltip: string;
    };
  } | null>(null);

  useEffect(() => {
    if (!metrics?.price) {
      setPriceData(null);
      return;
    }

    const { prompt, fx } = metrics.price;
    
    if (!prompt || !fx) {
      setPriceData(null);
      return;
    }

    // Calculate USD price
    const usdPrice = Units.toDisplay(prompt, fx, 'USD');

    setPriceData({
      promptPrice: prompt,
      usdPrice,
      fx,
      formatted: {
        usd: Units.formatPrice(usdPrice, 'USD'),
        prompt: Units.formatPrice(prompt, 'PROMPT'),
        tooltip: Units.formatTooltip(prompt, fx)
      }
    });
  }, [metrics]);

  return {
    priceData,
    loading,
    error,
    metrics
  };
}
