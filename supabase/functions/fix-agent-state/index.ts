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

    const { agentId, currentPrice, onChainPrice, creatorPrebuyAmount } = await req.json();

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

    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .select('id, current_price, on_chain_price, creator_prebuy_amount')
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
