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
    if (!agentId) {
      setLoading(false);
      return;
    }

    async function fetchAgent() {
      try {
        console.log('Fetching single agent with ID:', agentId);
        
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', agentId)
          .maybeSingle();

        console.log('Single agent fetch result:', { data, error });

        if (error) {
          console.error('Error fetching agent:', error);
          setError(error.message);
          setAgent(null);
        } else if (!data) {
          console.log('No agent found with ID:', agentId);
          setError('Agent not found');
          setAgent(null);
        } else {
          console.log('Agent found:', data);
          setAgent(data);
          setError(null);
        }
      } catch (err: any) {
        console.error('Exception while fetching agent:', err);
        setError('Failed to load agent');
        setAgent(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAgent();
  }, [agentId]);

  return { agent, loading, error };
}