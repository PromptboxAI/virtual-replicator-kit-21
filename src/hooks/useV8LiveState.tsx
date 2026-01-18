import { useEffect, useState, useCallback } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { formatEther, type Address } from 'viem';
import { V8_CONTRACTS, BONDING_CURVE_V8_ABI, uuidToBytes32 } from '@/lib/contractsV8';

export interface V8LiveState {
  prototypeToken: string;
  creator: string;
  tokensSold: number;
  promptReserve: number;
  currentPrice: number;
  graduationProgress: number;
  graduated: boolean;
  lastUpdated: number;
}

interface UseV8LiveStateOptions {
  /** Polling interval in ms (default: disabled, uses events) */
  pollingInterval?: number;
  /** Enable real-time event watching */
  watchEvents?: boolean;
}

/**
 * Hook to read V8 agent state directly from blockchain.
 * Provides millisecond-level updates via event watching or configurable polling.
 * 
 * This is the source of truth for trading - NOT the database.
 */
export function useV8LiveState(
  agentId: string | undefined,
  options: UseV8LiveStateOptions = {}
) {
  const { pollingInterval, watchEvents = true } = options;
  const publicClient = usePublicClient();
  
  const [state, setState] = useState<V8LiveState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchState = useCallback(async () => {
    if (!publicClient || !agentId) return;

    try {
      const agentIdBytes32 = uuidToBytes32(agentId);
      
      const result = await publicClient.readContract({
        address: V8_CONTRACTS.BONDING_CURVE as Address,
        abi: BONDING_CURVE_V8_ABI,
        functionName: 'getAgentState',
        args: [agentIdBytes32],
      });

      const [
        prototypeToken,
        creator,
        tokensSold,
        promptReserve,
        currentPrice,
        graduationProgress,
        graduated
      ] = result as [string, string, bigint, bigint, bigint, bigint, boolean];

      setState({
        prototypeToken,
        creator,
        tokensSold: Number(formatEther(tokensSold)),
        promptReserve: Number(formatEther(promptReserve)),
        currentPrice: Number(formatEther(currentPrice)),
        graduationProgress: Number(graduationProgress) / 100, // Convert basis points to percentage
        graduated,
        lastUpdated: Date.now(),
      });
      
      setError(null);
    } catch (err) {
      console.error('[useV8LiveState] Error fetching state:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, agentId]);

  // Initial fetch
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Optional polling (fallback if events don't work)
  useEffect(() => {
    if (!pollingInterval) return;
    
    const interval = setInterval(fetchState, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchState, pollingInterval]);

  // Watch Trade events for instant updates
  useWatchContractEvent({
    address: V8_CONTRACTS.BONDING_CURVE as Address,
    abi: BONDING_CURVE_V8_ABI,
    eventName: 'Trade',
    enabled: watchEvents && !!agentId,
    onLogs: (logs) => {
      // Check if any log is for our agent
      const agentIdBytes32 = agentId ? uuidToBytes32(agentId) : null;
      
      for (const log of logs) {
        const logAgentId = (log.args as any)?.agentId;
        if (logAgentId === agentIdBytes32) {
          console.log('[useV8LiveState] Trade event detected, refreshing state');
          // Re-fetch state immediately after trade
          fetchState();
          break;
        }
      }
    },
  });

  return {
    state,
    isLoading,
    error,
    refetch: fetchState,
  };
}

/**
 * Simpler hook that just returns the current price from blockchain.
 * Use this for price displays that need real-time accuracy.
 */
export function useV8LivePrice(agentId: string | undefined) {
  const { state, isLoading, error, refetch } = useV8LiveState(agentId);
  
  return {
    price: state?.currentPrice ?? null,
    supply: state?.tokensSold ?? null,
    reserve: state?.promptReserve ?? null,
    graduated: state?.graduated ?? false,
    graduationProgress: state?.graduationProgress ?? 0,
    isLoading,
    error,
    refetch,
  };
}
