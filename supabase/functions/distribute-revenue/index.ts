import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, revenueAmount, source } = await req.json();
    
    if (!agentId || !revenueAmount || revenueAmount <= 0) {
      throw new Error('Invalid agentId or revenueAmount');
    }

    console.log(`[REVENUE-DISTRIBUTION] Distributing $${revenueAmount} for agent ${agentId}`);

    // Get all token holders for this agent
    const { data: holders, error: holdersError } = await supabase
      .from('agent_token_holders')
      .select('user_id, token_balance')
      .eq('agent_id', agentId)
      .gt('token_balance', 0);

    if (holdersError) {
      throw new Error(`Failed to fetch token holders: ${holdersError.message}`);
    }

    if (!holders || holders.length === 0) {
      console.log(`[REVENUE-DISTRIBUTION] No token holders found for agent ${agentId}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'No token holders to distribute revenue to',
        distributed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate total tokens in circulation among holders
    const totalTokens = holders.reduce((sum, holder) => sum + holder.token_balance, 0);
    
    if (totalTokens === 0) {
      throw new Error('No tokens in circulation');
    }

    console.log(`[REVENUE-DISTRIBUTION] Total tokens in circulation: ${totalTokens}`);

    // Distribute revenue proportionally to token holdings
    const distributions = [];
    let totalDistributed = 0;

    for (const holder of holders) {
      const proportion = holder.token_balance / totalTokens;
      const userShare = revenueAmount * proportion;
      
      if (userShare > 0.01) { // Only distribute if share is more than 1 cent
        // Update user's token balance with distributed revenue
        const { error: updateError } = await supabase
          .from('user_token_balances')
          .upsert({
            user_id: holder.user_id,
            balance: supabase.sql`balance + ${userShare}`
          }, { onConflict: 'user_id' });

        if (updateError) {
          console.error(`[REVENUE-DISTRIBUTION] Failed to update balance for user ${holder.user_id}:`, updateError);
        } else {
          distributions.push({
            user_id: holder.user_id,
            token_balance: holder.token_balance,
            proportion: proportion,
            revenue_share: userShare
          });
          totalDistributed += userShare;
        }
      }
    }

    // Record the revenue distribution event
    await supabase
      .from('agent_activities')
      .insert({
        agent_id: agentId,
        activity_type: 'revenue_distribution',
        title: 'Revenue Distributed to Token Holders',
        description: `Distributed $${totalDistributed.toFixed(2)} to ${distributions.length} token holders`,
        status: 'completed',
        result: {
          total_revenue: revenueAmount,
          distributed_amount: totalDistributed,
          holders_count: distributions.length,
          source: source || 'autonomous_execution',
          distributions: distributions
        }
      });

    // Update agent's total revenue generated
    const { data: currentStatus } = await supabase
      .from('agent_runtime_status')
      .select('revenue_generated')
      .eq('agent_id', agentId)
      .single();

    await supabase
      .from('agent_runtime_status')
      .upsert({
        agent_id: agentId,
        revenue_generated: (currentStatus?.revenue_generated || 0) + revenueAmount
      }, { onConflict: 'agent_id' });

    console.log(`[REVENUE-DISTRIBUTION] Successfully distributed $${totalDistributed} to ${distributions.length} holders`);

    return new Response(JSON.stringify({
      success: true,
      total_revenue: revenueAmount,
      distributed_amount: totalDistributed,
      holders_count: distributions.length,
      distributions: distributions,
      message: `Successfully distributed $${totalDistributed.toFixed(2)} to ${distributions.length} token holders`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[REVENUE-DISTRIBUTION] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});