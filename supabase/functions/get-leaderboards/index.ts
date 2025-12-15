import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface LeaderboardToken {
  id: string;
  symbol: string;
  name: string;
  avatar_url: string | null;
  current_price: number;
  market_cap: number;
  volume_24h: number;
  price_change_24h: number;
  token_holders: number;
  category: string | null;
  created_at: string;
  deployed_at: string | null;
  token_graduated: boolean;
  chain_id: number;
  trending_score?: number;
  tx_count?: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || url.searchParams.get('metric') || 'market_cap';
    const timeframe = url.searchParams.get('timeframe') || '24h';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
    const category = url.searchParams.get('category');
    const chainId = url.searchParams.get('chainId');
    const testMode = url.searchParams.get('testMode');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Fetching leaderboard: type=${type}, timeframe=${timeframe}, limit=${limit}, page=${page}, category=${category}, chainId=${chainId}`);

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get timeframe cutoff
    const hoursMap: Record<string, number> = {
      '1h': 1,
      '24h': 24,
      '7d': 168,
      '30d': 720
    };
    const hours = hoursMap[timeframe] || 24;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Handle special types that need trade data
    if (type === 'trending' || type === 'most_traded') {
      const result = await handleTrendingOrMostTraded(supabase, type, timeframe, limit, page, offset, category, chainId, testMode, cutoffTime);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build base query for standard types
    let query = supabase
      .from('agents')
      .select('id, symbol, name, avatar_url, current_price, market_cap, volume_24h, price_change_24h, token_holders, category, created_at, deployed_at, token_graduated, chain_id, is_active', { count: 'exact' })
      .eq('is_active', true);

    // Apply chain filter
    if (chainId) {
      query = query.eq('chain_id', parseInt(chainId));
    } else if (testMode === 'true') {
      query = query.eq('chain_id', 84532);
    } else if (testMode === 'false') {
      query = query.eq('chain_id', 8453);
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply type-specific filters and ordering
    switch (type) {
      case 'market_cap':
        query = query.order('market_cap', { ascending: false, nullsFirst: false });
        break;
      case 'volume':
        query = query.order('volume_24h', { ascending: false, nullsFirst: false });
        break;
      case 'gainers':
      case 'price_change':
        query = query.gt('price_change_24h', 0).order('price_change_24h', { ascending: false, nullsFirst: false });
        break;
      case 'losers':
        query = query.lt('price_change_24h', 0).order('price_change_24h', { ascending: true, nullsFirst: false });
        break;
      case 'new':
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', sevenDaysAgo).order('created_at', { ascending: false });
        break;
      case 'holders':
        query = query.order('token_holders', { ascending: false, nullsFirst: false });
        break;
      case 'graduated':
        query = query.eq('token_graduated', true).order('updated_at', { ascending: false });
        break;
      default:
        query = query.order('market_cap', { ascending: false, nullsFirst: false });
    }

    // Apply timeframe filter for time-sensitive metrics
    if (['volume', 'gainers', 'losers', 'price_change'].includes(type) && timeframe !== 'all_time') {
      query = query.gte('updated_at', cutoffTime);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response = {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      } as PaginationInfo,
      filters: {
        type,
        timeframe,
        chainId: chainId ? parseInt(chainId) : null,
        category
      },
      source: 'live'
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-leaderboards:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleTrendingOrMostTraded(
  supabase: any,
  type: string,
  timeframe: string,
  limit: number,
  page: number,
  offset: number,
  category: string | null,
  chainId: string | null,
  testMode: string | null,
  cutoffTime: string
) {
  // Get trade counts and volumes from buy/sell tables
  const hoursForTrending = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : 168;
  const trendingCutoff = new Date(Date.now() - hoursForTrending * 60 * 60 * 1000).toISOString();
  const hourAgoCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Get recent trades aggregated by agent
  const { data: buyTrades, error: buyError } = await supabase
    .from('agent_token_buy_trades')
    .select('agent_id, prompt_amount, created_at')
    .gte('created_at', trendingCutoff);

  const { data: sellTrades, error: sellError } = await supabase
    .from('agent_token_sell_trades')
    .select('agent_id, prompt_amount, created_at')
    .gte('created_at', trendingCutoff);

  if (buyError || sellError) {
    console.error('Error fetching trades:', buyError || sellError);
    throw buyError || sellError;
  }

  // Combine and aggregate trades
  const allTrades = [...(buyTrades || []), ...(sellTrades || [])];
  const tradeStats: Record<string, { 
    trades_total: number; 
    volume_total: number; 
    trades_1h: number; 
    volume_1h: number;
  }> = {};

  for (const trade of allTrades) {
    if (!tradeStats[trade.agent_id]) {
      tradeStats[trade.agent_id] = { trades_total: 0, volume_total: 0, trades_1h: 0, volume_1h: 0 };
    }
    tradeStats[trade.agent_id].trades_total++;
    tradeStats[trade.agent_id].volume_total += parseFloat(trade.prompt_amount) || 0;
    
    if (new Date(trade.created_at) >= new Date(hourAgoCutoff)) {
      tradeStats[trade.agent_id].trades_1h++;
      tradeStats[trade.agent_id].volume_1h += parseFloat(trade.prompt_amount) || 0;
    }
  }

  // Get agent IDs sorted by metric
  let sortedAgentIds: string[];
  if (type === 'trending') {
    // Trending score = (trades_1h * volume_1h) / max(volume_total, 1)
    sortedAgentIds = Object.entries(tradeStats)
      .map(([agentId, stats]) => ({
        agentId,
        score: (stats.trades_1h * stats.volume_1h) / Math.max(stats.volume_total, 1)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.agentId);
  } else {
    // most_traded - sort by trade count
    sortedAgentIds = Object.entries(tradeStats)
      .sort((a, b) => b[1].trades_total - a[1].trades_total)
      .map(([agentId]) => agentId);
  }

  if (sortedAgentIds.length === 0) {
    return {
      success: true,
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      filters: { type, timeframe, chainId: chainId ? parseInt(chainId) : null, category },
      source: 'live'
    };
  }

  // Fetch agent details for the sorted IDs
  let agentQuery = supabase
    .from('agents')
    .select('id, symbol, name, avatar_url, current_price, market_cap, volume_24h, price_change_24h, token_holders, category, created_at, deployed_at, token_graduated, chain_id')
    .in('id', sortedAgentIds)
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

  // Sort agents by our calculated order and add scores
  const agentMap = new Map((agents || []).map(a => [a.id, a]));
  const sortedAgents = sortedAgentIds
    .filter(id => agentMap.has(id))
    .map(id => {
      const agent = agentMap.get(id)!;
      const stats = tradeStats[id];
      return {
        ...agent,
        trending_score: type === 'trending' 
          ? (stats.trades_1h * stats.volume_1h) / Math.max(stats.volume_total, 1)
          : undefined,
        tx_count: stats.trades_total
      };
    });

  const total = sortedAgents.length;
  const paginatedAgents = sortedAgents.slice(offset, offset + limit);
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data: paginatedAgents,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    filters: {
      type,
      timeframe,
      chainId: chainId ? parseInt(chainId) : null,
      category
    },
    source: 'live'
  };
}
