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
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's token holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from('agent_token_holders')
      .select('agent_id, token_balance, total_invested, average_buy_price, realized_profit_loss, created_at')
      .eq('user_id', user.id)
      .gt('token_balance', 0)
      .order('token_balance', { ascending: false });

    if (holdingsError) {
      console.error('Error fetching holdings:', holdingsError);
      throw holdingsError;
    }

    if (!holdings || holdings.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          holdings: [],
          total_value_prompt: 0,
          total_invested: 0,
          total_pnl: 0,
          total_pnl_percent: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch agent details for all holdings
    const agentIds = holdings.map(h => h.agent_id);
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, symbol, avatar_url, current_price, price_change_24h, token_graduated')
      .in('id', agentIds);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      throw agentsError;
    }

    const agentMap = new Map(
      (agents || []).map(a => [a.id, a])
    );

    // Calculate portfolio with P&L
    let totalValuePrompt = 0;
    let totalInvested = 0;
    let totalRealizedPnl = 0;

    const enrichedHoldings = holdings.map(holding => {
      const agent = agentMap.get(holding.agent_id);
      const currentPrice = agent?.current_price || 0;
      const currentValue = Number(holding.token_balance) * Number(currentPrice);
      const invested = Number(holding.total_invested) || 0;
      const unrealizedPnl = currentValue - invested;
      const unrealizedPnlPercent = invested > 0 ? (unrealizedPnl / invested) * 100 : 0;

      totalValuePrompt += currentValue;
      totalInvested += invested;
      totalRealizedPnl += Number(holding.realized_profit_loss) || 0;

      return {
        agent_id: holding.agent_id,
        agent_name: agent?.name || 'Unknown',
        agent_symbol: agent?.symbol || '???',
        agent_avatar_url: agent?.avatar_url || null,
        is_graduated: agent?.token_graduated || false,
        token_balance: holding.token_balance,
        average_buy_price: holding.average_buy_price,
        current_price: currentPrice,
        price_change_24h: agent?.price_change_24h || 0,
        total_invested: invested,
        current_value: currentValue,
        unrealized_pnl: unrealizedPnl,
        unrealized_pnl_percent: unrealizedPnlPercent.toFixed(2),
        realized_pnl: holding.realized_profit_loss || 0,
        first_bought_at: holding.created_at,
      };
    });

    // Sort by current value (highest first)
    enrichedHoldings.sort((a, b) => b.current_value - a.current_value);

    const totalPnl = (totalValuePrompt - totalInvested) + totalRealizedPnl;
    const totalPnlPercent = totalInvested > 0 ? ((totalValuePrompt - totalInvested) / totalInvested) * 100 : 0;

    console.log(`Fetched portfolio for user ${user.id}: ${enrichedHoldings.length} holdings`);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: user.id,
        holdings: enrichedHoldings,
        summary: {
          total_value_prompt: totalValuePrompt,
          total_invested: totalInvested,
          total_unrealized_pnl: totalValuePrompt - totalInvested,
          total_realized_pnl: totalRealizedPnl,
          total_pnl: totalPnl,
          total_pnl_percent: totalPnlPercent.toFixed(2),
          holdings_count: enrichedHoldings.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-user-portfolio:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
