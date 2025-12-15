import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const chainId = url.searchParams.get('chainId');
    const testMode = url.searchParams.get('testMode');
    const category = url.searchParams.get('category');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Fetching trending tokens: limit=${limit}, chainId=${chainId}`);

    // Get trades from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Fetch buy trades
    const { data: buyTrades, error: buyError } = await supabase
      .from('agent_token_buy_trades')
      .select('agent_id, prompt_amount, created_at')
      .gte('created_at', twentyFourHoursAgo);

    // Fetch sell trades
    const { data: sellTrades, error: sellError } = await supabase
      .from('agent_token_sell_trades')
      .select('agent_id, prompt_amount, created_at')
      .gte('created_at', twentyFourHoursAgo);

    if (buyError || sellError) {
      console.error('Error fetching trades:', buyError || sellError);
      throw buyError || sellError;
    }

    // Aggregate trades by agent
    const allTrades = [...(buyTrades || []), ...(sellTrades || [])];
    const tradeStats: Record<string, {
      trades_24h: number;
      volume_24h: number;
      trades_1h: number;
      volume_1h: number;
    }> = {};

    for (const trade of allTrades) {
      if (!tradeStats[trade.agent_id]) {
        tradeStats[trade.agent_id] = { trades_24h: 0, volume_24h: 0, trades_1h: 0, volume_1h: 0 };
      }
      const amount = parseFloat(trade.prompt_amount) || 0;
      tradeStats[trade.agent_id].trades_24h++;
      tradeStats[trade.agent_id].volume_24h += amount;

      if (new Date(trade.created_at) >= new Date(oneHourAgo)) {
        tradeStats[trade.agent_id].trades_1h++;
        tradeStats[trade.agent_id].volume_1h += amount;
      }
    }

    // Calculate trending scores
    // Formula: (trades_1h * volume_1h) / max(volume_24h, 1) * log(trades_24h + 1)
    const scoredAgents = Object.entries(tradeStats)
      .map(([agentId, stats]) => {
        const velocityScore = (stats.trades_1h * stats.volume_1h) / Math.max(stats.volume_24h, 1);
        const activityBonus = Math.log(stats.trades_24h + 1);
        const trendingScore = velocityScore * activityBonus;
        
        return {
          agentId,
          trendingScore,
          trades_1h: stats.trades_1h,
          volume_1h: stats.volume_1h,
          trades_24h: stats.trades_24h,
          volume_24h: stats.volume_24h,
          volume_change_pct: stats.volume_24h > 0 
            ? ((stats.volume_1h * 24 - stats.volume_24h) / stats.volume_24h) * 100 
            : 0
        };
      })
      .filter(a => a.trendingScore > 0)
      .sort((a, b) => b.trendingScore - a.trendingScore);

    if (scoredAgents.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: [],
        source: 'live'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get agent details
    const topAgentIds = scoredAgents.slice(0, limit * 2).map(a => a.agentId);
    
    let agentQuery = supabase
      .from('agents')
      .select('id, symbol, name, avatar_url, current_price, market_cap, volume_24h, price_change_24h, token_holders, category, created_at, token_graduated, chain_id')
      .in('id', topAgentIds)
      .eq('is_active', true);

    if (chainId) {
      agentQuery = agentQuery.eq('chain_id', parseInt(chainId));
    } else if (testMode === 'true') {
      agentQuery = agentQuery.eq('chain_id', 84532);
    } else if (testMode === 'false') {
      agentQuery = agentQuery.eq('chain_id', 8453);
    }

    if (category) {
      agentQuery = agentQuery.eq('category', category);
    }

    const { data: agents, error: agentError } = await agentQuery;

    if (agentError) {
      throw agentError;
    }

    // Merge agent data with trending scores
    const agentMap = new Map((agents || []).map(a => [a.id, a]));
    const result = scoredAgents
      .filter(s => agentMap.has(s.agentId))
      .slice(0, limit)
      .map(s => {
        const agent = agentMap.get(s.agentId)!;
        return {
          ...agent,
          trending_score: Math.round(s.trendingScore * 100) / 100,
          trades_1h: s.trades_1h,
          volume_1h: Math.round(s.volume_1h * 100) / 100,
          trades_24h: s.trades_24h,
          volume_change_pct: Math.round(s.volume_change_pct * 100) / 100
        };
      });

    return new Response(JSON.stringify({
      success: true,
      data: result,
      source: 'live'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-trending:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
