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
    const agentId = url.searchParams.get('agentId');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch buy trades
    const { data: buyTrades, error: buyError } = await supabase
      .from('agent_token_buy_trades')
      .select('id, user_id, token_amount, prompt_amount, price_per_token, bonding_curve_price, created_at, transaction_hash')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (buyError) {
      console.error('Error fetching buy trades:', buyError);
      throw buyError;
    }

    // Fetch sell trades
    const { data: sellTrades, error: sellError } = await supabase
      .from('agent_token_sell_trades')
      .select('id, user_id, token_amount, prompt_amount, price_per_token, bonding_curve_price, created_at, transaction_hash')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sellError) {
      console.error('Error fetching sell trades:', sellError);
      throw sellError;
    }

    // Combine and sort trades
    const allTrades = [
      ...(buyTrades || []).map(t => ({ ...t, type: 'buy' as const })),
      ...(sellTrades || []).map(t => ({ ...t, type: 'sell' as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, limit);

    // Get unique user IDs to fetch profile info
    const userIds = [...new Set(allTrades.map(t => t.user_id))];
    
    // Fetch profiles for user display names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, wallet_address')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    // Enrich trades with profile data
    const enrichedTrades = allTrades.map(trade => ({
      id: trade.id,
      type: trade.type,
      user_id: trade.user_id,
      user_display_name: profileMap.get(trade.user_id)?.display_name || null,
      user_avatar_url: profileMap.get(trade.user_id)?.avatar_url || null,
      wallet_address: profileMap.get(trade.user_id)?.wallet_address || null,
      token_amount: trade.token_amount,
      prompt_amount: trade.prompt_amount,
      price_per_token: trade.price_per_token,
      bonding_curve_price: trade.bonding_curve_price,
      transaction_hash: trade.transaction_hash,
      timestamp: trade.created_at,
    }));

    console.log(`Fetched ${enrichedTrades.length} trades for agent ${agentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        agent_id: agentId,
        trades: enrichedTrades,
        count: enrichedTrades.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-recent-trades:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
