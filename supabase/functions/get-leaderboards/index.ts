import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const metric = url.searchParams.get('metric') || 'market_cap';
    const timeframe = url.searchParams.get('timeframe') || '24h';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    console.log(`Fetching leaderboard: ${metric} ${timeframe}, limit: ${limit}`);

    // Try to get from cache first
    const { data: cached, error: cacheError } = await supabase
      .from('leaderboards_cache')
      .select('rankings, updated_at')
      .eq('metric', metric)
      .eq('timeframe', timeframe)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') {
      console.error('Cache lookup error:', cacheError);
    }

    // If cache exists and is less than 5 minutes old, return it
    if (cached && cached.rankings) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      if (cacheAge < 5 * 60 * 1000) {
        console.log('Returning cached leaderboard data');
        return new Response(
          JSON.stringify({ 
            success: true,
            data: (cached.rankings as any[]).slice(0, limit),
            source: 'cache',
            cached_at: cached.updated_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fall back to live query if cache is stale or missing
    console.log('Cache miss or stale, fetching live data');
    let query = supabase
      .from('agent_prices_latest')
      .select('*')
      .order(getOrderColumn(metric), { ascending: false })
      .limit(limit);

    // Apply timeframe filters
    if (timeframe !== 'all_time') {
      const hoursAgo = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
      const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
      query = query.gte('updated_at', cutoffTime);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: data || [],
        source: 'live'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-leaderboards:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getOrderColumn(metric: string): string {
  switch (metric) {
    case 'market_cap':
      return 'market_cap';
    case 'volume':
      return 'volume_24h';
    case 'price_change':
      return 'price_change_24h';
    case 'holders':
      return 'token_holders';
    default:
      return 'market_cap';
  }
}
