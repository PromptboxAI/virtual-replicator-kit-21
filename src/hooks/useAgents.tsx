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
  // Bonding curve fields
  prompt_raised: number | null;
  token_graduated: boolean | null;
  graduation_threshold: number | null;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isTestMode, isLoading: appModeLoading } = useAppMode();

  useEffect(() => {
    // Don't fetch until app mode is determined
    if (appModeLoading) return;
    async function fetchAgents() {
      try {
        console.log('Fetching agents with isTestMode:', isTestMode);
        console.log('Query params: is_active=true, test_mode=', isTestMode);
        
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('is_active', true)
          .eq('test_mode', isTestMode)
          .order('market_cap', { ascending: false });

        console.log('Agents query result - isTestMode:', isTestMode, 'data count:', data?.length || 0);
        console.log('Sample agent test_mode values:', data?.slice(0, 3).map(a => ({ name: a.name, test_mode: a.test_mode })));
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
  }, [isTestMode, appModeLoading]);

  return { agents, loading, error };
}