import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const creatorId = url.searchParams.get('creatorId');
    const creatorWallet = url.searchParams.get('creatorWallet');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    if (!creatorId && !creatorWallet) {
      return new Response(
        JSON.stringify({ error: 'creatorId or creatorWallet is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from('agents')
      .select(`
        id, name, symbol, description, category, avatar_url,
        current_price, market_cap, volume_24h, price_change_24h,
        token_holders, prompt_raised, token_graduated, is_active,
        created_at, creator_wallet_address, creator_ens_name
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by creator
    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    } else if (creatorWallet) {
      query = query.ilike('creator_wallet_address', creatorWallet);
    }

    // Optionally filter by active status
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: agents, error } = await query;

    if (error) {
      console.error('Error fetching creator agents:', error);
      throw error;
    }

    // Calculate aggregated stats
    const stats = {
      total_agents: (agents || []).length,
      total_volume: (agents || []).reduce((sum, a) => sum + (Number(a.volume_24h) || 0), 0),
      total_market_cap: (agents || []).reduce((sum, a) => sum + (Number(a.market_cap) || 0), 0),
      total_holders: (agents || []).reduce((sum, a) => sum + (a.token_holders || 0), 0),
      graduated_count: (agents || []).filter(a => a.token_graduated).length,
      active_count: (agents || []).filter(a => a.is_active).length,
    };

    // Get creator profile if creatorId provided
    let creatorProfile = null;
    if (creatorId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, bio, wallet_address')
        .eq('user_id', creatorId)
        .single();
      
      creatorProfile = profile;
    }

    console.log(`Fetched ${(agents || []).length} agents for creator ${creatorId || creatorWallet}`);

    return new Response(
      JSON.stringify({
        success: true,
        creator_id: creatorId || null,
        creator_wallet: creatorWallet || agents?.[0]?.creator_wallet_address || null,
        creator_profile: creatorProfile,
        agents: agents || [],
        stats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-creator-agents:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
