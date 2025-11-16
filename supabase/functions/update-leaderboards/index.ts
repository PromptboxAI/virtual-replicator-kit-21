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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log('Starting leaderboards update...');

    const timeframes = ['24h', '7d', '30d', 'all_time'];
    const metrics = ['market_cap', 'volume', 'price_change', 'holders'];

    for (const timeframe of timeframes) {
      for (const metric of metrics) {
        let query = supabase
          .from('agent_prices_latest')
          .select('*')
          .order(getOrderColumn(metric), { ascending: false })
          .limit(100);

        // Apply timeframe filters for non-all_time
        if (timeframe !== 'all_time') {
          const hoursAgo = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
          const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
          query = query.gte('updated_at', cutoffTime);
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Error fetching ${metric} for ${timeframe}:`, error);
          continue;
        }

        // Upsert into leaderboards_cache
        const { error: upsertError } = await supabase
          .from('leaderboards_cache')
          .upsert({
            metric,
            timeframe,
            rankings: data || [],
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'metric,timeframe'
          });

        if (upsertError) {
          console.error(`Error upserting ${metric} ${timeframe}:`, upsertError);
        } else {
          console.log(`Updated ${metric} ${timeframe} leaderboard`);
        }
      }
    }

    console.log('Leaderboards update completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Leaderboards updated',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-leaderboards:', error);
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
