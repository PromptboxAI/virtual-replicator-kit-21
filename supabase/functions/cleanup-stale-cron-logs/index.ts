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

    console.log('🧹 Starting cleanup of stale cron job logs...');

    // Find logs that are stuck in "running" status for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: staleLogs, error: findError } = await supabase
      .from('cron_job_logs')
      .select('id, job_name, execution_start, metadata')
      .eq('status', 'running')
      .lt('execution_start', fiveMinutesAgo)
      .is('execution_end', null);

    if (findError) {
      console.error('❌ Error finding stale logs:', findError);
      throw findError;
    }

    const staleCount = staleLogs?.length || 0;
    console.log(`📋 Found ${staleCount} stale cron job logs`);

    let updatedCount = 0;

    if (staleCount > 0) {
      const staleIds = staleLogs.map(log => log.id);
      
      // Update stale logs to "timeout" status
      const { error: updateError } = await supabase
        .from('cron_job_logs')
        .update({
          status: 'timeout',
          execution_end: new Date().toISOString(),
          error_message: 'Job exceeded 5 minute timeout - marked as stale by cleanup',
          metadata: {
            cleaned_up: true,
            cleanup_timestamp: new Date().toISOString()
          }
        })
        .in('id', staleIds);

      if (updateError) {
        console.error('❌ Error updating stale logs:', updateError);
        throw updateError;
      }

      updatedCount = staleCount;
      console.log(`✅ Cleaned up ${updatedCount} stale cron job logs`);
    }

    // Log the cleanup action
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'cleanup-stale-cron-logs',
        status: 'completed',
        execution_end: new Date().toISOString(),
        metadata: {
          cleaned_logs: updatedCount,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        cleaned_count: updatedCount,
        message: `Successfully cleaned up ${updatedCount} stale cron job logs`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in cleanup:', error);
    
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
