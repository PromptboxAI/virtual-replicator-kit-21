import { useState, useEffect } from 'react';
import { useAgentPrice } from './useAgentPrice';
import { supabase } from '@/integrations/supabase/client';

/**
 * Calculate market cap for agents
 * - Non-graduated: Circulating Market Cap = Current Price × Tokens Sold
 * - Graduated: FDV = Current Price × Total Supply (1B tokens)
 * For V4 agents, uses dynamic RPC-calculated price
 */
export function useAgentFDV(agentId: string | undefined) {
  const currentPrice = useAgentPrice(agentId);
  const [marketCap, setMarketCap] = useState<number>(0);

  const TOTAL_SUPPLY = 1_000_000_000; // 1 billion tokens

  useEffect(() => {
    if (!agentId || currentPrice === 0) {
      setMarketCap(0);
      return;
    }

    const fetchMarketCap = async () => {
      const { data: agent } = await supabase
        .from('agents')
        .select('token_graduated, bonding_curve_supply')
        .eq('id', agentId)
        .single();

      if (!agent) {
        setMarketCap(0);
        return;
      }

      if (agent.token_graduated) {
        // Graduated: Use FDV
        setMarketCap(currentPrice * TOTAL_SUPPLY);
      } else {
        // Non-graduated: Use circulating market cap
        const tokensSold = agent.bonding_curve_supply || 0;
        setMarketCap(currentPrice * tokensSold);
      }
    };

    fetchMarketCap();
  }, [agentId, currentPrice]);

  return marketCap;
}
