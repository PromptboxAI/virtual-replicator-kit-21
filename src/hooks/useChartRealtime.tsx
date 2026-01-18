import { useEffect, useCallback, useRef, useState } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { formatEther, type Address } from 'viem';
import { supabase } from '@/integrations/supabase/client';
import { ChartDataService, OHLCVData } from '@/services/chartDataService';
import { V8_CONTRACTS, BONDING_CURVE_V8_ABI, uuidToBytes32 } from '@/lib/contractsV8';

export interface LiveCandle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isLive: true;
}

export type ChartInterval = '1' | '5' | '15' | '60' | '240' | '1D';

interface UseChartRealtimeProps {
  agentId: string;
  onUpdate: (data: OHLCVData) => void;
  onLiveCandleUpdate?: (candle: LiveCandle) => void;
  onPriceChange: (price: number) => void;
  enabled?: boolean;
  isV8?: boolean;
  interval?: ChartInterval;
}

// Get interval duration in seconds
const getIntervalSeconds = (interval: ChartInterval): number => {
  switch (interval) {
    case '1': return 60;
    case '5': return 300;
    case '15': return 900;
    case '60': return 3600;
    case '240': return 14400;
    case '1D': return 86400;
    default: return 300;
  }
};

// Get the bucket start time for a given timestamp
const getBucketStartTime = (timestamp: number, intervalSeconds: number): number => {
  return Math.floor(timestamp / intervalSeconds) * intervalSeconds;
};

export const useChartRealtime = ({ 
  agentId, 
  onUpdate, 
  onLiveCandleUpdate,
  onPriceChange, 
  enabled = true,
  isV8 = false,
  interval = '5'
}: UseChartRealtimeProps) => {
  const channelRef = useRef<any>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const publicClient = usePublicClient();
  
  // Live candle state for V8 real-time updates
  const [liveCandle, setLiveCandle] = useState<LiveCandle | null>(null);
  const liveCandleRef = useRef<LiveCandle | null>(null);

  // Update live candle with a new trade
  const updateLiveCandle = useCallback((price: number, volume: number) => {
    const now = Math.floor(Date.now() / 1000);
    const intervalSeconds = getIntervalSeconds(interval);
    const bucketStart = getBucketStartTime(now, intervalSeconds);
    
    setLiveCandle(prev => {
      let newCandle: LiveCandle;
      
      // Check if we need to start a new candle (new bucket)
      if (!prev || prev.time !== bucketStart) {
        // Start a new candle
        newCandle = {
          time: bucketStart,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: volume,
          isLive: true,
        };
      } else {
        // Update existing candle
        newCandle = {
          ...prev,
          high: Math.max(prev.high, price),
          low: Math.min(prev.low, price),
          close: price,
          volume: prev.volume + volume,
        };
      }
      
      // Store in ref for immediate access
      liveCandleRef.current = newCandle;
      
      // Notify parent of live candle update
      if (onLiveCandleUpdate) {
        onLiveCandleUpdate(newCandle);
      }
      
      return newCandle;
    });
  }, [interval, onLiveCandleUpdate]);

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
        
        // Update live candle with current state
        updateLiveCandle(priceNum, 0); // Volume is cumulative, not incremental here
        
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
  }, [agentId, onUpdate, onPriceChange, isV8, publicClient, updateLiveCandle]);

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
          console.log('[useChartRealtime] V8 Trade event detected, updating chart in real-time');
          
          // Extract price and token amount directly from event
          const price = (log.args as any)?.price;
          const tokenAmount = (log.args as any)?.tokenAmount;
          
          if (price) {
            const priceNum = Number(formatEther(price));
            const volumeNum = tokenAmount ? Number(formatEther(tokenAmount)) : 0;
            
            // Update live candle with trade data
            updateLiveCandle(priceNum, volumeNum);
            
            // Update current price display
            onPriceChange(priceNum);
            
            // Also emit OHLCV data for compatibility
            const timestamp = Math.floor(Date.now() / 1000);
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
    liveCandle,
    refetch: fetchLatestData,
  };
};
