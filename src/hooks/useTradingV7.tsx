/**
 * V7 Trading Hook
 * 
 * Provides buy/sell functionality using V7 bonding curve edge functions.
 * Handles quotes, execution, and state management.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  V7_CONSTANTS,
  calculateCurrentPrice,
  getMarketData,
  getBuyQuote,
  getSellQuote,
} from '@/lib/bondingCurveV7';

interface AgentState {
  id: string;
  name: string;
  ticker: string;
  sharesSold: number;
  promptRaised: number;
  p0: number;
  p1: number;
  isGraduated: boolean;
  creatorWallet: string;
}

interface UserPosition {
  balance: number;
  lastUpdated: string | null;
}

interface TradeResult {
  success: boolean;
  action: 'buy' | 'sell';
  sharesOut?: number;
  sharesIn?: number;
  promptIn?: number;
  promptOut?: number;
  fee: number;
  creatorFee: number;
  platformFee: number;
  avgPrice: number;
  newPrice: number;
  newSharesSold: number;
  newPromptRaised: number;
  shouldGraduate?: boolean;
}

interface QuoteResult {
  valid: boolean;
  error?: string;
  sharesOut?: number;
  promptOut?: number;
  fee: number;
  creatorFee: number;
  platformFee: number;
  avgPrice: number;
  newPrice: number;
  priceImpact: number;
}

export function useTradingV7(agentId: string, walletAddress?: string) {
  const queryClient = useQueryClient();
  const [isQuoting, setIsQuoting] = useState(false);

  // Fetch agent state
  const {
    data: agentState,
    isLoading: isLoadingAgent,
    refetch: refetchAgent,
  } = useQuery({
    queryKey: ['agent-v7', agentId],
    queryFn: async (): Promise<AgentState | null> => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, symbol, shares_sold, prompt_raised, created_p0, created_p1, token_graduated, creator_wallet_address')
        .eq('id', agentId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        ticker: data.symbol ?? '',
        sharesSold: data.shares_sold ?? 0,
        promptRaised: data.prompt_raised ?? 0,
        p0: data.created_p0 ?? V7_CONSTANTS.DEFAULT_P0,
        p1: data.created_p1 ?? V7_CONSTANTS.DEFAULT_P1,
        isGraduated: data.token_graduated ?? false,
        creatorWallet: data.creator_wallet_address ?? '',
      };
    },
    enabled: !!agentId,
    refetchInterval: 10000, // Refresh every 10s
  });

  // Fetch user position
  const {
    data: userPosition,
    isLoading: isLoadingPosition,
    refetch: refetchPosition,
  } = useQuery({
    queryKey: ['position-v7', agentId, walletAddress],
    queryFn: async (): Promise<UserPosition> => {
      if (!walletAddress) return { balance: 0, lastUpdated: null };

      const { data } = await supabase
        .from('agent_database_positions')
        .select('token_balance, last_updated')
        .eq('agent_id', agentId)
        .eq('holder_address', walletAddress.toLowerCase())
        .single();

      return {
        balance: data?.token_balance ?? 0,
        lastUpdated: data?.last_updated ?? null,
      };
    },
    enabled: !!agentId && !!walletAddress,
    refetchInterval: 10000,
  });

  // Buy mutation
  const buyMutation = useMutation({
    mutationFn: async ({
      promptAmount,
      minSharesOut,
    }: {
      promptAmount: number;
      minSharesOut?: number;
    }): Promise<TradeResult> => {
      if (!walletAddress) throw new Error('Wallet not connected');

      const { data, error } = await supabase.functions.invoke('trading-engine-v7', {
        body: {
          agentId,
          action: 'buy',
          promptAmount,
          walletAddress,
          minSharesOut,
        },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      return data as TradeResult;
    },
    onSuccess: (data) => {
      toast.success(`Bought ${data.sharesOut?.toLocaleString()} tokens`);
      queryClient.invalidateQueries({ queryKey: ['agent-v7', agentId] });
      queryClient.invalidateQueries({ queryKey: ['position-v7', agentId] });
      
      if (data.shouldGraduate) {
        toast.info('Agent is ready for graduation!');
      }
    },
    onError: (error) => {
      toast.error(`Buy failed: ${error.message}`);
    },
  });

  // Sell mutation
  const sellMutation = useMutation({
    mutationFn: async ({
      tokenAmount,
      minPromptOut,
    }: {
      tokenAmount: number;
      minPromptOut?: number;
    }): Promise<TradeResult> => {
      if (!walletAddress) throw new Error('Wallet not connected');

      const { data, error } = await supabase.functions.invoke('trading-engine-v7', {
        body: {
          agentId,
          action: 'sell',
          tokenAmount,
          walletAddress,
          minPromptOut,
        },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      return data as TradeResult;
    },
    onSuccess: (data) => {
      toast.success(`Sold for ${data.promptOut?.toLocaleString()} PROMPT`);
      queryClient.invalidateQueries({ queryKey: ['agent-v7', agentId] });
      queryClient.invalidateQueries({ queryKey: ['position-v7', agentId] });
    },
    onError: (error) => {
      toast.error(`Sell failed: ${error.message}`);
    },
  });

  // Get buy quote (local calculation)
  const getBuyQuoteLocal = useCallback(
    (promptAmount: number): QuoteResult | null => {
      if (!agentState) return null;
      
      const quote = getBuyQuote(
        promptAmount,
        agentState.sharesSold,
        agentState.p0,
        agentState.p1
      );

      return {
        valid: quote.valid,
        error: quote.error,
        sharesOut: quote.sharesOut,
        fee: quote.fee,
        creatorFee: quote.creatorFee,
        platformFee: quote.platformFee,
        avgPrice: quote.avgPrice,
        newPrice: quote.newPrice,
        priceImpact: quote.priceImpact,
      };
    },
    [agentState]
  );

  // Get sell quote (local calculation)
  const getSellQuoteLocal = useCallback(
    (tokenAmount: number): QuoteResult | null => {
      if (!agentState || !userPosition) return null;

      const quote = getSellQuote(
        tokenAmount,
        agentState.sharesSold,
        userPosition.balance,
        agentState.promptRaised,
        agentState.p0,
        agentState.p1
      );

      return {
        valid: quote.valid,
        error: quote.error,
        promptOut: quote.promptOut,
        fee: quote.fee,
        creatorFee: quote.creatorFee,
        platformFee: quote.platformFee,
        avgPrice: quote.avgPrice,
        newPrice: quote.newPrice,
        priceImpact: quote.priceImpact,
      };
    },
    [agentState, userPosition]
  );

  // Get quote from edge function (for verification)
  const getRemoteQuote = useCallback(
    async (action: 'buy' | 'sell', amount: number): Promise<QuoteResult | null> => {
      setIsQuoting(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-quote-v7', {
          body: {
            agentId,
            action,
            promptAmount: action === 'buy' ? amount : undefined,
            tokenAmount: action === 'sell' ? amount : undefined,
            walletAddress,
          },
        });

        if (error || data.error) {
          return { valid: false, error: data?.error || error.message } as QuoteResult;
        }

        return data as QuoteResult;
      } catch (err) {
        return null;
      } finally {
        setIsQuoting(false);
      }
    },
    [agentId, walletAddress]
  );

  // Derived state
  const currentPrice = agentState
    ? calculateCurrentPrice(agentState.sharesSold, agentState.p0, agentState.p1)
    : 0;

  const marketData = agentState
    ? getMarketData(agentState.sharesSold, agentState.promptRaised, agentState.p0, agentState.p1)
    : null;

  return {
    // State
    agentState,
    userPosition,
    currentPrice,
    marketData,

    // Loading states
    isLoading: isLoadingAgent || isLoadingPosition,
    isBuying: buyMutation.isPending,
    isSelling: sellMutation.isPending,
    isQuoting,

    // Actions
    buy: buyMutation.mutateAsync,
    sell: sellMutation.mutateAsync,

    // Quotes
    getBuyQuote: getBuyQuoteLocal,
    getSellQuote: getSellQuoteLocal,
    getRemoteQuote,

    // Refresh
    refetch: () => {
      refetchAgent();
      refetchPosition();
    },

    // Constants
    constants: V7_CONSTANTS,
  };
}
