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

// Timeframe to milliseconds mapping
const TIMEFRAME_MS: Record<string, number> = {
  '1s': 1000,
  '5s': 5000,
  '15s': 15000,
  '30s': 30000,
  '1m': 60000,
  '3m': 180000,
  '5m': 300000,
  '15m': 900000,
  '30m': 1800000,
  '1h': 3600000,
  '2h': 7200000,
  '4h': 14400000,
  '6h': 21600000,
  '12h': 43200000,
  '1d': 86400000,
  '3d': 259200000,
  '1w': 604800000,
  '1M': 2592000000,
};

interface Trade {
  created_at: string;
  price: number;
  token_amount: number;
  is_buy: boolean;
}

interface OHLCBucket {
  bucket_time: string;
  open_prompt: number;
  high_prompt: number;
  low_prompt: number;
  close_prompt: number;
  volume_agent: number;
}

// Aggregate trades into OHLC buckets for V8 agents
function aggregateTradesIntoOHLC(trades: Trade[], timeframe: string, limit: number): OHLCBucket[] {
  if (!trades || trades.length === 0) return [];

  const bucketMs = TIMEFRAME_MS[timeframe] || 300000; // Default 5m
  const buckets: Map<number, OHLCBucket> = new Map();

  // Sort trades by time ascending
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const trade of sortedTrades) {
    const tradeTime = new Date(trade.created_at).getTime();
    const bucketTime = Math.floor(tradeTime / bucketMs) * bucketMs;
    const price = Number(trade.price);
    const volume = Number(trade.token_amount);

    const existing = buckets.get(bucketTime);
    if (existing) {
      existing.high_prompt = Math.max(existing.high_prompt, price);
      existing.low_prompt = Math.min(existing.low_prompt, price);
      existing.close_prompt = price;
      existing.volume_agent += volume;
    } else {
      buckets.set(bucketTime, {
        bucket_time: new Date(bucketTime).toISOString(),
        open_prompt: price,
        high_prompt: price,
        low_prompt: price,
        close_prompt: price,
        volume_agent: volume,
      });
    }
  }

  // Convert to array and sort descending (most recent first)
  return Array.from(buckets.values())
    .sort((a, b) => new Date(b.bucket_time).getTime() - new Date(a.bucket_time).getTime())
    .slice(0, limit);
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

    // Check if this is a V8 agent (has prototype_token_address)
    const { data: agent } = await supabase
      .from('agents')
      .select('prototype_token_address')
      .eq('id', agentId)
      .single();

    const isV8Agent = !!agent?.prototype_token_address;

    let ohlcData: OHLCBucket[] = [];

    if (isV8Agent) {
      // V8: Generate OHLC from on_chain_trades
      console.log('V8 agent detected, generating OHLC from on_chain_trades');
      
      const { data: trades, error: tradesError } = await supabase
        .from('on_chain_trades')
        .select('created_at, price, token_amount, is_buy')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit * 10); // Get more trades to aggregate into buckets

      if (tradesError) {
        console.error('Error fetching on_chain_trades:', tradesError);
        ohlcData = [];
      } else if (!trades || trades.length === 0) {
        ohlcData = [];
      } else {
        // Aggregate trades into OHLC buckets
        ohlcData = aggregateTradesIntoOHLC(trades as Trade[], timeframe, limit);
      }
    } else {
      // V7 and earlier: Use existing RPC
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
      ohlcData = data || [];
    }

    console.log(`Retrieved ${ohlcData?.length || 0} OHLC buckets (V8: ${isV8Agent})`);

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
          buckets: ohlcData,
          count: ohlcData.length,
          isV8: isV8Agent,
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
