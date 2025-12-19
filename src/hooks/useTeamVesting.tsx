import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseTeamVestingProps {
  agentId: string;
  walletAddress?: string;
}

interface TeamVesting {
  agentId: string;
  beneficiaryAddress: string;
  totalAmount: number;
  claimedAmount: number;
  startTime: Date;
  cliff1Time: Date;
  cliff2Time: Date;
  vestedAmount: number;
  claimableAmount: number;
  cliff1Reached: boolean;
  cliff2Reached: boolean;
  fullyVested: boolean;
  nextCliffDate: Date | null;
  daysUntilNextCliff: number | null;
}

export function useTeamVesting({ agentId, walletAddress }: UseTeamVestingProps) {
  const queryClient = useQueryClient();

  // Fetch team vesting info
  const { data: vesting, isLoading, refetch } = useQuery({
    queryKey: ['team-vesting', agentId],
    queryFn: async (): Promise<TeamVesting | null> => {
      const { data, error } = await supabase
        .from('agent_team_vesting')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      const now = new Date();
      const startTime = new Date(data.start_time);
      const cliff1Time = new Date(data.cliff_1_time);
      const cliff2Time = new Date(data.cliff_2_time);
      const totalAmount = data.total_amount;
      const claimedAmount = data.claimed_amount || 0;

      const cliff1Reached = now >= cliff1Time;
      const cliff2Reached = now >= cliff2Time;

      // Calculate vested amount based on cliffs
      let vestedAmount = 0;
      if (cliff2Reached) {
        vestedAmount = totalAmount; // 100% after 6 months
      } else if (cliff1Reached) {
        vestedAmount = totalAmount * 0.5; // 50% after 3 months
      }

      const claimableAmount = Math.max(0, vestedAmount - claimedAmount);

      // Calculate next cliff
      let nextCliffDate: Date | null = null;
      let daysUntilNextCliff: number | null = null;

      if (!cliff1Reached) {
        nextCliffDate = cliff1Time;
        daysUntilNextCliff = Math.ceil((cliff1Time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else if (!cliff2Reached) {
        nextCliffDate = cliff2Time;
        daysUntilNextCliff = Math.ceil((cliff2Time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        agentId: data.agent_id,
        beneficiaryAddress: data.beneficiary_address,
        totalAmount,
        claimedAmount,
        startTime,
        cliff1Time,
        cliff2Time,
        vestedAmount,
        claimableAmount,
        cliff1Reached,
        cliff2Reached,
        fullyVested: cliff2Reached,
        nextCliffDate,
        daysUntilNextCliff,
      };
    },
    enabled: !!agentId,
    refetchInterval: 60000, // Refresh every minute
  });

  // Check if user is the beneficiary
  const isBeneficiary = vesting && walletAddress
    ? vesting.beneficiaryAddress.toLowerCase() === walletAddress.toLowerCase()
    : false;

  // Claim mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!walletAddress) throw new Error('Wallet not connected');
      if (!isBeneficiary) throw new Error('Not authorized to claim team tokens');

      const { data, error } = await supabase.functions.invoke('claim-rewards', {
        body: {
          agentId,
          walletAddress,
          claimType: 'team_vesting',
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      toast.success(`Claimed ${data.claimedAmount.toLocaleString()} team tokens!`);
      queryClient.invalidateQueries({ queryKey: ['team-vesting', agentId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Claim failed');
    },
  });

  return {
    vesting,
    isLoading,
    isClaiming: claimMutation.isPending,
    isBeneficiary,
    claim: () => claimMutation.mutate(),
    refetch,
    hasVesting: !!vesting && vesting.totalAmount > 0,
    canClaim: isBeneficiary && !!vesting && vesting.claimableAmount > 0,
  };
}
