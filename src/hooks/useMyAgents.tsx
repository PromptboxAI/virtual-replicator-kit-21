import { useState, useEffect } from 'react';
import { Agent } from './useAgents';

const PROMPTBOX_API_BASE = 'https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1';

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
        // Use Promptbox API to fetch only successfully deployed agents
        const params = new URLSearchParams({
          testMode: 'false', // Only production agents
          hasContract: 'true', // Only agents with deployed contracts
          deploymentStatus: 'deployed', // Only successfully deployed
          creatorId: userId, // Filter by creator
          sortBy: 'created_at',
          sortOrder: 'desc'
        });

        const response = await fetch(`${PROMPTBOX_API_BASE}/list-tokens?${params}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        setMyAgents(result.data || []);
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
      const params = new URLSearchParams({
        testMode: 'false',
        hasContract: 'true',
        deploymentStatus: 'deployed',
        creatorId: userId,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      const response = await fetch(`${PROMPTBOX_API_BASE}/list-tokens?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setMyAgents(result.data || []);
    } catch (err: any) {
      console.error('Error refetching my agents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { myAgents, loading, error, refetchMyAgents };
}