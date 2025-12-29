import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default PROMPT/USD rate for liquidity calculations
const DEFAULT_PROMPT_USD_RATE = 0.10;

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
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    // Market view parameter - use agent_prices_latest for better performance
    const useMarketView = url.searchParams.get('marketView') === 'true';

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
      sortOrder,
      useMarketView
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Use agent_prices_latest view for market pages (better performance)
    const tableName = useMarketView ? 'agent_prices_latest' : 'token_metadata_cache';

    // Build query
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' });

    // Always exclude FAILED agents - they shouldn't show anywhere
    query = query.neq('status', 'FAILED');

    // Market pages should only show active agents.
    // "My Agents" (creatorId set) can see ACTIVATING/PENDING agents but not FAILED.
    if (useMarketView || !creatorId) {
      query = query.eq('is_active', true);
    }

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

    if (chainId && !useMarketView) {
      query = query.eq('chain_id', parseInt(chainId));
    }

    if (deploymentStatus && !useMarketView) {
      query = query.eq('deployment_status', deploymentStatus);
    }

    if (networkEnvironment && !useMarketView) {
      query = query.eq('network_environment', networkEnvironment);
    }

    if (hasContract === 'true' && !useMarketView) {
      // V6 uses token_contract_address, older code uses token_address
      query = query.or('token_address.not.is.null,token_contract_address.not.is.null');
    }

    if (creatorId && !useMarketView) {
      query = query.eq('creator_id', creatorId);
    }

    // Apply sorting - use market-optimized fields
    const validSortFields = useMarketView 
      ? ['market_cap', 'volume_24h', 'price_change_24h', 'token_holders', 'dynamic_price', 'updated_at']
      : ['created_at', 'market_cap', 'market_cap_usd', 'volume_24h', 'token_holders', 'prompt_raised'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : (useMarketView ? 'market_cap' : 'created_at');
    query = query.order(sortField, { ascending: sortOrder === 'asc', nullsFirst: false });

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

    // Default graduation threshold (fallback if not set on agent)
    const DEFAULT_GRADUATION_THRESHOLD = 42000;

    // Get agent IDs for additional queries
    const agentIds = (data || []).map(t => useMarketView ? t.agent_id : t.id).filter(Boolean);

    // Fetch creator holdings for dev ownership %
    let creatorHoldings: Record<string, number> = {};
    if (agentIds.length > 0) {
      // Get agents with creator_id to match with holdings
      const { data: agentsData } = await supabase
        .from('agents')
        .select('id, creator_id, circulating_supply, total_supply')
        .in('id', agentIds);

      if (agentsData && agentsData.length > 0) {
        // Get creator wallet addresses from user_id in holdings
        const creatorIds = agentsData.map(a => a.creator_id).filter(Boolean);
        
        // Fetch holdings where user_id matches creator_id
        const { data: holdingsData } = await supabase
          .from('agent_token_holders')
          .select('agent_id, user_id, token_balance')
          .in('agent_id', agentIds);

        if (holdingsData) {
          // Build map of agent -> creator balance
          for (const agent of agentsData) {
            if (agent.creator_id) {
              const creatorHolding = holdingsData.find(
                h => h.agent_id === agent.id && h.user_id === agent.creator_id
              );
              if (creatorHolding) {
                const supply = agent.circulating_supply || agent.total_supply || 1000000000;
                creatorHoldings[agent.id] = (creatorHolding.token_balance / supply) * 100;
              }
            }
          }
        }
      }
    }

    // Fetch historical holder counts for holder change calculation
    let holderChanges: Record<string, { change_4h: number; change_24h: number }> = {};
    if (agentIds.length > 0) {
      const now = new Date();
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get snapshots from 4h ago
      const { data: snapshots4h } = await supabase
        .from('agent_price_snapshots')
        .select('agent_id, holders_count, timestamp')
        .in('agent_id', agentIds)
        .lte('timestamp', fourHoursAgo.toISOString())
        .order('timestamp', { ascending: false });

      // Get snapshots from 24h ago
      const { data: snapshots24h } = await supabase
        .from('agent_price_snapshots')
        .select('agent_id, holders_count, timestamp')
        .in('agent_id', agentIds)
        .lte('timestamp', twentyFourHoursAgo.toISOString())
        .order('timestamp', { ascending: false });

      // Build map of closest snapshot per agent
      const closest4h: Record<string, number> = {};
      const closest24h: Record<string, number> = {};

      if (snapshots4h) {
        for (const snap of snapshots4h) {
          if (!closest4h[snap.agent_id] && snap.holders_count !== null) {
            closest4h[snap.agent_id] = snap.holders_count;
          }
        }
      }

      if (snapshots24h) {
        for (const snap of snapshots24h) {
          if (!closest24h[snap.agent_id] && snap.holders_count !== null) {
            closest24h[snap.agent_id] = snap.holders_count;
          }
        }
      }

      // Calculate changes for each agent
      for (const agentId of agentIds) {
        holderChanges[agentId] = {
          change_4h: 0,
          change_24h: 0
        };
      }

      // Will be computed when we have current holder count from the token data
      for (const token of (data || [])) {
        const id = useMarketView ? token.agent_id : token.id;
        const currentHolders = token.token_holders || 0;
        
        if (closest4h[id] !== undefined) {
          holderChanges[id].change_4h = currentHolders - closest4h[id];
        }
        if (closest24h[id] !== undefined) {
          holderChanges[id].change_24h = currentHolders - closest24h[id];
        }
      }
    }

    // Enhance tokens with all fields
    const enhancedTokens = (data || []).map(token => {
      const id = useMarketView ? token.agent_id : token.id;
      const threshold = token.graduation_threshold || DEFAULT_GRADUATION_THRESHOLD;
      const promptRaised = token.prompt_raised || 0;
      const promptUsdRate = token.prompt_usd_rate || DEFAULT_PROMPT_USD_RATE;
      
      // Calculate liquidity (for bonding curve, liquidity = prompt_raised)
      const liquidity = promptRaised;
      const liquidityUsd = promptRaised * promptUsdRate;

      // Get dev ownership %
      const devOwnershipPct = creatorHoldings[id] || 0;

      // Get holder changes
      const holdersChange = holderChanges[id] || { change_4h: 0, change_24h: 0 };

      return {
        ...token,
        graduation_threshold: threshold,
        bonding_progress: {
          prompt_raised: promptRaised,
          graduation_threshold: threshold,
          progress_percent: Math.min((promptRaised / threshold) * 100, 100),
          remaining: Math.max(threshold - promptRaised, 0)
        },
        // NEW FIELDS
        liquidity: liquidity,
        liquidity_usd: liquidityUsd,
        dev_ownership_pct: parseFloat(devOwnershipPct.toFixed(2)),
        holders_change_4h: holdersChange.change_4h,
        holders_change_24h: holdersChange.change_24h
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        apiVersion: 'v1',
        tokens: enhancedTokens,
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
