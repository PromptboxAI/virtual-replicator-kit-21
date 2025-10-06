import { useState, useEffect } from 'react';
import { useAgentMetrics } from './useAgentMetrics';
import Big from 'big.js';

/**
 * Calculate market cap for agents in USD using centralized metrics
 * - Non-graduated: FDV (USD) = Price (USD) × Total Supply (1B tokens)
 * - Graduated: Market Cap (USD) = Price (USD) × Circulating Supply
 * 
 * @returns Market cap in USD (uses per-agent FX rate from metrics)
 */
export function useAgentFDV(agentId: string | undefined) {
  const { metrics, loading, error } = useAgentMetrics(agentId, 5000);
  const [marketCap, setMarketCap] = useState<number>(0);

  useEffect(() => {
    if (!metrics || loading) {
      setMarketCap(0);
      return;
    }

    try {
      const isGraduated = metrics.graduation.status === 'graduated';
      const supply = isGraduated 
        ? Big(metrics.supply.circulating) 
        : Big(metrics.supply.total);
      
      // Price is already in USD from metrics
      const priceUSD = Big(metrics.price.usd || 0);
      const cap = priceUSD.times(supply).toNumber();
      
      setMarketCap(cap);
    } catch (err) {
      console.error('Error calculating market cap:', err);
      setMarketCap(0);
    }
  }, [metrics, loading]);

  return marketCap;
}
