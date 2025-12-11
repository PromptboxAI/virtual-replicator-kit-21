import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgentMetrics {
  agentId: string;
  price: {
    prompt: string;
    usd: string | null;
    fx: string;
    fx_staleness_seconds: number;
  };
  supply: {
    total: string;
    circulating: string;
    policy: 'FDV' | 'CIRCULATING';
  };
  fdv: {
    prompt: string;
    usd: string | null;
  };
  marketCap: {
    prompt: string;
    usd: string | null;
  };
  graduation: {
    status: 'pre_grad' | 'graduated';
    policy: string;
    met: {
      usd_raised_total: number;
      prompt_raised_total: number;
      tokens_sold: number;
      price_usd: number;
      fdv_usd: number;
    };
    thresholds: {
      logic: 'ANY' | 'ALL';
      rules: Array<{
        metric: string;
        op: string;
        value: number;
      }>;
    };
  };
  updatedAt: string;
}

/**
 * Unified hook for fetching agent metrics from the centralized edge function
 * @param agentId - Agent UUID
 * @param pollingInterval - Auto-refresh interval in ms (default: 5000)
 */
export function useAgentMetrics(agentId: string | undefined, pollingInterval = 5000) {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        const { data, error: fetchError } = await supabase.functions.invoke(
          'get-agent-metrics',
          { body: { agentId } }
        );

        if (fetchError) {
          console.error('Error fetching agent metrics:', fetchError);
          setError(fetchError.message);
          setMetrics(null);
          return;
        }

        // Handle case where edge function returns an error in the data
        if (data?.error) {
          console.warn('Agent metrics not available:', data.error);
          setMetrics(null);
          setError(null); // Not a fatal error, just no data
          return;
        }

        setMetrics(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch agent metrics:', err);
        setError(err.message);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up polling
    const interval = setInterval(fetchMetrics, pollingInterval);

    return () => clearInterval(interval);
  }, [agentId, pollingInterval]);

  return { metrics, loading, error };
}
