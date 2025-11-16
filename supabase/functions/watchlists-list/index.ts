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

    // Get user's watchlist (RLS enforced - user can only see their own)
    const { data: watchlists, error: watchlistError } = await supabase
      .from('watchlists')
      .select('agent_id, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (watchlistError) {
      console.error('Watchlist fetch error:', watchlistError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch watchlist' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!watchlists || watchlists.length === 0) {
      console.log('Empty watchlist for user:', user.id);
      return new Response(
        JSON.stringify({ watchlist: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agent IDs
    const agentIds = watchlists.map(w => w.agent_id);

    // Fetch latest prices for watchlisted agents
    const { data: agents, error: agentsError } = await supabase
      .from('agent_prices_latest')
      .select('*')
      .in('agent_id', agentIds);

    if (agentsError) {
      console.error('Agents fetch error:', agentsError);
      // Fallback to agents table if materialized view fails
      const { data: fallbackAgents, error: fallbackError } = await supabase
        .from('agents')
        .select('id, symbol, name, current_price, market_cap, volume_24h, price_change_24h, token_holders, avatar_url, category')
        .in('id', agentIds);

      if (fallbackError) {
        console.error('Fallback fetch error:', fallbackError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch agent data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Map fallback data
      const watchlistData = watchlists.map(w => {
        const agent = fallbackAgents?.find(a => a.id === w.agent_id);
        return {
          ...agent,
          watchlisted_at: w.created_at
        };
      }).filter(Boolean);

      return new Response(
        JSON.stringify({ watchlist: watchlistData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine watchlist metadata with agent data
    const watchlistData = watchlists.map(w => {
      const agent = agents?.find(a => a.agent_id === w.agent_id);
      return {
        ...agent,
        watchlisted_at: w.created_at
      };
    }).filter(Boolean);

    console.log(`Fetched ${watchlistData.length} watchlisted agents for user ${user.id}`);

    return new Response(
      JSON.stringify({ watchlist: watchlistData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in watchlists-list:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
