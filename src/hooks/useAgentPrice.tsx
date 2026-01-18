import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePublicClient } from 'wagmi';
import { formatEther, type Address } from 'viem';
import { V8_CONTRACTS, BONDING_CURVE_V8_ABI, uuidToBytes32 } from '@/lib/contractsV8';

/**
 * Centralized hook for fetching agent prices with auto-polling
 * 
 * For V8 agents: Reads directly from blockchain (millisecond accuracy)
 * For V4 agents: Uses RPC function
 * For legacy agents: Uses stored current_price
 * 
 * Polls every 2 seconds for database-backed models, uses event watching for V8
 */
export function useAgentPrice(agentId: string | undefined) {
  const [price, setPrice] = useState<number>(0);
  const [isV8, setIsV8] = useState<boolean>(false);
  const publicClient = usePublicClient();

  // Fetch V8 price directly from blockchain
  const fetchV8Price = useCallback(async () => {
    if (!publicClient || !agentId) return null;
    
    try {
      const agentIdBytes32 = uuidToBytes32(agentId);
      
      const result = await publicClient.readContract({
        address: V8_CONTRACTS.BONDING_CURVE as Address,
        abi: BONDING_CURVE_V8_ABI,
        functionName: 'getAgentState',
        args: [agentIdBytes32],
      });

      const [, , , , currentPrice] = result as [string, string, bigint, bigint, bigint, bigint, boolean];
      return Number(formatEther(currentPrice));
    } catch (err) {
      console.error('[useAgentPrice] V8 blockchain read error:', err);
      return null;
    }
  }, [publicClient, agentId]);

  useEffect(() => {
    if (!agentId) {
      setPrice(0);
      return;
    }

    const fetchPrice = async () => {
      try {
        // First, get the agent's pricing model and V8 status
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('pricing_model, current_price, is_v8, prototype_token_address')
          .eq('id', agentId)
          .single();

        if (agentError) throw agentError;

        // V8 agents: Read directly from blockchain
        if (agent?.is_v8 || agent?.prototype_token_address) {
          setIsV8(true);
          const blockchainPrice = await fetchV8Price();
          if (blockchainPrice !== null) {
            setPrice(blockchainPrice);
          } else {
            // Fallback to database if blockchain read fails
            setPrice(agent?.current_price || 0);
          }
        }
        // V4 agents: Use RPC function
        else if (agent?.pricing_model === 'linear_v4') {
          setIsV8(false);
          const { data: calculatedPrice, error: priceError } = await supabase.rpc(
            'get_agent_current_price_v4',
            { p_agent_id: agentId }
          );

          if (priceError) throw priceError;
          setPrice(calculatedPrice ? parseFloat(calculatedPrice) : 0);
        } 
        // Legacy agents: Use stored current_price
        else {
          setIsV8(false);
          setPrice(agent?.current_price || 0);
        }
      } catch (err: any) {
        console.error('Error fetching agent price:', err);
        setPrice(0);
      }
    };

    // Fetch immediately
    fetchPrice();
    
    // Poll interval: faster for V8 (500ms), slower for database-backed (2s)
    const pollInterval = isV8 ? 500 : 2000;
    const interval = setInterval(fetchPrice, pollInterval);
    
    return () => clearInterval(interval);
  }, [agentId, fetchV8Price, isV8]);

  return price;
}
