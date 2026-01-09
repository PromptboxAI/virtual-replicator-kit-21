/**
 * V8 Bonding Curve Hook
 * 
 * Provides on-chain trading functionality for V8 agents.
 * Unlike V7 (database-mode), V8 trades are executed on-chain via BondingCurveV8 contract.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  V8_CONTRACTS, 
  V8_CONSTANTS,
  BONDING_CURVE_V8_ABI,
  PROTOTYPE_TOKEN_ABI,
  uuidToBytes32 
} from '@/lib/contractsV8';

// PROMPT Token address (same as V7)
const PROMPT_TOKEN_ADDRESS = '0x3D6AfE2fB73fFEcDfE66a0c5BF878e77051Bb4fd' as Address;

interface AgentV8State {
  id: string;
  name: string;
  symbol: string;
  prototypeTokenAddress: string | null;
  supply: bigint;
  reserve: bigint;
  currentPrice: bigint;
  graduated: boolean;
  graduationPhase: string;
  promptRaised: number;
}

interface QuoteResult {
  amountOut: bigint;
  fee: bigint;
  priceAfter: bigint;
}

export function useBondingCurveV8(agentId: string) {
  const { address: walletAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agent state from database
  const { data: agentState, isLoading: isLoadingAgent, refetch: refetchAgent } = useQuery({
    queryKey: ['agent-v8-state', agentId],
    queryFn: async (): Promise<AgentV8State | null> => {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          id, name, symbol, 
          prototype_token_address,
          on_chain_supply, on_chain_reserve,
          current_price, token_graduated,
          graduation_phase, prompt_raised
        `)
        .eq('id', agentId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        symbol: data.symbol,
        prototypeTokenAddress: data.prototype_token_address,
        supply: BigInt(Math.floor((data.on_chain_supply || 0) * 1e18)),
        reserve: BigInt(Math.floor((data.on_chain_reserve || 0) * 1e18)),
        currentPrice: BigInt(Math.floor((data.current_price || 0.00001) * 1e18)),
        graduated: data.token_graduated || false,
        graduationPhase: data.graduation_phase || 'not_started',
        promptRaised: data.prompt_raised || 0,
      };
    },
    refetchInterval: 5000,
    enabled: !!agentId,
  });

  // Fetch user's token balance
  const { data: userBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['user-token-balance-v8', agentId, walletAddress],
    queryFn: async (): Promise<bigint> => {
      if (!walletAddress || !agentState?.prototypeTokenAddress || !publicClient) {
        return 0n;
      }

      try {
        const balance = await publicClient.readContract({
          address: agentState.prototypeTokenAddress as Address,
          abi: PROTOTYPE_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [walletAddress],
        });
        return balance as bigint;
      } catch {
        return 0n;
      }
    },
    enabled: !!walletAddress && !!agentState?.prototypeTokenAddress && !!publicClient,
    refetchInterval: 10000,
  });

  // Quote buy (on-chain)
  const quoteBuy = useCallback(async (promptAmount: string): Promise<QuoteResult | null> => {
    if (!publicClient || !agentId) return null;

    try {
      const agentIdBytes32 = uuidToBytes32(agentId);
      const promptWei = parseEther(promptAmount);

      const result = await publicClient.readContract({
        address: V8_CONTRACTS.BONDING_CURVE as Address,
        abi: BONDING_CURVE_V8_ABI,
        functionName: 'quoteBuy',
        args: [agentIdBytes32, promptWei],
      });

      const [tokenAmountOut, fee, priceAfter] = result as [bigint, bigint, bigint];
      return { amountOut: tokenAmountOut, fee, priceAfter };
    } catch (error) {
      console.error('Quote buy error:', error);
      return null;
    }
  }, [publicClient, agentId]);

  // Quote sell (on-chain)
  const quoteSell = useCallback(async (tokenAmount: string): Promise<QuoteResult | null> => {
    if (!publicClient || !agentId) return null;

    try {
      const agentIdBytes32 = uuidToBytes32(agentId);
      const tokenWei = parseEther(tokenAmount);

      const result = await publicClient.readContract({
        address: V8_CONTRACTS.BONDING_CURVE as Address,
        abi: BONDING_CURVE_V8_ABI,
        functionName: 'quoteSell',
        args: [agentIdBytes32, tokenWei],
      });

      const [promptAmountOut, fee, priceAfter] = result as [bigint, bigint, bigint];
      return { amountOut: promptAmountOut, fee, priceAfter };
    } catch (error) {
      console.error('Quote sell error:', error);
      return null;
    }
  }, [publicClient, agentId]);

  // Buy mutation (on-chain transaction)
  const buyMutation = useMutation({
    mutationFn: async ({ promptAmount, minTokensOut, slippageBps = 100 }: {
      promptAmount: string;
      minTokensOut?: string;
      slippageBps?: number;
    }) => {
      if (!walletClient || !publicClient || !walletAddress) {
        throw new Error('Wallet not connected');
      }

      const agentIdBytes32 = uuidToBytes32(agentId);
      const promptWei = parseEther(promptAmount);

      // Get quote for min tokens calculation
      let minTokensWei: bigint;
      if (minTokensOut) {
        minTokensWei = parseEther(minTokensOut);
      } else {
        const quote = await quoteBuy(promptAmount);
        if (!quote) throw new Error('Failed to get quote');
        // Apply slippage tolerance
        minTokensWei = quote.amountOut * BigInt(10000 - slippageBps) / 10000n;
      }

      // First approve PROMPT token spending
      const approveHash = await walletClient.writeContract({
        address: PROMPT_TOKEN_ADDRESS,
        abi: PROTOTYPE_TOKEN_ABI,
        functionName: 'approve',
        args: [V8_CONTRACTS.BONDING_CURVE as Address, promptWei],
      });

      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Execute buy on BondingCurveV8
      const buyHash = await walletClient.writeContract({
        address: V8_CONTRACTS.BONDING_CURVE as Address,
        abi: BONDING_CURVE_V8_ABI,
        functionName: 'buy',
        args: [agentIdBytes32, promptWei, minTokensWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: buyHash });
      return { hash: buyHash, receipt };
    },
    onSuccess: (data) => {
      toast({
        title: 'Buy successful!',
        description: `Transaction: ${data.hash.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ['agent-v8-state', agentId] });
      queryClient.invalidateQueries({ queryKey: ['user-token-balance-v8', agentId] });
    },
    onError: (error) => {
      toast({
        title: 'Buy failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Sell mutation (on-chain transaction)
  const sellMutation = useMutation({
    mutationFn: async ({ tokenAmount, minPromptOut, slippageBps = 100 }: {
      tokenAmount: string;
      minPromptOut?: string;
      slippageBps?: number;
    }) => {
      if (!walletClient || !publicClient || !walletAddress || !agentState?.prototypeTokenAddress) {
        throw new Error('Wallet not connected or no token address');
      }

      const agentIdBytes32 = uuidToBytes32(agentId);
      const tokenWei = parseEther(tokenAmount);

      // Get quote for min PROMPT calculation
      let minPromptWei: bigint;
      if (minPromptOut) {
        minPromptWei = parseEther(minPromptOut);
      } else {
        const quote = await quoteSell(tokenAmount);
        if (!quote) throw new Error('Failed to get quote');
        // Apply slippage tolerance
        minPromptWei = quote.amountOut * BigInt(10000 - slippageBps) / 10000n;
      }

      // Approve prototype token for BondingCurve
      const approveHash = await walletClient.writeContract({
        address: agentState.prototypeTokenAddress as Address,
        abi: PROTOTYPE_TOKEN_ABI,
        functionName: 'approve',
        args: [V8_CONTRACTS.BONDING_CURVE as Address, tokenWei],
      });

      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Execute sell on BondingCurveV8
      const sellHash = await walletClient.writeContract({
        address: V8_CONTRACTS.BONDING_CURVE as Address,
        abi: BONDING_CURVE_V8_ABI,
        functionName: 'sell',
        args: [agentIdBytes32, tokenWei, minPromptWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: sellHash });
      return { hash: sellHash, receipt };
    },
    onSuccess: (data) => {
      toast({
        title: 'Sell successful!',
        description: `Transaction: ${data.hash.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ['agent-v8-state', agentId] });
      queryClient.invalidateQueries({ queryKey: ['user-token-balance-v8', agentId] });
    },
    onError: (error) => {
      toast({
        title: 'Sell failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Derived values
  const currentPrice = useMemo(() => {
    if (!agentState) return 0;
    return Number(formatEther(agentState.currentPrice));
  }, [agentState]);

  const graduationProgress = useMemo(() => {
    if (!agentState) return 0;
    const threshold = Number(V8_CONSTANTS.GRADUATION_THRESHOLD);
    return Math.min((agentState.promptRaised / threshold) * 100, 100);
  }, [agentState]);

  const isGraduatable = useMemo(() => {
    if (!agentState) return false;
    return agentState.promptRaised >= Number(V8_CONSTANTS.GRADUATION_THRESHOLD);
  }, [agentState]);

  const userBalanceFormatted = useMemo(() => {
    return userBalance ? formatEther(userBalance) : '0';
  }, [userBalance]);

  return {
    // Agent state
    agentState,
    isLoadingAgent,
    refetchAgent,

    // User position
    userBalance,
    userBalanceFormatted,
    isLoadingBalance,

    // Quote functions
    quoteBuy,
    quoteSell,

    // Trading actions
    buy: buyMutation.mutateAsync,
    sell: sellMutation.mutateAsync,
    isBuying: buyMutation.isPending,
    isSelling: sellMutation.isPending,

    // Derived values
    currentPrice,
    graduationProgress,
    isGraduatable,
    isConnected,

    // Constants
    graduationThreshold: V8_CONSTANTS.GRADUATION_THRESHOLD,
    tradingFeeBps: V8_CONSTANTS.TRADING_FEE_BPS,
    bondingCurveAddress: V8_CONTRACTS.BONDING_CURVE,
  };
}
