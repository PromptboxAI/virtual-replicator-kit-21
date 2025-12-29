import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Handle cron job calls
  const requestBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const isScheduledRun = requestBody.scheduled === true;
  const jobName = 'cleanup-failed-agents';
  
  let cronLogId: string | null = null;

  try {
    console.log(`🧹 Starting failed agents cleanup... ${isScheduledRun ? '(Scheduled)' : '(Manual)'}`);
    
    // Log cron job start if scheduled
    if (isScheduledRun) {
      const { data: cronLog, error: cronLogError } = await supabase
        .from('cron_job_logs')
        .insert({
          job_name: jobName,
          status: 'running',
          metadata: { request_timestamp: requestBody.timestamp }
        })
        .select('id')
        .single();
        
      if (cronLogError) {
        console.error('❌ Error creating cron log:', cronLogError);
      } else {
        cronLogId = cronLog?.id;
      }
    }

    // ============================================================
    // Step 1: Mark stuck agents as FAILED (NO DELETION)
    // Rationale: funds/tx may have occurred on-chain; deleting the row
    // makes recovery + user support impossible.
    // ============================================================
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    // (A) Agents still ACTIVATING after 5m with NO tx hash recorded
    // IMPORTANT: Exclude agents with deployment_status='deploying' (user is in wallet confirmation)
    const { data: stuckNoTxAgents, error: markNoTxError } = await supabase
      .from('agents')
      .update({
        status: 'FAILED',
        is_active: false,
        failed_at: new Date().toISOString(),
        failure_reason: 'Deployment stalled: no transaction hash was saved after 5 minutes'
      })
      .eq('status', 'ACTIVATING')
      .neq('deployment_status', 'deploying')  // 🛡️ Don't touch actively-deploying agents
      .is('deployment_tx_hash', null)
      .is('token_contract_address', null)
      .lt('created_at', fiveMinutesAgo)
      .select('id, name, symbol, created_at');

    if (markNoTxError) {
      console.error('❌ Error marking stuck agents (no tx hash):', markNoTxError);
      throw markNoTxError;
    }

    // (B) Agents still ACTIVATING after 20m WITH tx hash but NO contract address
    // IMPORTANT: Exclude agents with deployment_status='deploying' (user is in wallet confirmation)
    const { data: stuckWithTxAgents, error: markWithTxError } = await supabase
      .from('agents')
      .update({
        status: 'FAILED',
        is_active: false,
        failed_at: new Date().toISOString(),
        failure_reason: 'Deployment pending too long (20m). Tx hash recorded; investigate confirmation/RPC.'
      })
      .eq('status', 'ACTIVATING')
      .neq('deployment_status', 'deploying')  // 🛡️ Don't touch actively-deploying agents
      .not('deployment_tx_hash', 'is', null)
      .is('token_contract_address', null)
      .lt('created_at', twentyMinutesAgo)
      .select('id, name, symbol, created_at, deployment_tx_hash');

    if (markWithTxError) {
      console.error('❌ Error marking stuck agents (with tx hash):', markWithTxError);
      throw markWithTxError;
    }

    const stuckAgents = [...(stuckNoTxAgents || []), ...(stuckWithTxAgents || [])];
    const markedCount = stuckAgents.length;

    console.log(`✅ Marked ${markedCount} stuck agents as FAILED`);

    // ============================================================
    // Step 2: Return summary (no deletions)
    // ============================================================
    const deletedAgents: any[] = [];
    const deletedCount = 0;

    console.log(`🗑️ Deleted ${deletedCount} FAILED agents (deletion disabled)`);

    // ============================================================
    // Step 5: Log cleanup actions to system_alerts
    // ============================================================
     if (markedCount > 0) {
       const alertData = {
         type: 'cleanup',
         severity: 'warn',
         message: `Marked ${markedCount} stuck agents as FAILED (no deletions performed)`,
         is_resolved: true,
         metadata: {
           marked_agents: stuckAgents.map(a => ({ id: a.id, name: a.name, symbol: a.symbol })),
           cleanup_timestamp: new Date().toISOString()
         }
       };

      const { error: alertError } = await supabase
        .from('system_alerts')
        .insert(alertData);

      if (alertError) {
        console.warn('⚠️ Could not log cleanup alert:', alertError);
      }
    }

    // ============================================================
    // Step 6: Return summary
    // ============================================================
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      actions: {
        marked_as_failed: markedCount,
        deleted: deletedCount
      },
      marked_agents: stuckAgents || [],
      deleted_agents: deletedAgents || []
    };

    console.log('✅ Cleanup completed:', summary);

    // Update cron job log on success
    if (cronLogId) {
      await supabase
        .from('cron_job_logs')
        .update({
          status: 'completed',
          execution_end: new Date().toISOString(),
          metadata: {
            ...requestBody,
            marked_as_failed: markedCount,
            deleted: deletedCount
          }
        })
        .eq('id', cronLogId);
    }

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('💥 Cleanup function error:', error);
    
    // Update cron job log on failure
    if (cronLogId) {
      await supabase
        .from('cron_job_logs')
        .update({
          status: 'failed',
          execution_end: new Date().toISOString(),
          error_message: error.message,
          metadata: {
            ...requestBody,
            error_details: error.stack
          }
        })
        .eq('id', cronLogId);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});