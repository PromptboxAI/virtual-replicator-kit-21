import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseRewardClaimProps {
  agentId: string;
  walletAddress?: string;
}

interface HolderReward {
  id: string;
  agentId: string;
  holderAddress: string;
  totalRewardAmount: number;
  claimedAmount: number;
  startTime: Date;
  vestEndTime: Date;
  vestedAmount: number;
  claimableAmount: number;
  vestProgress: number;
  fullyVested: boolean;
}

export function useRewardClaim({ agentId, walletAddress }: UseRewardClaimProps) {
  const queryClient = useQueryClient();

  // Fetch holder reward info
  const { data: reward, isLoading, refetch } = useQuery({
    queryKey: ['holder-reward', agentId, walletAddress],
    queryFn: async (): Promise<HolderReward | null> => {
      if (!walletAddress) return null;

      const { data, error } = await supabase
        .from('agent_holder_rewards')
        .select('*')
        .eq('agent_id', agentId)
        .eq('holder_address', walletAddress.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      const now = new Date();
      const startTime = new Date(data.start_time);
      const vestEndTime = new Date(data.vest_end_time);
      const totalReward = data.total_reward_amount;
      const claimedAmount = data.claimed_amount || 0;

      // Calculate vested amount
      let vestedAmount: number;
      if (now >= vestEndTime) {
        vestedAmount = totalReward;
      } else if (now <= startTime) {
        vestedAmount = 0;
      } else {
        const elapsed = now.getTime() - startTime.getTime();
        const vestDuration = vestEndTime.getTime() - startTime.getTime();
        vestedAmount = totalReward * (elapsed / vestDuration);
      }

      const claimableAmount = Math.max(0, vestedAmount - claimedAmount);
      const vestProgress = Math.min(100, ((now.getTime() - startTime.getTime()) / (vestEndTime.getTime() - startTime.getTime())) * 100);

      return {
        id: data.id,
        agentId: data.agent_id,
        holderAddress: data.holder_address,
        totalRewardAmount: totalReward,
        claimedAmount,
        startTime,
        vestEndTime,
        vestedAmount,
        claimableAmount,
        vestProgress: Math.max(0, vestProgress),
        fullyVested: now >= vestEndTime,
      };
    },
    enabled: !!agentId && !!walletAddress,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Claim mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!walletAddress) throw new Error('Wallet not connected');

      const { data, error } = await supabase.functions.invoke('claim-rewards', {
        body: {
          agentId,
          walletAddress,
          claimType: 'holder_reward',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      toast.success(`Claimed ${data.claimedAmount.toFixed(2)} reward tokens!`);
      queryClient.invalidateQueries({ queryKey: ['holder-reward', agentId, walletAddress] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Claim failed');
    },
  });

  return {
    reward,
    isLoading,
    isClaiming: claimMutation.isPending,
    claim: () => claimMutation.mutate(),
    refetch,
    hasReward: !!reward && reward.totalRewardAmount > 0,
    canClaim: !!reward && reward.claimableAmount > 0,
  };
}
