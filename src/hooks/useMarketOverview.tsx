import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MarketOverviewData {
  total_market_cap_usd: number;
  total_volume_24h_usd: number;
  total_agents: number;
  graduated_agents: number;
  bonding_curve_agents: number;
  avg_price_change_24h: number;
  top_gainers: Array<{
    agent_id: string;
    name: string;
    symbol: string;
    price_change_24h: number;
    current_price: number;
    volume_24h: number;
  }>;
  top_by_volume: Array<{
    agent_id: string;
    name: string;
    symbol: string;
    volume_24h: number;
    current_price: number;
  }>;
}

export function useMarketOverview() {
  return useQuery({
    queryKey: ['market-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-market-overview', {
        body: {}
      });

      if (error) {
        console.error('Market overview fetch error:', error);
        throw error;
      }

      return data as MarketOverviewData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });
}
