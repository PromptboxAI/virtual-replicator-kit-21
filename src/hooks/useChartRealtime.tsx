import { useEffect, useCallback, useRef } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { formatEther, type Address } from 'viem';
import { supabase } from '@/integrations/supabase/client';
import { ChartDataService, OHLCVData } from '@/services/chartDataService';
import { V8_CONTRACTS, BONDING_CURVE_V8_ABI, uuidToBytes32 } from '@/lib/contractsV8';

interface UseChartRealtimeProps {
  agentId: string;
  onUpdate: (data: OHLCVData) => void;
  onPriceChange: (price: number) => void;
  enabled?: boolean;
  isV8?: boolean;
}

export const useChartRealtime = ({ 
  agentId, 
  onUpdate, 
  onPriceChange, 
  enabled = true,
  isV8 = false
}: UseChartRealtimeProps) => {
  const channelRef = useRef<any>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const publicClient = usePublicClient();

  // Fetch latest price from blockchain (for V8) or database (for others)
  const fetchLatestData = useCallback(async () => {
    // Throttle updates to prevent too many calls
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 500) return; // 500ms throttle for real-time
    lastUpdateTimeRef.current = now;

    try {
      if (isV8 && publicClient) {
        // V8: Read directly from blockchain
        const agentIdBytes32 = uuidToBytes32(agentId);
        
        const result = await publicClient.readContract({
          address: V8_CONTRACTS.BONDING_CURVE as Address,
          abi: BONDING_CURVE_V8_ABI,
          functionName: 'getAgentState',
          args: [agentIdBytes32],
        });

        const [, , tokensSold, promptReserve, currentPrice] = result as [string, string, bigint, bigint, bigint, bigint, boolean];
        
        const priceNum = Number(formatEther(currentPrice));
        const volumeNum = Number(formatEther(promptReserve));
        
        // Create OHLCV data point from current state
        const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
        const ohlcvData: OHLCVData = {
          time: timestamp,
          open: priceNum,
          high: priceNum,
          low: priceNum,
          close: priceNum,
          volume: volumeNum,
          tradeCount: 0,
        };
        
        onUpdate(ohlcvData);
        onPriceChange(priceNum);
      } else {
        // Non-V8: Fetch from database
        const latestData = await ChartDataService.getOHLCVData(
          agentId, 
          '1m',
          new Date(Date.now() - 5 * 60 * 1000),
          new Date()
        );
        
        if (latestData && latestData.length > 0) {
          const latest = latestData[latestData.length - 1];
          onUpdate(latest);
          onPriceChange(latest.close);
        }
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [agentId, onUpdate, onPriceChange, isV8, publicClient]);

  // V8: Watch blockchain Trade events for instant updates
  useWatchContractEvent({
    address: V8_CONTRACTS.BONDING_CURVE as Address,
    abi: BONDING_CURVE_V8_ABI,
    eventName: 'Trade',
    enabled: enabled && isV8 && !!agentId,
    onLogs: (logs) => {
      const agentIdBytes32 = uuidToBytes32(agentId);
      
      for (const log of logs) {
        const logAgentId = (log.args as any)?.agentId;
        if (logAgentId === agentIdBytes32) {
          console.log('[useChartRealtime] V8 Trade event detected, updating chart');
          
          // Extract price directly from event
          const price = (log.args as any)?.price;
          const tokenAmount = (log.args as any)?.tokenAmount;
          
          if (price) {
            const priceNum = Number(formatEther(price));
            const volumeNum = tokenAmount ? Number(formatEther(tokenAmount)) : 0;
            
            const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
            const ohlcvData: OHLCVData = {
              time: timestamp,
              open: priceNum,
              high: priceNum,
              low: priceNum,
              close: priceNum,
              volume: volumeNum,
              tradeCount: 1,
            };
            
            onUpdate(ohlcvData);
            onPriceChange(priceNum);
          }
          break;
        }
      }
    },
  });

  // Non-V8: Use Supabase realtime for database-backed agents
  useEffect(() => {
    if (!enabled || !agentId || isV8) return;

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
        () => fetchLatestData()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_token_sell_trades',
          filter: `agent_id=eq.${agentId}`
        },
        () => fetchLatestData()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: `id=eq.${agentId}`
        },
        () => fetchLatestData()
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [agentId, enabled, isV8, fetchLatestData]);

  return {
    isConnected: isV8 ? true : channelRef.current?.state === 'joined',
    refetch: fetchLatestData,
  };
};