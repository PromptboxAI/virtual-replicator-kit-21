import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isAgentGraduated, isAgentMigrating } from '@/lib/bondingCurve';

interface AgentRealtimeData {
  id: string;
  prompt_raised: number;
  current_price: number;
  market_cap?: number;
  token_holders?: number;
  volume_24h?: number;
  token_address?: string | null; // Phase 4: Track token deployment status
}

/**
 * Hook for real-time agent data updates - Phase 3 implementation
 * Automatically syncs graduation status and market data
 */
export function useAgentRealtime(agentId: string, initialData?: AgentRealtimeData) {
  const [agentData, setAgentData] = useState<AgentRealtimeData | null>(initialData || null);
  const [isGraduated, setIsGraduated] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false); // Phase 4: Migration state

  useEffect(() => {
    if (!agentId) return;

    // Calculate initial graduation and migration status
    if (agentData) {
      setIsGraduated(isAgentGraduated(agentData.prompt_raised));
      setIsMigrating(isAgentMigrating(agentData.prompt_raised, agentData.token_address));
    }

    // Subscribe to real-time updates for this agent
    const channel = supabase
      .channel(`agent-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: `id=eq.${agentId}`
        },
        (payload) => {
          console.log('Real-time agent update:', payload);
          const newData = payload.new as AgentRealtimeData;
          
          setAgentData(newData);
          setIsGraduated(isAgentGraduated(newData.prompt_raised));
          setIsMigrating(isAgentMigrating(newData.prompt_raised, newData.token_address));
        }
      )
      .subscribe();

    // Subscribe to trade events for real-time volume updates
    const tradesChannel = supabase
      .channel(`agent-trades-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_token_buy_trades',
          filter: `agent_id=eq.${agentId}`
        },
        async (payload) => {
          console.log('New trade detected, refreshing agent data');
          // Fetch fresh agent data when new trades occur
          const { data } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();
            
          if (data) {
            setAgentData(data);
            setIsGraduated(isAgentGraduated(data.prompt_raised));
            setIsMigrating(isAgentMigrating(data.prompt_raised, data.token_address));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(tradesChannel);
    };
  }, [agentId, agentData]);

  return {
    agentData,
    isGraduated,
    isMigrating, // Phase 4: Migration state
    // Utility functions
    checkGraduation: (promptRaised: number) => isAgentGraduated(promptRaised),
    checkMigration: (promptRaised: number, tokenAddress?: string | null) => 
      isAgentMigrating(promptRaised, tokenAddress)
  };
}