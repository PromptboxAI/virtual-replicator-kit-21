import { useState, useEffect } from 'react';
import { useAgentPrice } from './useAgentPrice';
import { supabase } from '@/integrations/supabase/client';
import { PROMPT_USD_RATE } from '@/lib/formatters';

/**
 * Calculate market cap for agents in USD
 * - Non-graduated: Circulating Market Cap (USD) = Token Price (USD) × Tokens Sold
 * - Graduated: FDV (USD) = Token Price (USD) × Total Supply (1B tokens)
 * 
 * @returns Market cap in USD (already converted from PROMPT)
 * For V4 agents, uses dynamic RPC-calculated price
 */
export function useAgentFDV(agentId: string | undefined) {
  const currentPrice = useAgentPrice(agentId); // Price in PROMPT
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

      // Convert PROMPT price to USD price BEFORE calculating market cap
      const priceInUSD = currentPrice * PROMPT_USD_RATE;

      if (agent.token_graduated) {
        // Graduated: Use FDV in USD
        setMarketCap(priceInUSD * TOTAL_SUPPLY);
      } else {
        // Non-graduated: Use circulating market cap in USD
        const tokensSold = agent.bonding_curve_supply || 0;
        setMarketCap(priceInUSD * tokensSold);
      }
    };

    fetchMarketCap();
  }, [agentId, currentPrice]);

  return marketCap;
}
