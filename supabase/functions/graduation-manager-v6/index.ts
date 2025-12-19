import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V6.1 Constants
const CONSTANTS = {
  TOTAL_SUPPLY: 1_000_000_000,
  VAULT_ALLOCATION: 20_000_000, // 2%
  TEAM_ALLOCATION: 100_000_000, // 10%
  VARIABLE_POOL: 880_000_000, // 88%
  MIN_LP_TOKENS: 565_000_000,
  MAX_LP_TOKENS: 880_000_000,
  GRADUATION_THRESHOLD_PROMPT: 42_000,
  HOLDER_REWARD_PERCENT: 5, // 5% of holder's pre-graduation tokens
  HOLDER_VEST_DAYS: 30,
  TEAM_CLIFF_1_DAYS: 90,
  TEAM_CLIFF_2_DAYS: 180,
  LP_LOCK_YEARS: 3,
  LP_LOCKED_PERCENT: 95,
  LP_VAULT_PERCENT: 5,
};

// Calculate LP allocation: LP = 880M - 1.05X
function calculateLPAllocation(sharesSold: number): number {
  const lpTokens = CONSTANTS.MAX_LP_TOKENS - 1.05 * sharesSold;
  return Math.max(lpTokens, CONSTANTS.MIN_LP_TOKENS);
}

