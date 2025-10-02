import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized hook for fetching agent prices
 * Automatically uses the correct pricing function based on agent's pricing_model
 */
export function useAgentPrice(agentId: string | undefined) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setPrice(null);
      setLoading(false);
      return;
    }

    fetchPrice();
  }, [agentId]);

  const fetchPrice = async () => {
    if (!agentId) return;

    setLoading(true);
    setError(null);

    try {
      // First, get the agent's pricing model
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('pricing_model, current_price')
        .eq('id', agentId)
        .single();

      if (agentError) throw agentError;

      // Use the appropriate pricing function based on pricing_model
      if (agent.pricing_model === 'linear_v4') {
        // Use V4 pricing function
        const { data: calculatedPrice, error: priceError } = await supabase.rpc(
          'get_agent_current_price_v4',
          { p_agent_id: agentId }
        );

        if (priceError) throw priceError;
        setPrice(calculatedPrice);
      } else {
        // For legacy agents (V3 and earlier), use the stored current_price
        setPrice(agent.current_price);
      }
    } catch (err: any) {
      console.error('Error fetching agent price:', err);
      setError(err.message);
      setPrice(null);
    } finally {
      setLoading(false);
    }
  };

  return { price, loading, error, refetch: fetchPrice };
}
