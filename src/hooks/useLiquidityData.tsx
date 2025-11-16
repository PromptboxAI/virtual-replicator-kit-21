import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LiquidityData {
  agent_id: string;
  total_prompt_reserves: number;
  total_token_reserves: number;
  total_liquidity_usd: number;
  buy_pressure: number;
  sell_pressure: number;
  net_flow: number;
  price_impact_1k_usd: number;
  price_impact_10k_usd: number;
  depth_analysis: {
    bid_depth_5pct: number;
    ask_depth_5pct: number;
    spread_bps: number;
  };
}

export function useLiquidityData(agentId: string | undefined) {
  return useQuery({
    queryKey: ['liquidity', agentId],
    queryFn: async () => {
      if (!agentId) return null;

      const { data, error } = await supabase.functions.invoke('get-liquidity', {
        body: { agent_id: agentId }
      });

      if (error) {
        console.error('Liquidity fetch error:', error);
        throw error;
      }

      return data as LiquidityData;
    },
    enabled: !!agentId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
  });
}
