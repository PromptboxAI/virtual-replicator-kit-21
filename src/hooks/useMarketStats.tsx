import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppMode } from './useAppMode';

export interface MarketStats {
  totalMarketCap: number;
  activeAgents: number;
  totalVolume: number;
  totalHolders: number;
}

export function useMarketStats() {
  const { isTestMode } = useAppMode();
  const [stats, setStats] = useState<MarketStats>({
    totalMarketCap: 0,
    activeAgents: 0,
    totalVolume: 0,
    totalHolders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarketStats() {
      try {
        // Get market stats from agents
        const { data: marketData, error: marketError } = await supabase
          .from('agents')
          .select('id, market_cap, volume_24h')
          .eq('is_active', true)
          .eq('test_mode', isTestMode);

        if (marketError) throw marketError;

        // Count active agents
        const { count: agentCount, error: countError } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('test_mode', isTestMode);

        if (countError) throw countError;

        // Count total unique holders - need to join with agents to filter by test_mode
        const agentIds = marketData?.map(agent => agent.id) || [];
        let holdersCount = 0;
        
        if (agentIds.length > 0) {
          const { count, error: holdersError } = await supabase
            .from('user_agent_holdings')
            .select('user_id', { count: 'exact', head: true })
            .in('agent_id', agentIds);
          
          if (holdersError) throw holdersError;
          holdersCount = count || 0;
        }

        const totalMarketCap = marketData?.reduce((sum, agent) => sum + (agent.market_cap || 0), 0) || 0;
        const totalVolume = marketData?.reduce((sum, agent) => sum + (agent.volume_24h || 0), 0) || 0;

        setStats({
          totalMarketCap,
          activeAgents: agentCount || 0,
          totalVolume,
          totalHolders: holdersCount
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketStats();
  }, [isTestMode]);

  return { stats, loading, error };
}