import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, configuration } = await req.json();

    if (!agentId || !configuration) {
      throw new Error('Agent ID and configuration are required');
    }

    // Delete existing trading configuration
    await supabase
      .from('agent_configurations')
      .delete()
      .eq('agent_id', agentId)
      .eq('category', 'trading');

    // Insert new trading configuration
    const { data, error } = await supabase
      .from('agent_configurations')
      .insert({
        agent_id: agentId,
        category: 'trading',
        configuration: configuration
      });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Trading configuration saved successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Save trading config error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});