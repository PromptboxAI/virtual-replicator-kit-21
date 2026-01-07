/**
 * V7 Graduation Manager
 * 
 * Handles the graduation process for agents that reach the threshold.
 * 
 * Process:
 * 1. Snapshot all holder positions
 * 2. Mark agent as graduated
 * 3. Prepare graduation event record
 * 4. (Smart contract deployment handled separately)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const V7 = {
  GRADUATION_THRESHOLD: 42160,
  TOTAL_SUPPLY: 1_000_000_000,
  LP_ALLOCATION: 140_000_000,
};

interface HolderSnapshot {
  wallet_address: string;
  token_balance: number;
  percentage: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body = await req.json();
    const { agentId, action } = body;
    
    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Missing agentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();
    
    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ CHECK ELIGIBILITY ============
    if (action === 'check') {
      const promptRaised = agent.prompt_raised ?? 0;
      const eligible = promptRaised >= V7.GRADUATION_THRESHOLD;
      
      return new Response(
        JSON.stringify({
          agentId,
          eligible,
          promptRaised,
          threshold: V7.GRADUATION_THRESHOLD,
          remaining: Math.max(0, V7.GRADUATION_THRESHOLD - promptRaised),
          isGraduated: agent.token_graduated ?? false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ INITIATE GRADUATION ============
    if (action === 'graduate') {
      // Check if already graduated
      if (agent.token_graduated) {
        return new Response(
          JSON.stringify({ error: 'Agent already graduated' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check threshold
      const promptRaised = agent.prompt_raised ?? 0;
      if (promptRaised < V7.GRADUATION_THRESHOLD) {
        return new Response(
          JSON.stringify({ 
            error: 'Agent has not reached graduation threshold',
            promptRaised,
            threshold: V7.GRADUATION_THRESHOLD,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`[V7 Graduation] Starting graduation for agent ${agentId}`);
      
      // Step 1: Snapshot holders
      const { data: positions, error: posError } = await supabase
        .from('agent_database_positions')
        .select('holder_address, token_balance')
        .eq('agent_id', agentId)
        .gt('token_balance', 0);
      
      if (posError) {
        console.error('Failed to fetch positions:', posError);
        return new Response(
          JSON.stringify({ error: 'Failed to snapshot holders' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const sharesSold = agent.shares_sold ?? 0;
      const holderSnapshots: HolderSnapshot[] = (positions || []).map(p => ({
        wallet_address: p.holder_address,
        token_balance: p.token_balance,
        percentage: sharesSold > 0 ? (p.token_balance / sharesSold) * 100 : 0,
      }));
      
      console.log(`[V7 Graduation] Snapshotted ${holderSnapshots.length} holders`);
      
      // Step 2: Create graduation event record
      const graduationData = {
        agent_id: agentId,
        graduation_status: 'pending',
        graduation_timestamp: new Date().toISOString(),
        prompt_raised_at_graduation: promptRaised,
        metadata: {
          shares_sold: sharesSold,
          holder_count: holderSnapshots.length,
          holder_snapshots: holderSnapshots,
          v7_params: {
            total_supply: V7.TOTAL_SUPPLY,
            lp_allocation: V7.LP_ALLOCATION,
          },
        },
      };
      
      const { error: gradError } = await supabase
        .from('agent_graduation_events')
        .insert(graduationData);
      
      if (gradError) {
        console.error('Failed to create graduation event:', gradError);
        return new Response(
          JSON.stringify({ error: 'Failed to create graduation event' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Step 3: Update agent_graduation status
      await supabase
        .from('agent_graduation')
        .upsert({
          agent_id: agentId,
          status: 'pending',
          reason: 'threshold_reached',
          triggered_at: new Date().toISOString(),
          snapshot: {
            shares_sold: sharesSold,
            prompt_raised: promptRaised,
            holders: holderSnapshots,
          },
        });
      
      // Step 4: Mark agent as graduated (pauses bonding curve trading)
      const { error: updateError } = await supabase
        .from('agents')
        .update({ 
          token_graduated: true,
          graduated_at: new Date().toISOString(),
        })
        .eq('id', agentId);
      
      if (updateError) {
        console.error('Failed to update agent graduation status:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to mark agent as graduated' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`[V7 Graduation] Agent ${agentId} marked as graduated`);
      
      return new Response(
        JSON.stringify({
          success: true,
          agentId,
          status: 'pending',
          message: 'Graduation initiated. Smart contract deployment pending.',
          data: {
            promptRaised,
            sharesSold,
            holderCount: holderSnapshots.length,
            nextSteps: [
              'Deploy ERC-20 token contract',
              'Mint 1B tokens',
              'Distribute to holders based on snapshot',
              'Create LP with 140M tokens',
              'Lock 95% of LP for 3 years',
            ],
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ============ GET STATUS ============
    if (action === 'status') {
      const { data: gradEvent } = await supabase
        .from('agent_graduation_events')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      const { data: gradStatus } = await supabase
        .from('agent_graduation')
        .select('*')
        .eq('agent_id', agentId)
        .single();
      
      return new Response(
        JSON.stringify({
          agentId,
          isGraduated: agent.is_graduated ?? false,
          graduatedAt: agent.graduated_at,
          event: gradEvent,
          status: gradStatus,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: check, graduate, status' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[V7 Graduation] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
