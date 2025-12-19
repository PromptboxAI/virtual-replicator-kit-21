import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimRequest {
  agentId: string;
  walletAddress: string;
  claimType: 'holder_reward' | 'team_vesting';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ClaimRequest = await req.json();
    const { agentId, walletAddress, claimType } = body;

    console.log(`[claim-rewards] ${claimType} claim for agent ${agentId} by ${walletAddress}`);

    const now = new Date();

    if (claimType === 'holder_reward') {
      // Get holder reward info
      const { data: reward, error: rewardError } = await supabase
        .from('agent_holder_rewards')
        .select('*')
        .eq('agent_id', agentId)
        .eq('holder_address', walletAddress.toLowerCase())
        .single();

      if (rewardError || !reward) {
        throw new Error('No rewards found for this holder');
      }

      const startTime = new Date(reward.start_time);
      const vestEndTime = new Date(reward.vest_end_time);
      const totalReward = reward.total_reward_amount;
      const alreadyClaimed = reward.claimed_amount || 0;

      // Calculate vested amount (linear vesting)
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

      const claimableAmount = vestedAmount - alreadyClaimed;

      if (claimableAmount <= 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No rewards available to claim',
          details: {
            totalReward,
            vestedAmount,
            alreadyClaimed,
            claimableAmount: 0,
            vestProgress: Math.min(100, ((now.getTime() - startTime.getTime()) / (vestEndTime.getTime() - startTime.getTime())) * 100),
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update claimed amount
      const { error: updateError } = await supabase
        .from('agent_holder_rewards')
        .update({ claimed_amount: alreadyClaimed + claimableAmount })
        .eq('agent_id', agentId)
        .eq('holder_address', walletAddress.toLowerCase());

      if (updateError) {
        throw new Error(`Failed to update claim: ${updateError.message}`);
      }

      console.log(`[claim-rewards] Holder claimed ${claimableAmount} tokens`);

      return new Response(JSON.stringify({
        success: true,
        claimType: 'holder_reward',
        agentId,
        walletAddress,
        claimedAmount: claimableAmount,
        totalReward,
        remainingToClaim: totalReward - alreadyClaimed - claimableAmount,
        vestProgress: Math.min(100, ((now.getTime() - startTime.getTime()) / (vestEndTime.getTime() - startTime.getTime())) * 100),
        fullyVested: now >= vestEndTime,
        // On-chain execution would happen here
        onChainPending: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (claimType === 'team_vesting') {
      // Get team vesting info
      const { data: vesting, error: vestingError } = await supabase
        .from('agent_team_vesting')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (vestingError || !vesting) {
        throw new Error('No team vesting found for this agent');
      }

      // Check authorization
      if (vesting.beneficiary_address.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Not authorized to claim team tokens');
      }

      const cliff1Time = new Date(vesting.cliff_1_time);
      const cliff2Time = new Date(vesting.cliff_2_time);
      const totalAmount = vesting.total_amount;
      const alreadyClaimed = vesting.claimed_amount || 0;

      // Calculate claimable based on cliffs
      let vestedAmount = 0;
      if (now >= cliff2Time) {
        vestedAmount = totalAmount; // 100% after 6 months
      } else if (now >= cliff1Time) {
        vestedAmount = totalAmount * 0.5; // 50% after 3 months
      }

      const claimableAmount = vestedAmount - alreadyClaimed;

      if (claimableAmount <= 0) {
        const nextCliff = now < cliff1Time ? cliff1Time : cliff2Time;
        return new Response(JSON.stringify({
          success: false,
          error: 'No team tokens available to claim',
          details: {
            totalAmount,
            vestedAmount,
            alreadyClaimed,
            claimableAmount: 0,
            nextCliffDate: nextCliff.toISOString(),
            cliff1Reached: now >= cliff1Time,
            cliff2Reached: now >= cliff2Time,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update claimed amount
      const { error: updateError } = await supabase
        .from('agent_team_vesting')
        .update({ claimed_amount: alreadyClaimed + claimableAmount })
        .eq('agent_id', agentId);

      if (updateError) {
        throw new Error(`Failed to update claim: ${updateError.message}`);
      }

      console.log(`[claim-rewards] Team claimed ${claimableAmount} tokens`);

      return new Response(JSON.stringify({
        success: true,
        claimType: 'team_vesting',
        agentId,
        walletAddress,
        claimedAmount: claimableAmount,
        totalAmount,
        remainingToClaim: totalAmount - alreadyClaimed - claimableAmount,
        cliff1Reached: now >= cliff1Time,
        cliff2Reached: now >= cliff2Time,
        fullyVested: now >= cliff2Time,
        // On-chain execution would happen here
        onChainPending: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error('Invalid claim type');
    }
  } catch (error) {
    console.error('[claim-rewards] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
