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
  creator_wallet_address: string | null;
  status: string | null;
  test_mode: boolean | null;
  token_holders: number | null;
  creation_mode: string | null;
  // Token and bonding curve fields
  token_address: string | null;
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
        console.log('Fetching smart_contract agents with isTestMode:', isTestMode);
        
        // Only fetch smart_contract agents, filtered by test_mode (testnet vs mainnet)
        // Only show fully deployed & verified agents to prevent "dead" tokens from appearing
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('is_active', true)
          .eq('test_mode', isTestMode)
          .eq('creation_mode', 'smart_contract')
          .eq('deployment_verified', true) // Hide agents until deployment is fully verified
          .order('market_cap', { ascending: false });

        console.log('Agents query result - isTestMode:', isTestMode, 'data count:', data?.length || 0);
        if (error) console.error('Agents error:', error);

        if (error) throw error;

        // Compute live holder counts per agent to avoid stale/mock values
        let agentsWithHolders = data || [];
        try {
          const agentIds = (data || []).map(a => a.id);
          if (agentIds.length > 0) {
            const { data: holderRows, error: holdersErr } = await supabase
              .from('agent_token_holders')
              .select('agent_id, token_balance')
              .in('agent_id', agentIds)
              .gt('token_balance', 0);

            if (holdersErr) throw holdersErr;

            const holdersMap = new Map<string, number>();
            holderRows?.forEach((row: any) => {
              holdersMap.set(row.agent_id, (holdersMap.get(row.agent_id) || 0) + 1);
            });

            agentsWithHolders = (data || []).map(a => ({
              ...a,
              token_holders: holdersMap.get(a.id) ?? 0,
            }));
          }
        } catch (e) {
          console.warn('Failed to compute live holder counts, falling back to existing token_holders:', e);
        }

        setAgents(agentsWithHolders);
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