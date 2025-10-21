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
    const id = url.searchParams.get('id');
    const address = url.searchParams.get('address');
    const chainId = url.searchParams.get('chainId') || '84532'; // Default to Base Sepolia

    console.log('📊 get-token-metadata called:', { id, address, chainId });

    // Validate input
    if (!id && !address) {
      return new Response(
        JSON.stringify({ 
          error: 'Either id or address parameter is required',
          usage: 'GET /get-token-metadata?id=uuid OR GET /get-token-metadata?address=0x...&chainId=84532'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!data) {
      console.log('⚠️ Token not found');
      return new Response(
        JSON.stringify({ 
          error: 'Token not found',
          searched_by: id ? 'id' : 'address',
          value: id || address
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Token found:', data.name, data.symbol);

    return new Response(
      JSON.stringify({ 
        success: true,
        token: data,
        cached_at: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // Cache for 1 minute
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
