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
    console.log('🔄 refresh-token-cache called');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // Use service role for admin operations
    );

    // Call the refresh RPC function
    const { data: rowCount, error } = await supabase.rpc('refresh_token_metadata_cache');

    if (error) {
      console.error('❌ Refresh error:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message,
          hint: 'Make sure the refresh_token_metadata_cache() function exists and is properly configured'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ Cache refreshed successfully. Total tokens: ${rowCount}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Token metadata cache refreshed successfully',
        totalTokens: rowCount,
        refreshedAt: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
