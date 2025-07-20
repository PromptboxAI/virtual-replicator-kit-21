import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isAgentGraduated } from '@/lib/bondingCurve';

interface AgentRealtimeData {
  id: string;
  prompt_raised: number;
  current_price: number;
  market_cap?: number;
  token_holders?: number;
  volume_24h?: number;
}

/**
 * Hook for real-time agent data updates - Phase 3 implementation
 * Automatically syncs graduation status and market data
 */
export function useAgentRealtime(agentId: string, initialData?: AgentRealtimeData) {
  const [agentData, setAgentData] = useState<AgentRealtimeData | null>(initialData || null);
  const [isGraduated, setIsGraduated] = useState(false);

  useEffect(() => {
    if (!agentId) return;

    // Calculate initial graduation status
    if (agentData) {
      setIsGraduated(isAgentGraduated(agentData.prompt_raised));
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, agentData]);

  return {
    agentData,
    isGraduated,
    // Utility function to check graduation status from any prompt_raised value
    checkGraduation: (promptRaised: number) => isAgentGraduated(promptRaised)
  };
}