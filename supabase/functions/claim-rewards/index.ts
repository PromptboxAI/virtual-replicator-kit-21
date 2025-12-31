import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitExceededResponse
} from '../_shared/rateLimitV2.ts';

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

    // Rate limiting - strict for financial operations (10 claims per minute)
    const clientId = getClientIdentifier(req);
    const rateCheck = await checkRateLimit(supabase, clientId, 'claim-rewards', 10, 60);

    if (!rateCheck.allowed) {
      console.warn(`[claim-rewards] Rate limit exceeded for ${clientId}`);
      return rateLimitExceededResponse(rateCheck, corsHeaders, 10);
    }

    const body: ClaimRequest = await req.json();
    const { agentId, walletAddress, claimType } = body;

    if (!agentId || !walletAddress || !claimType) {
      throw new Error('Missing required parameters: agentId, walletAddress, claimType');
    }

    console.log(`[claim-rewards] ${claimType} claim for agent ${agentId} by ${walletAddress}`);

    // Use atomic RPC function (prevents race condition / double-claim)
    const { data: result, error } = await supabase.rpc('atomic_claim_reward', {
      p_agent_id: agentId,
      p_holder_address: walletAddress,
      p_claim_type: claimType
    });

    if (error) {
      console.error(`[claim-rewards] RPC error: ${error.message}`);
      throw new Error(`Claim failed: ${error.message}`);
    }

    if (!result.success) {
      console.warn(`[claim-rewards] Claim rejected: ${result.error}`);
      return new Response(JSON.stringify({
        success: false,
        error: result.error,
        details: result,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[claim-rewards] Successfully claimed ${result.claimed_amount} tokens`);

    return new Response(JSON.stringify({
      success: true,
      claimType,
      agentId,
      walletAddress,
      claimedAmount: result.claimed_amount,
      totalReward: result.total_reward,
      remainingToClaim: result.remaining,
      // On-chain execution would happen here
      onChainPending: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[claim-rewards] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
