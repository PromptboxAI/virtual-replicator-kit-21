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

    const { agentId, action } = await req.json();

    if (!agentId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agentId, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action !== 'add' && action !== 'remove') {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "add" or "remove"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let watchlisted = false;

    if (action === 'add') {
      // Add to watchlist (RLS enforced - user can only insert their own)
      const { error: insertError } = await supabase
        .from('watchlists')
        .insert({ owner_id: user.id, agent_id: agentId });

      if (insertError) {
        // Check if it's a duplicate (already watchlisted)
        if (insertError.code === '23505') {
          console.log('Agent already in watchlist');
          watchlisted = true;
        } else {
          console.error('Insert error:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to add to watchlist' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.log('Added to watchlist:', { userId: user.id, agentId });
        watchlisted = true;
      }
    } else {
      // Remove from watchlist (RLS enforced - user can only delete their own)
      const { error: deleteError } = await supabase
        .from('watchlists')
        .delete()
        .eq('owner_id', user.id)
        .eq('agent_id', agentId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to remove from watchlist' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Removed from watchlist:', { userId: user.id, agentId });
      watchlisted = false;
    }

    return new Response(
      JSON.stringify({ success: true, watchlisted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in watchlists-upsert:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
