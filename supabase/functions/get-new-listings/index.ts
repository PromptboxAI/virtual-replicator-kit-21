import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const hours = Math.min(parseInt(url.searchParams.get('hours') || '24'), 168); // Max 7 days
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
    const chainId = url.searchParams.get('chainId');
    const testMode = url.searchParams.get('testMode');
    const category = url.searchParams.get('category');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Fetching new listings: hours=${hours}, limit=${limit}, page=${page}, chainId=${chainId}`);

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const offset = (page - 1) * limit;

    // Query for recently created agents
    let query = supabase
      .from('agents')
      .select('id, symbol, name, avatar_url, current_price, market_cap, volume_24h, price_change_24h, token_holders, category, created_at, deployed_at, token_graduated, chain_id, description, creator_wallet_address', { count: 'exact' })
      .gte('created_at', cutoffTime)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

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

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching new listings:', error);
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Calculate time since creation for each token
    const enrichedData = (data || []).map(agent => ({
      ...agent,
      time_since_creation: getTimeSinceCreation(agent.created_at),
      hours_since_creation: Math.round((Date.now() - new Date(agent.created_at).getTime()) / (1000 * 60 * 60) * 10) / 10
    }));

    return new Response(JSON.stringify({
      success: true,
      data: enrichedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        hours,
        chainId: chainId ? parseInt(chainId) : null,
        category
      },
      source: 'live'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-new-listings:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getTimeSinceCreation(createdAt: string): string {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
}
