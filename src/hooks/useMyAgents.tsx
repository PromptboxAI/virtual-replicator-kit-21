import { useState, useEffect } from 'react';
import { Agent } from './useAgents';

const PROMPTBOX_API_BASE = 'https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1';

export type AgentViewMode = 'database' | 'testnet' | 'mainnet';

interface UseMyAgentsOptions {
  viewMode?: AgentViewMode;
}

export function useMyAgents(userId: string | undefined, options: UseMyAgentsOptions = {}) {
  const { viewMode = 'database' } = options;
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
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          creatorId: userId,
          sortBy: 'created_at',
          sortOrder: 'desc'
        });

        // Configure params based on view mode
        switch (viewMode) {
          case 'database':
            // Only show agents created in database-only mode (no blockchain deployment)
            params.set('creationMode', 'database');
            break;
          case 'testnet':
            // Show ALL testnet agents - deployed, pending, or failed
            // Don't require hasContract or deploymentStatus - let users see their in-progress agents
            params.set('networkEnvironment', 'testnet');
            break;
          case 'mainnet':
            // Show ALL mainnet agents - deployed, pending, or failed
            params.set('networkEnvironment', 'mainnet');
            break;
        }

        const response = await fetch(`${PROMPTBOX_API_BASE}/list-tokens?${params}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        setMyAgents(result.tokens || result.data || []);
      } catch (err: any) {
        console.error('Error fetching my agents:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMyAgents();
  }, [userId, viewMode]);

  const refetchMyAgents = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        creatorId: userId,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      switch (viewMode) {
        case 'database':
          params.set('creationMode', 'database');
          break;
        case 'testnet':
          params.set('networkEnvironment', 'testnet');
          break;
        case 'mainnet':
          params.set('networkEnvironment', 'mainnet');
          break;
      }

      const response = await fetch(`${PROMPTBOX_API_BASE}/list-tokens?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setMyAgents(result.tokens || result.data || []);
    } catch (err: any) {
      console.error('Error refetching my agents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { myAgents, loading, error, refetchMyAgents };
}
