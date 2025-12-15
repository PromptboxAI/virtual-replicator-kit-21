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
    // Note: View uses mc_prompt/mc_usd, volume_24h, holders, change_24h_pct
    const { data: stats, error: statsError } = await supabase
      .from('agent_prices_latest')
      .select('mc_prompt, mc_usd, volume_24h, holders');

    if (statsError) {
      console.error('Stats query error, falling back to agents table:', statsError);
      // Fallback to agents table
      const { data: agentStats, error: agentError } = await supabase
        .from('agents')
        .select('market_cap, volume_24h, token_holders')
        .eq('is_active', true);
      
      if (agentError) throw agentError;
      
      const totalMarketCap = agentStats?.reduce((sum, agent) => sum + (agent.market_cap || 0), 0) || 0;
      const totalVolume24h = agentStats?.reduce((sum, agent) => sum + (agent.volume_24h || 0), 0) || 0;
      const totalHolders = agentStats?.reduce((sum, agent) => sum + (agent.token_holders || 0), 0) || 0;
      
      return new Response(
        JSON.stringify({ 
          success: true,
          data: {
            totalMarketCap,
            totalVolume24h,
            totalHolders,
            activeAgents: agentStats?.length || 0,
            topGainers: [],
            topLosers: [],
            timestamp: new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate totals using correct column names
    const totalMarketCap = stats?.reduce((sum, agent) => sum + (parseFloat(agent.mc_prompt) || 0), 0) || 0;
    const totalVolume24h = stats?.reduce((sum, agent) => sum + (parseFloat(agent.volume_24h) || 0), 0) || 0;
    const totalHolders = stats?.reduce((sum, agent) => sum + (agent.holders || 0), 0) || 0;
    const activeAgents = stats?.length || 0;

    // Get top gainers (last 24h) - use change_24h_pct
    const { data: gainers, error: gainersError } = await supabase
      .from('agent_prices_latest')
      .select('*')
      .order('change_24h_pct', { ascending: false, nullsFirst: false })
      .limit(5);

    if (gainersError) {
      console.error('Error fetching gainers:', gainersError);
    }

    // Get top losers (last 24h)
    const { data: losers, error: losersError } = await supabase
      .from('agent_prices_latest')
      .select('*')
      .order('change_24h_pct', { ascending: true, nullsFirst: false })
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