// Calculate holder rewards (5% bonus)
function calculateHolderRewards(holders: Array<{ address: string; balance: number }>, totalSharesSold: number) {
  return holders.map(holder => {
    const shareOfPool = holder.balance / totalSharesSold;
    const rewardAmount = holder.balance * (CONSTANTS.HOLDER_REWARD_PERCENT / 100);
    return {
      address: holder.address,
      preGraduationBalance: holder.balance,
      shareOfPool,
      rewardAmount,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { agentId, executorAddress } = await req.json();

    console.log(`[graduation-manager-v6] Starting graduation for agent ${agentId}`);

    // Get agent data
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentError?.message}`);
    }

    if (agent.bonding_curve_phase === 'graduated') {
      throw new Error('Agent already graduated');
    }

    const sharesSold = agent.shares_sold || 0;
    const promptRaised = agent.prompt_raised || 0;

    if (promptRaised < CONSTANTS.GRADUATION_THRESHOLD_PROMPT) {
      throw new Error(`Not ready for graduation. Current: ${promptRaised}, Required: ${CONSTANTS.GRADUATION_THRESHOLD_PROMPT}`);
    }

    // Get all holders
    const { data: positions, error: positionsError } = await supabase
      .from('agent_database_positions')
      .select('holder_address, token_balance')
      .eq('agent_id', agentId);

    if (positionsError) {
      throw new Error(`Failed to get positions: ${positionsError.message}`);
    }

    const holders = (positions || []).map(p => ({
      address: p.holder_address,
      balance: p.token_balance,
    }));

    console.log(`[graduation-manager-v6] Found ${holders.length} holders`);

    // Calculate allocations
    const lpTokens = calculateLPAllocation(sharesSold);
    const holderRewards = calculateHolderRewards(holders, sharesSold);
    const totalRewards = holderRewards.reduce((sum, h) => sum + h.rewardAmount, 0);

    // Verify token math
    const totalAllocated = 
      CONSTANTS.VAULT_ALLOCATION + 
      CONSTANTS.TEAM_ALLOCATION + 
      sharesSold + // Holders get their database shares as real tokens
      totalRewards + // 5% bonus rewards
      lpTokens;

    console.log(`[graduation-manager-v6] Token allocation:
      Vault: ${CONSTANTS.VAULT_ALLOCATION}
      Team: ${CONSTANTS.TEAM_ALLOCATION}
      Holders (shares): ${sharesSold}
      Holder Rewards (5%): ${totalRewards}
      LP: ${lpTokens}
      Total: ${totalAllocated}
      Target: ${CONSTANTS.TOTAL_SUPPLY}
    `);

    // Calculate timestamps
    const now = new Date();
    const vestEndTime = new Date(now.getTime() + CONSTANTS.HOLDER_VEST_DAYS * 24 * 60 * 60 * 1000);
    const cliff1Time = new Date(now.getTime() + CONSTANTS.TEAM_CLIFF_1_DAYS * 24 * 60 * 60 * 1000);
    const cliff2Time = new Date(now.getTime() + CONSTANTS.TEAM_CLIFF_2_DAYS * 24 * 60 * 60 * 1000);
    const lpUnlockTime = new Date(now.getTime() + CONSTANTS.LP_LOCK_YEARS * 365 * 24 * 60 * 60 * 1000);

    // Store holder rewards in database
    const rewardInserts = holderRewards.map(h => ({
      agent_id: agentId,
      holder_address: h.address,
      total_reward_amount: h.rewardAmount,
      claimed_amount: 0,
      start_time: now.toISOString(),
      vest_end_time: vestEndTime.toISOString(),
    }));

    if (rewardInserts.length > 0) {
      const { error: rewardError } = await supabase
        .from('agent_holder_rewards')
        .insert(rewardInserts);

      if (rewardError) {
        console.error('[graduation-manager-v6] Failed to insert rewards:', rewardError);
      }
    }

    // Store team vesting
    const { error: teamError } = await supabase
      .from('agent_team_vesting')
      .upsert({
        agent_id: agentId,
        beneficiary_address: agent.creator_wallet_address || executorAddress,
        total_amount: CONSTANTS.TEAM_ALLOCATION,
        claimed_amount: 0,
        start_time: now.toISOString(),
        cliff_1_time: cliff1Time.toISOString(),
        cliff_2_time: cliff2Time.toISOString(),
      });

    if (teamError) {
      console.error('[graduation-manager-v6] Failed to insert team vesting:', teamError);
    }

    // Store LP info (placeholder - actual LP creation happens on-chain)
    const lpLocked = lpTokens * (CONSTANTS.LP_LOCKED_PERCENT / 100);
    const lpToVault = lpTokens * (CONSTANTS.LP_VAULT_PERCENT / 100);

    const { error: lpError } = await supabase
      .from('agent_lp_info')
      .upsert({
        agent_id: agentId,
        lp_pair_address: '0x0000000000000000000000000000000000000000', // Set after on-chain creation
        total_lp_tokens: lpTokens,
        lp_locked: lpLocked,
        lp_to_vault: lpToVault,
        lock_id: 0, // Set after on-chain lock
        unlock_time: lpUnlockTime.toISOString(),
      });

    if (lpError) {
      console.error('[graduation-manager-v6] Failed to insert LP info:', lpError);
    }

    // Update agent status
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        bonding_curve_phase: 'graduated',
        graduated_at: now.toISOString(),
      })
      .eq('id', agentId);

    if (updateError) {
      throw new Error(`Failed to update agent: ${updateError.message}`);
    }

    // Create graduation event record
    await supabase
      .from('agent_graduation_events')
      .insert({
        agent_id: agentId,
        graduation_status: 'completed',
        graduation_timestamp: now.toISOString(),
        prompt_raised_at_graduation: promptRaised,
        metadata: {
          sharesSold,
          holdersCount: holders.length,
          lpTokens,
          totalRewards,
          teamAllocation: CONSTANTS.TEAM_ALLOCATION,
          vaultAllocation: CONSTANTS.VAULT_ALLOCATION,
        },
      });

    const response = {
      success: true,
      agentId,
      graduation: {
        timestamp: now.toISOString(),
        promptRaised,
        sharesSold,
        holdersCount: holders.length,
      },
      allocations: {
        vault: CONSTANTS.VAULT_ALLOCATION,
        team: CONSTANTS.TEAM_ALLOCATION,
        holderShares: sharesSold,
        holderRewards: totalRewards,
        lpTokens,
        lpLocked,
        lpToVault,
      },
      vesting: {
        holderRewardVestEnd: vestEndTime.toISOString(),
        teamCliff1: cliff1Time.toISOString(),
        teamCliff2: cliff2Time.toISOString(),
        lpUnlock: lpUnlockTime.toISOString(),
      },
      // On-chain execution details would go here
      onChainPending: true,
      message: 'Graduation recorded in database. On-chain execution pending.',
    };

    console.log(`[graduation-manager-v6] Graduation completed:`, response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[graduation-manager-v6] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
