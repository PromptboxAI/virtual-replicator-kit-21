import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from './useAgents';

export function useMyAgents(userId: string | undefined) {
  const [myAgents, setMyAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setMyAgents([]);
      setLoading(false);
      return;
    }

    async function fetchMyAgents() {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMyAgents(data || []);
      } catch (err: any) {
        console.error('Error fetching my agents:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMyAgents();
  }, [userId]);

  const refetchMyAgents = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyAgents(data || []);
    } catch (err: any) {
      console.error('Error refetching my agents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { myAgents, loading, error, refetchMyAgents };
}