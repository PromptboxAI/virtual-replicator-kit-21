import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolveRequest {
  symbol?: string;
  address?: string;
}

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  token_address: string | null;
  creation_mode: string;
  deployment_status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parse request body
    const body: ResolveRequest = await req.json();
    const { symbol, address } = body;

    // Validate input: exactly one of symbol or address must be provided
    if ((!symbol && !address) || (symbol && address)) {
      return new Response(
        JSON.stringify({
          ok: false,
          apiVersion: 'v1',
          error: 'Provide exactly one of: symbol or address',
          code: 'BAD_REQUEST',
          details: { symbol, address },
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query token_metadata_cache
    let query = supabase
      .from('token_metadata_cache')
      .select('id, symbol, name, token_address, creation_mode, deployment_status')
      .limit(1);

    if (symbol) {
      query = query.eq('symbol', symbol);
    } else if (address) {
      query = query.ilike('token_address', address);
    }

    const { data, error: dbError } = await query.single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        // No rows returned
        return new Response(
          JSON.stringify({
            ok: false,
            apiVersion: 'v1',
            error: `Token not found: ${symbol || address}`,
            code: 'TOKEN_NOT_FOUND',
            details: { symbol, address },
          }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              ...rateLimitHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Other database errors
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({
          ok: false,
          apiVersion: 'v1',
          error: 'Internal server error',
          code: 'INTERNAL',
          details: { message: dbError.message },
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const tokenData = data as TokenData;

    // Success response
    return new Response(
      JSON.stringify({
        ok: true,
        apiVersion: 'v1',
        data: {
          agentId: tokenData.id,
          symbol: tokenData.symbol,
          name: tokenData.name,
          address: tokenData.token_address,
          creationMode: tokenData.creation_mode,
          deploymentStatus: tokenData.deployment_status,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Unexpected error in resolve-token:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        apiVersion: 'v1',
        error: 'Internal server error',
        code: 'INTERNAL',
        details: { message: error.message },
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
