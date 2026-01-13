import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const requestBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const isScheduledRun = requestBody.scheduled === true;
  const jobName = 'cleanup-failed-agents';

  let cronLogId: string | null = null;

  try {
    console.log(`🧹 Starting agent recovery/cleanup... ${isScheduledRun ? '(Scheduled)' : '(Manual)'}`);

    if (isScheduledRun) {
      const { data: cronLog } = await supabase
        .from('cron_job_logs')
        .insert({ job_name: jobName, status: 'running', metadata: { request_timestamp: requestBody.timestamp } })
        .select('id')
        .single();
      cronLogId = cronLog?.id;
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // ============================================================
    // Step 1: AUTO-RECOVERY - Try to sync stuck agents that have tx hash
    // Instead of marking as FAILED, we call sync-agent-deployment
    // ============================================================
    const { data: stuckWithTxAgents } = await supabase
      .from('agents')
      .select('id, name, symbol, deployment_tx_hash, created_at')
      .eq('deployment_status', 'pending')
      .not('deployment_tx_hash', 'is', null)
      .is('token_contract_address', null)
      .lt('created_at', tenMinutesAgo);

    const recoveredAgents: any[] = [];
    const failedRecoveryAgents: any[] = [];

    if (stuckWithTxAgents && stuckWithTxAgents.length > 0) {
      console.log(`🔄 Found ${stuckWithTxAgents.length} stuck agents with tx hash - attempting recovery...`);

      for (const agent of stuckWithTxAgents) {
        try {
          // Call sync-agent-deployment to recover from on-chain data
          const { data: syncResult, error: syncError } = await supabase.functions.invoke(
            'sync-agent-deployment',
            { body: { agentId: agent.id, txHash: agent.deployment_tx_hash } }
          );

          if (syncError || !syncResult?.success) {
            console.warn(`❌ Failed to recover ${agent.name}:`, syncError?.message || syncResult?.error);
            failedRecoveryAgents.push({ ...agent, recovery_error: syncError?.message || syncResult?.error });
          } else {
            console.log(`✅ Recovered ${agent.name}! Token: ${syncResult.tokenAddress}`);
            recoveredAgents.push({ ...agent, token_address: syncResult.tokenAddress });
          }
        } catch (err: any) {
          console.error(`💥 Recovery exception for ${agent.name}:`, err);
          failedRecoveryAgents.push({ ...agent, recovery_error: err.message });
        }
      }
    }

    // ============================================================
    // Step 2: Mark truly abandoned agents (no tx hash after 30 minutes)
    // These are agents where the user never submitted a transaction
    // ============================================================
    const { data: abandonedAgents } = await supabase
      .from('agents')
      .update({
        status: 'FAILED',
        is_active: false,
        failed_at: new Date().toISOString(),
        failure_reason: 'Creation abandoned: no transaction submitted after 30 minutes'
      })
      .eq('deployment_status', 'pending')
      .is('deployment_tx_hash', null)
      .is('token_contract_address', null)
      .lt('created_at', thirtyMinutesAgo)
      .select('id, name, symbol');

    const abandonedCount = abandonedAgents?.length || 0;
    if (abandonedCount > 0) {
      console.log(`🗑️ Marked ${abandonedCount} abandoned agents as FAILED (no tx submitted)`);
    }

    // ============================================================
    // Step 3: Log to system_alerts if any actions taken
    // ============================================================
    const totalActions = recoveredAgents.length + failedRecoveryAgents.length + abandonedCount;
    if (totalActions > 0) {
      await supabase.from('system_alerts').insert({
        type: 'cleanup',
        severity: recoveredAgents.length > 0 ? 'info' : 'warn',
        message: `Agent recovery: ${recoveredAgents.length} recovered, ${failedRecoveryAgents.length} failed, ${abandonedCount} abandoned`,
        is_resolved: true,
        metadata: {
          recovered_agents: recoveredAgents.map(a => ({ id: a.id, name: a.name, symbol: a.symbol })),
          failed_recovery: failedRecoveryAgents.map(a => ({ id: a.id, name: a.name, error: a.recovery_error })),
          abandoned_agents: abandonedAgents?.map(a => ({ id: a.id, name: a.name })) || [],
          cleanup_timestamp: new Date().toISOString()
        }
      });
    }

    // ============================================================
    // Step 4: Return summary
    // ============================================================
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      actions: {
        recovered: recoveredAgents.length,
        failed_recovery: failedRecoveryAgents.length,
        marked_abandoned: abandonedCount
      },
      recovered_agents: recoveredAgents,
      failed_recovery_agents: failedRecoveryAgents,
      abandoned_agents: abandonedAgents || []
    };

    console.log('✅ Recovery/cleanup completed:', JSON.stringify(summary, null, 2));

    if (cronLogId) {
      await supabase.from('cron_job_logs').update({
        status: 'completed',
        execution_end: new Date().toISOString(),
        metadata: { ...requestBody, ...summary.actions }
      }).eq('id', cronLogId);
    }

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('💥 Recovery/cleanup error:', error);
    
    if (cronLogId) {
      await supabase.from('cron_job_logs').update({
        status: 'failed',
        execution_end: new Date().toISOString(),
        error_message: error.message,
        metadata: { ...requestBody, error_details: error.stack }
      }).eq('id', cronLogId);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
