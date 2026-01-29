import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface OnChainTrade {
  id: string;
  agent_id: string;
  transaction_hash: string;
  block_number: number;
  block_timestamp?: string;
  trader_address: string;
  is_buy: boolean;
  prompt_amount_gross: number;
  prompt_amount_net: number;
  token_amount: number;
  fee: number;
  price: number;
  supply_after: number;
  reserve_after: number;
  created_at: string;
}

interface UseRealtimeTradesOptions {
  limit?: number;
  onNewTrade?: (trade: OnChainTrade) => void;
}

/**
 * Hook for real-time on-chain trade updates via Supabase Realtime
 * Subscribes to INSERT events on on_chain_trades table
 */
export function useRealtimeTrades(
  agentId: string | undefined,
  options: UseRealtimeTradesOptions = {}
) {
  const { limit = 50, onNewTrade } = options;
  const [trades, setTrades] = useState<OnChainTrade[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial trades
  const fetchInitialTrades = useCallback(async () => {
    if (!agentId) return;

    const { data, error } = await supabase
      .from('on_chain_trades')
      .select('*')
      .eq('agent_id', agentId)
      .order('block_number', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[useRealtimeTrades] Error fetching initial trades:', error);
      return;
    }

    if (data) {
      setTrades(data as OnChainTrade[]);
    }
  }, [agentId, limit]);

  useEffect(() => {
    if (!agentId) return;

    // Fetch initial data
    fetchInitialTrades();

    // Subscribe to new trades for this agent
    const channel = supabase
      .channel(`on-chain-trades:${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'on_chain_trades',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload: RealtimePostgresChangesPayload<OnChainTrade>) => {
          console.log('[Realtime] New on-chain trade:', payload.new);
          const newTrade = payload.new as OnChainTrade;
          
          setTrades(prev => {
            // Avoid duplicates
            if (prev.some(t => t.transaction_hash === newTrade.transaction_hash)) {
              return prev;
            }
            return [newTrade, ...prev].slice(0, limit);
          });

          // Call callback if provided
          if (onNewTrade) {
            onNewTrade(newTrade);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('[Realtime] Unsubscribing from trades channel');
      supabase.removeChannel(channel);
    };
  }, [agentId, limit, onNewTrade, fetchInitialTrades]);

  return {
    trades,
    isConnected,
    refetch: fetchInitialTrades,
  };
}
