import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Agent {
  id: string;
  name: string;
  symbol: string;
  description: string | null;
  category: string | null;
  avatar_url: string | null;
  current_price: number;
  market_cap: number | null;
  volume_24h: number | null;
  price_change_24h: number | null;
  is_active: boolean;
  creator_id: string | null;
  status: string | null;
  test_mode: boolean | null;
  created_at: string;
  framework: string | null;
  // Bonding curve fields
  prompt_raised: number | null;
  token_graduated: boolean | null;
  graduation_threshold: number | null;
  token_holders: number | null;
}

export function useAgent(agentId: string | undefined) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useAgent] Effect triggered with agentId:', agentId);
    
    if (!agentId) {
      console.log('[useAgent] No agentId provided, setting loading false');
      setLoading(false);
      return;
    }

    async function fetchAgent() {
      try {
        console.log('[useAgent] Starting fetch for agent ID:', agentId);
        setLoading(true);
        
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', agentId)
          .maybeSingle();

        console.log('[useAgent] Fetch completed:', { data: !!data, error: !!error, loading: 'about to set false' });

        if (error) {
          console.error('[useAgent] Error fetching agent:', error);
          setError(error.message);
          setAgent(null);
        } else if (!data) {
          console.log('[useAgent] No agent found with ID:', agentId);
          setError('Agent not found');
          setAgent(null);
        } else {
          console.log('[useAgent] Agent found successfully:', data.name);
          setAgent(data);
          setError(null);
        }
      } catch (err: any) {
        console.error('[useAgent] Exception while fetching agent:', err);
        setError('Failed to load agent');
        setAgent(null);
      } finally {
        console.log('[useAgent] Finally block - setting loading to false');
        setLoading(false);
      }
    }

    fetchAgent();
  }, [agentId]);

  return { agent, loading, error };
}