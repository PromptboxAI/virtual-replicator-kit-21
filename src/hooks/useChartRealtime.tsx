import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChartDataService, OHLCVData, ChartInterval } from '@/services/chartDataService';

interface UseChartRealtimeProps {
  agentId: string;
  onUpdate: (data: OHLCVData) => void;
  onPriceChange: (price: number) => void;
  enabled?: boolean;
}

export const useChartRealtime = ({ 
  agentId, 
  onUpdate, 
  onPriceChange, 
  enabled = true 
}: UseChartRealtimeProps) => {
  const channelRef = useRef<any>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const handleTradeUpdate = useCallback(async (payload: any, tradeType: 'buy' | 'sell') => {
    console.log(`New ${tradeType} trade for real-time chart update:`, payload);
    
    // Throttle updates to prevent too many calls
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 100) return;
    lastUpdateTimeRef.current = now;

    try {
      // Get latest data point efficiently
      const { data } = await ChartDataService.getChartData(agentId, '1' as ChartInterval,
        new Date(Date.now() - 60 * 60 * 1000), // Last hour
        new Date()
      );
      
      if (data.length > 0) {
        const latestData = data[data.length - 1];
        onUpdate(latestData);
        onPriceChange(latestData.close);
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [agentId, onUpdate, onPriceChange]);

  const handleAgentUpdate = useCallback(async (payload: any) => {
    console.log('Agent updated for real-time chart update:', payload);
    
    // Handle agent status changes (like graduation)
    if (payload.new?.graduated !== payload.old?.graduated ||
        payload.new?.current_price !== payload.old?.current_price) {
      
      try {
        const { data } = await ChartDataService.getChartData(agentId);
        if (data.length > 0) {
          const latestData = data[data.length - 1];
          onUpdate(latestData);
          onPriceChange(latestData.close);
        }
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    }
  }, [agentId, onUpdate, onPriceChange]);

  useEffect(() => {
    if (!enabled || !agentId) return;

    const channel = supabase
      .channel(`enhanced-chart-updates-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_token_buy_trades',
          filter: `agent_id=eq.${agentId}`
        },
        (payload) => handleTradeUpdate(payload, 'buy')
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_token_sell_trades',
          filter: `agent_id=eq.${agentId}`
        },
        (payload) => handleTradeUpdate(payload, 'sell')
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: `id=eq.${agentId}`
        },
        handleAgentUpdate
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [agentId, enabled, handleTradeUpdate, handleAgentUpdate]);

  return {
    isConnected: channelRef.current?.state === 'joined'
  };
};