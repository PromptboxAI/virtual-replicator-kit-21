import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supported timeframes with their cache durations
const SUPPORTED_TIMEFRAMES: Record<string, number> = {
  // Seconds - cache for 5s
  '1s': 5, '5s': 5, '15s': 5, '30s': 5,
  // Minutes - cache for 30s
  '1m': 30, '3m': 30, '5m': 30, '15m': 30, '30m': 30,
  // Hours - cache for 60s
  '1h': 60, '2h': 60, '4h': 60, '6h': 60, '12h': 60,
  // Days/Weeks/Months - cache for 120s
  '1d': 120, '3d': 120, '1w': 120, '1M': 120,
};

interface OHLCRequest {
  agentId: string;
  timeframe?: string;
  limit?: number;
}

Deno.serve(async (req) => {
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

    // Use service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Support both GET with query params and POST with JSON body
    let agentId: string | null = null;
    let timeframe = '5m';
    let limit = 300;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      agentId = url.searchParams.get('agentId');
      timeframe = url.searchParams.get('timeframe') || '5m';
      limit = parseInt(url.searchParams.get('limit') || '300', 10);
    } else {
      // POST request - parse JSON body
      try {
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const body = await req.text();
          if (body && body.trim()) {
            const parsed = JSON.parse(body);
            agentId = parsed.agentId;
            timeframe = parsed.timeframe || '5m';
            limit = parsed.limit || 300;
          }
        }
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        // Continue with empty agentId - will be caught below
      }
    }

    if (!agentId) {
      return new Response(
        JSON.stringify({ 
          ok: false,
          apiVersion: 'v1',
          error: 'agentId is required',
          code: 'BAD_REQUEST',
          details: { 
            usage: 'GET /get-ohlc?agentId=uuid&timeframe=5m&limit=300 OR POST with JSON body { agentId, timeframe?, limit? }',
            supported_timeframes: Object.keys(SUPPORTED_TIMEFRAMES)
          }
        }),
        { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate timeframe
    if (!SUPPORTED_TIMEFRAMES[timeframe]) {
      return new Response(
        JSON.stringify({ 
          ok: false,
          apiVersion: 'v1',
          error: `Invalid timeframe: ${timeframe}`,
          code: 'BAD_REQUEST',
          details: { 
            supported_timeframes: Object.keys(SUPPORTED_TIMEFRAMES)
          }
        }),
        { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching OHLC data for agent ${agentId}, timeframe: ${timeframe}, limit: ${limit}`);

    // Call the get_ohlc_with_fx RPC
    const { data, error } = await supabase.rpc('get_ohlc_with_fx', {
      p_agent_id: agentId,
      p_timeframe: timeframe,
      p_limit: limit
    });

    if (error) {
      console.error('RPC error:', error);
      return new Response(
        JSON.stringify({ 
          ok: false,
          apiVersion: 'v1',
          error: 'Database error',
          code: 'INTERNAL',
          details: { message: error.message }
        }),
        { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Retrieved ${data?.length || 0} OHLC buckets`);

    const timestamp = Date.now();
    const etag = `"${agentId}-${timeframe}-${timestamp}"`;
    const cacheDuration = SUPPORTED_TIMEFRAMES[timeframe] || 30;

    return new Response(
      JSON.stringify({
        ok: true,
        apiVersion: 'v1',
        data: {
          agentId,
          timeframe,
          buckets: data || [],
          count: data?.length || 0
        }
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          ...rateLimitHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${cacheDuration}, stale-while-revalidate=${cacheDuration * 2}`,
          'ETag': etag
        } 
      }
    );
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ 
        ok: false,
        apiVersion: 'v1',
        error: 'Internal server error',
        code: 'INTERNAL',
        details: { message: err.message }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
