import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized hook for fetching agent prices with auto-polling
 * Automatically uses the correct pricing function based on agent's pricing_model
 * Polls every 2 seconds to keep price updated
 */
export function useAgentPrice(agentId: string | undefined) {
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    if (!agentId) {
      setPrice(0);
      return;
    }

    const fetchPrice = async () => {
      try {
        // First, get the agent's pricing model
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('pricing_model, current_price')
          .eq('id', agentId)
          .single();

        if (agentError) throw agentError;

        // Use the appropriate pricing function based on pricing_model
        if (agent?.pricing_model === 'linear_v4') {
          // Always use RPC for V4 agents
          const { data: calculatedPrice, error: priceError } = await supabase.rpc(
            'get_agent_current_price_v4',
            { p_agent_id: agentId }
          );

          if (priceError) throw priceError;
          setPrice(calculatedPrice || 0);
        } else {
          // For legacy agents (V3 and earlier), use the stored current_price
          setPrice(agent?.current_price || 0);
        }
      } catch (err: any) {
        console.error('Error fetching agent price:', err);
        setPrice(0);
      }
    };

    // Fetch immediately
    fetchPrice();
    
    // Then poll every 2 seconds
    const interval = setInterval(fetchPrice, 2000);
    
    return () => clearInterval(interval);
  }, [agentId]);

  return price;
}
