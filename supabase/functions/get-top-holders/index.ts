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
    let agentId = url.searchParams.get('agentId');
    const address = url.searchParams.get('address');
    const chainId = url.searchParams.get('chainId') || '84532';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If address provided instead of agentId, look up the agent
    if (!agentId && address) {
      const { data: agent, error: lookupError } = await supabase
        .from('agents')
        .select('id')
        .ilike('token_address', address.toLowerCase())
        .eq('chain_id', parseInt(chainId))
        .maybeSingle();

      if (lookupError || !agent) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Token not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      agentId = agent.id;
    }

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId or address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch agent's total supply and circulating supply - use maybeSingle to avoid error on no rows
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('total_supply, circulating_supply, bonding_curve_supply')
      .eq('id', agentId)
      .maybeSingle();

    if (agentError) {
      console.error('Error fetching agent:', agentError);
      throw agentError;
    }

    if (!agent) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Agent not found', agent_id: agentId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use bonding_curve_supply as circulating (tokens actually traded)
    const circulatingSupply = agent?.bonding_curve_supply || agent?.circulating_supply || 0;

    // Fetch top holders by token_balance
    const { data: holders, error: holdersError } = await supabase
      .from('agent_token_holders')
      .select('user_id, token_balance, total_invested, average_buy_price, created_at')
      .eq('agent_id', agentId)
      .gt('token_balance', 0)
      .order('token_balance', { ascending: false })
      .limit(limit);

    if (holdersError) {
      console.error('Error fetching holders:', holdersError);
      throw holdersError;
    }

    if (!holders || holders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          agent_id: agentId,
          holders: [],
          total_holders: 0,
          circulating_supply: circulatingSupply,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique user IDs to fetch profile info
    const userIds = holders.map(h => h.user_id);
    
    // Fetch profiles for user display names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, wallet_address')
      .in('user_id', userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    // Calculate total held by top holders
    const totalHeldByTop = holders.reduce((sum, h) => sum + Number(h.token_balance), 0);

    // Helper to detect if address looks like a contract (starts with 0x and is 42 chars)
    const isContractAddress = (addr: string | null): boolean => {
      if (!addr) return false;
      // Simple heuristic: contracts tend to have specific patterns
      // In production, you'd query the blockchain, but for now we mark all as false
      return false;
    };

    // Enrich holders with profile data and percentages - trade app format
    const enrichedHolders = holders.map((holder, index) => {
      const percentage = circulatingSupply > 0 
        ? (Number(holder.token_balance) / Number(circulatingSupply)) * 100 
        : 0;
      
      const profile = profileMap.get(holder.user_id);
      const walletAddr = profile?.wallet_address || null;
      
      return {
        rank: index + 1,
        // Trade app format
        address: walletAddr,
        balance: Number(holder.token_balance),
        percent_owned: Number(Math.min(percentage, 100).toFixed(2)),
        is_contract: isContractAddress(walletAddr),
        // Extended fields (backwards compatible)
        user_id: holder.user_id,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        wallet_address: walletAddr,
        token_balance: holder.token_balance,
        percentage: Math.min(percentage, 100).toFixed(2),
        total_invested: holder.total_invested,
        average_buy_price: holder.average_buy_price,
        first_bought_at: holder.created_at,
      };
    });

    // Get total unique holders count
    const { count: totalHolders } = await supabase
      .from('agent_token_holders')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .gt('token_balance', 0);

    console.log(`Fetched ${enrichedHolders.length} top holders for agent ${agentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        agent_id: agentId,
        holders: enrichedHolders,
        total_holders: totalHolders || 0,
        circulating_supply: circulatingSupply,
        top_holders_percentage: circulatingSupply > 0 
          ? ((totalHeldByTop / Number(circulatingSupply)) * 100).toFixed(2)
          : '0',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-top-holders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
