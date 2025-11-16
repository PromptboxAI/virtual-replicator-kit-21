import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    console.log('Fetching market overview...');

    // Get aggregated stats from agent_prices_latest
    const { data: stats, error: statsError } = await supabase
      .from('agent_prices_latest')
      .select('market_cap, volume_24h, token_holders')
      .eq('is_active', true);

    if (statsError) {
      throw statsError;
    }

    // Calculate totals
    const totalMarketCap = stats?.reduce((sum, agent) => sum + (agent.market_cap || 0), 0) || 0;
    const totalVolume24h = stats?.reduce((sum, agent) => sum + (agent.volume_24h || 0), 0) || 0;
    const totalHolders = stats?.reduce((sum, agent) => sum + (agent.token_holders || 0), 0) || 0;
    const activeAgents = stats?.length || 0;

    // Get top gainers (last 24h)
    const { data: gainers, error: gainersError } = await supabase
      .from('agent_prices_latest')
      .select('*')
      .eq('is_active', true)
      .order('price_change_24h', { ascending: false })
      .limit(5);

    if (gainersError) {
      console.error('Error fetching gainers:', gainersError);
    }

    // Get top losers (last 24h)
    const { data: losers, error: losersError } = await supabase
      .from('agent_prices_latest')
      .select('*')
      .eq('is_active', true)
      .order('price_change_24h', { ascending: true })
      .limit(5);

    if (losersError) {
      console.error('Error fetching losers:', losersError);
    }

    const overview = {
      totalMarketCap,
      totalVolume24h,
      totalHolders,
      activeAgents,
      topGainers: gainers || [],
      topLosers: losers || [],
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        data: overview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-market-overview:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
