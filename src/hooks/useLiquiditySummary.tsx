import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiquiditySummary {
  creation_mode: 'database' | 'smart_contract';
  graduation_mode: 'database' | 'smart_contract';
  status: 'pre_grad' | 'post_grad';
  lp_percent: string;      // "70"
  source: 'actual' | 'projected';
  lp_prompt: string;       // "175"
  lp_usd: string;          // "17.5"
  lp_pair_symbol: string | null;
  lp_pair_amount: string | null;
  asof: string;            // "2025-10-08T12:34:56Z"
  fx: string;              // "0.10"
}

export function useLiquiditySummary(agentId: string | undefined) {
  const [liquidity, setLiquidity] = useState<LiquiditySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setLiquidity(null);
      setLoading(false);
      return;
    }

    const fetchLiquidity = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase.functions.invoke(
          'get-liquidity',
          { body: { agentId } }
        );

        if (fetchError) {
          console.error('Error fetching liquidity summary:', fetchError);
          setError(fetchError.message);
          return;
        }

        setLiquidity(data.liquidity);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch liquidity summary:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLiquidity();
  }, [agentId]);

  return { liquidity, loading, error };
}
