import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppMode } from './useAppMode';

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
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isTestMode } = useAppMode();

  useEffect(() => {
    async function fetchAgents() {
      try {
        console.log('Fetching agents...');
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('is_active', true)
          .eq('test_mode', isTestMode)
          .order('market_cap', { ascending: false });

        console.log('Agents data:', data);
        console.log('Agents error:', error);

        if (error) throw error;
        setAgents(data || []);
      } catch (err: any) {
        console.error('Error fetching agents:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAgents();
  }, [isTestMode]);

  return { agents, loading, error };
}