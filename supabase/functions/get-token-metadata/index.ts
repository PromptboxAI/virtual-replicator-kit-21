import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '../_shared/rateLimit.ts';

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
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId, 100, 60000);
    const rateLimitHeaders = getRateLimitHeaders(100, rateLimit.remaining, rateLimit.resetAt);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          ok: false,
          apiVersion: 'v1',
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
        {
          status: 429,
          headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const address = url.searchParams.get('address');
    const chainId = url.searchParams.get('chainId') || '84532'; // Default to Base Sepolia

    console.log('📊 get-token-metadata called:', { id, address, chainId });

    // Validate input
    if (!id && !address) {
      return new Response(
        JSON.stringify({ 
          ok: false,
          apiVersion: 'v1',
          error: 'Either id or address parameter is required',
          code: 'BAD_REQUEST',
          details: { usage: 'GET /get-token-metadata?id=uuid OR GET /get-token-metadata?address=0x...&chainId=84532' }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    let query = supabase
      .from('token_metadata_cache')
      .select('*');

    // Query by ID or address
    if (id) {
      query = query.eq('id', id);
    } else if (address) {
      const normalizedAddress = address.toLowerCase();
      query = query
        .eq('token_address_normalized', normalizedAddress)
        .eq('chain_id', parseInt(chainId));
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('❌ Database error:', error);
      return new Response(
        JSON.stringify({ 
          ok: false,
          apiVersion: 'v1',
          error: 'Database error',
          code: 'INTERNAL',
          details: { message: error.message }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!data) {
      console.log('⚠️ Token not found');
      return new Response(
        JSON.stringify({ 
          ok: false,
          apiVersion: 'v1',
          error: 'Token not found',
          code: 'TOKEN_NOT_FOUND',
          details: {
            searched_by: id ? 'id' : 'address',
            value: id || address
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Token found:', data.name, data.symbol);

    const timestamp = Date.now();
    const etag = `"${data.id || data.agent_id}-${timestamp}"`;

    return new Response(
      JSON.stringify({ 
        ok: true,
        apiVersion: 'v1',
        data: data,
        cached_at: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          ...rateLimitHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'ETag': etag
        } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        ok: false,
        apiVersion: 'v1',
        error: 'Internal server error',
        code: 'INTERNAL',
        details: { message: error.message }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
