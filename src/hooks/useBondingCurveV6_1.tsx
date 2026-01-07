import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  calculateBuyReturn,
  calculateSellReturn,
  calculateCurrentPrice,
  calculateMarketData,
  canGraduate,
  getGraduationProgress,
  BONDING_CURVE_V6_1_CONSTANTS as CONSTANTS,
} from '@/lib/bondingCurveV6_1';

interface UseBondingCurveV6_1Props {
  agentId: string;
  walletAddress?: string;
}

interface AgentState {
  sharesSold: number;
  promptRaised: number;
  phase: 'active' | 'graduating' | 'graduated';
  p0: number;
  p1: number;
  creatorAddress?: string;
}

interface UserPosition {
  tokenBalance: number;
  lastUpdated: string;
}

export function useBondingCurveV6_1({ agentId, walletAddress }: UseBondingCurveV6_1Props) {
  const queryClient = useQueryClient();

  // Fetch agent state
  const { data: agentState, isLoading: agentLoading, refetch: refetchAgent } = useQuery({
    queryKey: ['agent-v6', agentId],
    queryFn: async (): Promise<AgentState> => {
      const { data, error } = await supabase
        .from('agents')
        .select('shares_sold, prompt_raised, bonding_curve_phase, created_p0, created_p1, creator_wallet_address')
        .eq('id', agentId)
        .single();

      if (error) throw error;

      return {
        sharesSold: data.shares_sold || 0,
        promptRaised: data.prompt_raised || 0,
        phase: (data.bonding_curve_phase as 'active' | 'graduating' | 'graduated') || 'active',
        p0: data.created_p0 || CONSTANTS.DEFAULT_P0,
        p1: data.created_p1 || CONSTANTS.DEFAULT_P1,
        creatorAddress: data.creator_wallet_address,
      };
    },
    enabled: !!agentId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch user position
  const { data: userPosition, refetch: refetchPosition } = useQuery({
    queryKey: ['user-position-v6', agentId, walletAddress],
    queryFn: async (): Promise<UserPosition | null> => {
      if (!walletAddress) return null;

      const { data, error } = await supabase
        .from('agent_database_positions')
        .select('token_balance, last_updated')
        .eq('agent_id', agentId)
        .eq('holder_address', walletAddress.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? {
        tokenBalance: data.token_balance,
        lastUpdated: data.last_updated,
      } : null;
    },
    enabled: !!agentId && !!walletAddress,
  });

  // Buy mutation
  const buyMutation = useMutation({
    mutationFn: async ({ promptAmount }: { promptAmount: number }) => {
      if (!walletAddress) throw new Error('Wallet not connected');

      const { data, error } = await supabase.functions.invoke('trading-engine-v7', {
        body: {
          agentId,
          walletAddress,
          promptAmount,
          action: 'buy',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      toast.success(`Bought ${data.result.sharesOut.toFixed(2)} shares`);
      queryClient.invalidateQueries({ queryKey: ['agent-v6', agentId] });
      queryClient.invalidateQueries({ queryKey: ['user-position-v6', agentId, walletAddress] });

      if (data.shouldGraduate) {
        toast.info('Agent reached graduation threshold!');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Buy failed');
    },
  });

  // Sell mutation
  const sellMutation = useMutation({
    mutationFn: async ({ sharesAmount }: { sharesAmount: number }) => {
      if (!walletAddress) throw new Error('Wallet not connected');

      const { data, error } = await supabase.functions.invoke('trading-engine-v7', {
        body: {
          agentId,
          walletAddress,
          tokenAmount: sharesAmount,
          action: 'sell',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sold for ${data.result.promptOut.toFixed(4)} PROMPT`);
      queryClient.invalidateQueries({ queryKey: ['agent-v6', agentId] });
      queryClient.invalidateQueries({ queryKey: ['user-position-v6', agentId, walletAddress] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Sell failed');
    },
  });

  // Calculate derived state
  const currentPrice = agentState
    ? calculateCurrentPrice(agentState.sharesSold)
    : CONSTANTS.DEFAULT_P0;

  const marketData = agentState
    ? calculateMarketData(agentState.promptRaised, agentState.sharesSold)
    : null;

  const graduationProgress = agentState
    ? getGraduationProgress(agentState.promptRaised)
    : 0;

  const isGraduatable = agentState
    ? canGraduate(agentState.promptRaised)
    : false;

  // Preview functions
  const previewBuy = useCallback((promptAmount: number) => {
    if (!agentState) return null;
    try {
      return calculateBuyReturn(agentState.sharesSold, promptAmount);
    } catch {
      return null;
    }
  }, [agentState]);

  const previewSell = useCallback((sharesAmount: number) => {
    if (!agentState) return null;
    try {
      return calculateSellReturn(agentState.sharesSold, sharesAmount);
    } catch {
      return null;
    }
  }, [agentState]);

  return {
    // State
    agentState,
    userPosition,
    currentPrice,
    marketData,
    graduationProgress,
    isGraduatable,
    
    // Loading states
    isLoading: agentLoading,
    isBuying: buyMutation.isPending,
    isSelling: sellMutation.isPending,
    
    // Actions
    buy: (promptAmount: number) => buyMutation.mutate({ promptAmount }),
    sell: (sharesAmount: number) => sellMutation.mutate({ sharesAmount }),
    previewBuy,
    previewSell,
    refetch: () => {
      refetchAgent();
      refetchPosition();
    },
    
    // Constants
    constants: CONSTANTS,
  };
}
