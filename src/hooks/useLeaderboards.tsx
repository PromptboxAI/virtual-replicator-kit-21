import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardAgent {
  agent_id: string;
  name: string;
  symbol: string;
  rank: number;
  value: number;
  change_24h?: number;
}

interface LeaderboardsData {
  top_by_market_cap: LeaderboardAgent[];
  top_by_volume: LeaderboardAgent[];
  top_gainers: LeaderboardAgent[];
  top_losers: LeaderboardAgent[];
  most_traded: LeaderboardAgent[];
}

export function useLeaderboards(limit: number = 10) {
  return useQuery({
    queryKey: ['leaderboards', limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-leaderboards', {
        body: { limit }
      });

      if (error) {
        console.error('Leaderboards fetch error:', error);
        throw error;
      }

      return data as LeaderboardsData;
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}
