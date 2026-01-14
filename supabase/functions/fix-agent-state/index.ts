import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const agentId = body.agentId;
    // Accept both camelCase and snake_case
    const currentPrice = body.currentPrice ?? body.current_price;
    const onChainPrice = body.onChainPrice ?? body.on_chain_price;
    const creatorPrebuyAmount = body.creatorPrebuyAmount ?? body.creator_prebuy_amount;
    const tokenHolders = body.tokenHolders ?? body.token_holders;
    const ensureRuntimeStatus = body.ensureRuntimeStatus ?? body.ensure_runtime_status;

    if (!agentId) {
      return new Response(JSON.stringify({ error: 'agentId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (currentPrice !== undefined) updates.current_price = currentPrice;
    if (onChainPrice !== undefined) updates.on_chain_price = onChainPrice;
    if (creatorPrebuyAmount !== undefined) updates.creator_prebuy_amount = creatorPrebuyAmount;
    if (tokenHolders !== undefined) updates.token_holders = tokenHolders;

    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .select('id, name, current_price, on_chain_price, creator_prebuy_amount, token_holders')
      .single();

    if (error) throw error;

    // Optionally ensure runtime status exists
    let runtimeStatus = null;
    if (ensureRuntimeStatus) {
      // Check if runtime status exists
      const { data: existingStatus } = await supabase
        .from('agent_runtime_status')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (!existingStatus) {
        // Create runtime status
        const { data: newStatus, error: insertError } = await supabase
          .from('agent_runtime_status')
          .insert({
            agent_id: agentId,
            is_active: false,
            current_goal: `Awaiting AI configuration for ${data?.name || 'agent'}`,
            performance_metrics: {},
            revenue_generated: 0,
            tasks_completed: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating runtime status:', insertError);
        } else {
          runtimeStatus = newStatus;
        }
      } else {
        runtimeStatus = existingStatus;
      }
    }

    return new Response(JSON.stringify({ ok: true, data, runtimeStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
