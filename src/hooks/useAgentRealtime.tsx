import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isAgentGraduatedV3, isAgentMigratingV3 } from '@/lib/bondingCurveV3';

interface AgentRealtimeData {
  id: string;
  prompt_raised: number;
  current_price: number;
  market_cap?: number;
  token_holders?: number;
  volume_24h?: number;
  token_address?: string | null;
  on_chain_price?: number;
  on_chain_supply?: number;
  on_chain_reserve?: number;
  circulating_supply?: number;
}

interface OnChainTrade {
  agent_id: string;
  is_buy: boolean;
  price: string;
  token_amount: string;
  prompt_amount_net: string;
}

/**
 * Hook for real-time agent data updates with on-chain trade sync
 * Subscribes to both agents table updates and on_chain_trades inserts
 */
export function useAgentRealtime(agentId: string, initialData?: AgentRealtimeData) {
  const [agentData, setAgentData] = useState<AgentRealtimeData | null>(initialData || null);
  const [isGraduated, setIsGraduated] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [lastTrade, setLastTrade] = useState<OnChainTrade | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch fresh agent data
  const refreshAgentData = useCallback(async () => {
    if (!agentId) return;
    
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
  }, [agentId]);

  useEffect(() => {
    if (!agentId) return;

    // Calculate initial graduation and migration status
    if (agentData) {
      setIsGraduated(isAgentGraduatedV3(agentData.prompt_raised));
      setIsMigrating(isAgentMigratingV3(agentData.prompt_raised, agentData.token_address));
    }

    // Subscribe to real-time updates for this agent
    const agentChannel = supabase
      .channel(`agent-realtime-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: `id=eq.${agentId}`
        },
        (payload) => {
          console.log('[Realtime] Agent updated:', payload.new);
          const newData = payload.new as AgentRealtimeData;
          
          setAgentData(newData);
          setIsGraduated(isAgentGraduatedV3(newData.prompt_raised));
          setIsMigrating(isAgentMigratingV3(newData.prompt_raised, newData.token_address));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to on-chain trades (new V8 trade table)
    const onChainTradesChannel = supabase
      .channel(`on-chain-trades-agent-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'on_chain_trades',
          filter: `agent_id=eq.${agentId}`
        },
        async (payload) => {
          console.log('[Realtime] New on-chain trade:', payload.new);
          setLastTrade(payload.new as OnChainTrade);
          
          // Refresh agent data to get updated price/supply
          await refreshAgentData();
        }
      )
      .subscribe();

    // Also subscribe to legacy trade tables for backwards compatibility
    const legacyTradesChannel = supabase
      .channel(`legacy-trades-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_token_buy_trades',
          filter: `agent_id=eq.${agentId}`
        },
        async () => {
          console.log('[Realtime] Legacy buy trade detected');
          await refreshAgentData();
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
        async () => {
          console.log('[Realtime] Legacy sell trade detected');
          await refreshAgentData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(onChainTradesChannel);
      supabase.removeChannel(legacyTradesChannel);
    };
  }, [agentId, refreshAgentData]);

  return {
    agentData,
    isGraduated,
    isMigrating,
    lastTrade,
    isConnected,
    refreshAgentData,
    // Utility functions
    checkGraduation: (promptRaised: number) => isAgentGraduatedV3(promptRaised),
    checkMigration: (promptRaised: number, tokenAddress?: string | null) => 
      isAgentMigratingV3(promptRaised, tokenAddress)
  };
}