import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isAgentGraduatedV3, isAgentMigratingV3 } from '@/lib/bondingCurveV3';

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
      setIsGraduated(isAgentGraduatedV3(agentData.prompt_raised));
      setIsMigrating(isAgentMigratingV3(agentData.prompt_raised, agentData.token_address));
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
          setIsGraduated(isAgentGraduatedV3(newData.prompt_raised));
          setIsMigrating(isAgentMigratingV3(newData.prompt_raised, newData.token_address));
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
          console.log('New buy trade detected, refreshing agent data');
          // Fetch fresh agent data when new trades occur
          const { data } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();
            
          if (data) {
            setAgentData(data);
            setIsGraduated(isAgentGraduatedV3(data.prompt_raised));
            setIsMigrating(isAgentMigratingV3(data.prompt_raised, data.token_address));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_token_sell_trades',
          filter: `agent_id=eq.${agentId}`
        },
        async (payload) => {
          console.log('New sell trade detected, refreshing agent data');
          // Fetch fresh agent data when new trades occur
          const { data } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .single();
            
          if (data) {
            setAgentData(data);
            setIsGraduated(isAgentGraduatedV3(data.prompt_raised));
            setIsMigrating(isAgentMigratingV3(data.prompt_raised, data.token_address));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(tradesChannel);
    };
  }, [agentId]); // Remove agentData dependency to prevent infinite loops

  return {
    agentData,
    isGraduated,
    isMigrating, // Phase 4: Migration state
    // Utility functions
    checkGraduation: (promptRaised: number) => isAgentGraduatedV3(promptRaised),
    checkMigration: (promptRaised: number, tokenAddress?: string | null) => 
      isAgentMigratingV3(promptRaised, tokenAddress)
  };
}