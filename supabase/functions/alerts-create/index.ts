import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { agentId, direction, thresholdPrice } = await req.json();

    if (!agentId || !direction || !thresholdPrice) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agentId, direction, thresholdPrice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (direction !== 'above' && direction !== 'below') {
      return new Response(
        JSON.stringify({ error: 'Invalid direction. Must be "above" or "below"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof thresholdPrice !== 'number' || thresholdPrice <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid thresholdPrice. Must be a positive number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, symbol, current_price')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create price alert (RLS enforced - user can only insert their own)
    const { data: alert, error: insertError } = await supabase
      .from('price_alerts')
      .insert({
        owner_id: user.id,
        agent_id: agentId,
        direction,
        threshold_price: thresholdPrice,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create alert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Alert created:', {
      userId: user.id,
      agentId,
      direction,
      thresholdPrice,
      alertId: alert.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        alertId: alert.id,
        alert: {
          ...alert,
          agent_name: agent.name,
          agent_symbol: agent.symbol,
          current_price: agent.current_price
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in alerts-create:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
