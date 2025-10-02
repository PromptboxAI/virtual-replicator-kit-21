import { useState, useEffect } from 'react';
import { useAgentPrice } from './useAgentPrice';

/**
 * Calculate correct Fully Diluted Valuation (FDV) for agents
 * FDV = Current Price × Total Supply (1B tokens)
 * For V4 agents, uses dynamic RPC-calculated price
 */
export function useAgentFDV(agentId: string | undefined) {
  const currentPrice = useAgentPrice(agentId);
  const [fdv, setFdv] = useState<number>(0);

  const TOTAL_SUPPLY = 1_000_000_000; // 1 billion tokens

  useEffect(() => {
    if (!agentId || currentPrice === 0) {
      setFdv(0);
      return;
    }

    // FDV = current price × total supply
    const calculatedFdv = currentPrice * TOTAL_SUPPLY;
    setFdv(calculatedFdv);
  }, [agentId, currentPrice]);

  return fdv;
}
