import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LeaderboardType = 
  | 'market_cap' 
  | 'volume' 
  | 'gainers' 
  | 'losers' 
  | 'new' 
  | 'holders' 
  | 'graduated' 
  | 'trending' 
  | 'most_traded';

export type LeaderboardTimeframe = '1h' | '24h' | '7d' | '30d' | 'all_time';

export interface LeaderboardToken {
  id: string;
  symbol: string;
  name: string;
  avatar_url: string | null;
  current_price: number;
  market_cap: number;
  volume_24h: number;
  price_change_24h: number;
  token_holders: number;
  category: string | null;
  created_at: string;
  deployed_at: string | null;
  token_graduated: boolean;
  chain_id: number;
  trending_score?: number;
  tx_count?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LeaderboardFilters {
  type: LeaderboardType;
  timeframe: LeaderboardTimeframe;
  chainId: number | null;
  category: string | null;
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardToken[];
  pagination: PaginationInfo;
  filters: LeaderboardFilters;
  source: 'cache' | 'live';
}

export interface UseLeaderboardsOptions {
  type?: LeaderboardType;
  timeframe?: LeaderboardTimeframe;
  limit?: number;
  page?: number;
  category?: string | null;
  chainId?: number | null;
  enabled?: boolean;
}

export function useLeaderboards(options: UseLeaderboardsOptions = {}) {
  const {
    type = 'market_cap',
    timeframe = '24h',
    limit = 50,
    page = 1,
    category = null,
    chainId = null,
    enabled = true
  } = options;

  return useQuery({
    queryKey: ['leaderboards', type, timeframe, limit, page, category, chainId],
    queryFn: async (): Promise<LeaderboardResponse> => {
      const params = new URLSearchParams({
        type,
        timeframe,
        limit: limit.toString(),
        page: page.toString()
      });
      
      if (category) params.set('category', category);
      if (chainId) params.set('chainId', chainId.toString());

      const { data, error } = await supabase.functions.invoke('get-leaderboards', {
        body: null,
        headers: {},
      });

      // Use URL params approach via direct fetch for query params
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-leaderboards?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Leaderboards fetch failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leaderboards');
      }

      return result as LeaderboardResponse;
    },
    refetchInterval: 60000,
    staleTime: 30000,
    enabled
  });
}

export function useTrending(options: { limit?: number; chainId?: number | null; category?: string | null } = {}) {
  const { limit = 20, chainId = null, category = null } = options;

  return useQuery({
    queryKey: ['trending', limit, chainId, category],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (chainId) params.set('chainId', chainId.toString());
      if (category) params.set('category', category);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-trending?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Trending fetch failed: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 15000
  });
}

export function useNewListings(options: { hours?: number; limit?: number; page?: number; chainId?: number | null; category?: string | null } = {}) {
  const { hours = 24, limit = 50, page = 1, chainId = null, category = null } = options;

  return useQuery({
    queryKey: ['new-listings', hours, limit, page, chainId, category],
    queryFn: async () => {
      const params = new URLSearchParams({
        hours: hours.toString(),
        limit: limit.toString(),
        page: page.toString()
      });
      if (chainId) params.set('chainId', chainId.toString());
      if (category) params.set('category', category);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-new-listings?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`New listings fetch failed: ${response.statusText}`);
      }

      return response.json();
    },
    refetchInterval: 60000,
    staleTime: 30000
  });
}

// Legacy hook for backwards compatibility
export function useLegacyLeaderboards(limit: number = 10) {
  return useQuery({
    queryKey: ['leaderboards-legacy', limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-leaderboards', {
        body: { limit }
      });

      if (error) {
        console.error('Leaderboards fetch error:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
