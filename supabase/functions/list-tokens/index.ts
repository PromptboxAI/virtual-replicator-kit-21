import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100); // Max 100
    const offset = (page - 1) * limit;

    // Filter parameters
    const testMode = url.searchParams.get('testMode'); // 'true', 'false', or null (both)
    const category = url.searchParams.get('category');
    const graduated = url.searchParams.get('graduated'); // 'true', 'false', or null (both)
    const chainId = url.searchParams.get('chainId');
    const deploymentStatus = url.searchParams.get('deploymentStatus'); // 'deployed', 'not_deployed', etc.
    const networkEnvironment = url.searchParams.get('networkEnvironment'); // 'testnet', 'mainnet'
    const hasContract = url.searchParams.get('hasContract'); // 'true' to only show agents with token_address
    const creatorId = url.searchParams.get('creatorId');

    // Sort parameters
    const sortBy = url.searchParams.get('sortBy') || 'created_at'; // created_at, market_cap, volume_24h, token_holders
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'; // asc or desc

    console.log('📋 list-tokens called:', { 
      page, 
      limit, 
      testMode, 
      category, 
      graduated,
      chainId,
      deploymentStatus,
      networkEnvironment,
      hasContract,
      creatorId,
      sortBy, 
      sortOrder 
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Build query
    let query = supabase
      .from('token_metadata_cache')
      .select('*', { count: 'exact' });

    // Apply filters
    if (testMode !== null) {
      query = query.eq('test_mode', testMode === 'true');
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (graduated !== null) {
      query = query.eq('token_graduated', graduated === 'true');
    }

    if (chainId) {
      query = query.eq('chain_id', parseInt(chainId));
    }

    if (deploymentStatus) {
      query = query.eq('deployment_status', deploymentStatus);
    }

    if (networkEnvironment) {
      query = query.eq('network_environment', networkEnvironment);
    }

    if (hasContract === 'true') {
      query = query.not('token_address', 'is', null);
    }

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'market_cap', 'market_cap_usd', 'volume_24h', 'token_holders', 'prompt_raised'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(`✅ Retrieved ${data?.length || 0} tokens (page ${page}/${totalPages})`);

    return new Response(
      JSON.stringify({ 
        success: true,
        apiVersion: 'v1',
        tokens: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          testMode: testMode ? testMode === 'true' : null,
          category: category || null,
          graduated: graduated ? graduated === 'true' : null,
          chainId: chainId ? parseInt(chainId) : null,
          deploymentStatus: deploymentStatus || null,
          networkEnvironment: networkEnvironment || null,
          hasContract: hasContract === 'true' || null,
          creatorId: creatorId || null
        },
        sort: {
          by: sortField,
          order: sortOrder
        },
        cached_at: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30' // Cache for 30 seconds
        } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
