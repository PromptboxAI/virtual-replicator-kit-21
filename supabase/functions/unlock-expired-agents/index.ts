import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔓 Starting automated unlock of expired agents...');

    // Call the database function to unlock expired agents
    const { data: unlockedCount, error } = await supabase.rpc('unlock_expired_agents');
    
    if (error) {
      console.error('❌ Failed to unlock expired agents:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ Successfully unlocked ${unlockedCount} expired agents`);

    // Log the cron job execution for monitoring
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'unlock_expired_agents',
        status: 'completed',
        execution_end: new Date().toISOString(),
        metadata: {
          unlocked_agents: unlockedCount,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        unlocked_count: unlockedCount,
        message: `Successfully unlocked ${unlockedCount} expired agents`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in unlock cron job:', error);
    
    // Log the error for monitoring
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('cron_job_logs')
        .insert({
          job_name: 'unlock_expired_agents',
          status: 'failed',
          execution_end: new Date().toISOString(),
          error_message: error.message,
          metadata: {
            error_details: error.stack,
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

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