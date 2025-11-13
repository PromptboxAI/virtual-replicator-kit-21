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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Starting failed agents cleanup...');

    // ============================================================
    // Step 1: Mark stuck agents as FAILED
    // Agents in ACTIVATING for >2 minutes without deployment_tx_hash
    // ============================================================
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: stuckAgents, error: markError } = await supabase
      .from('agents')
      .update({
        status: 'FAILED',
        is_active: false,
        failed_at: new Date().toISOString(),
        failure_reason: 'Deployment timeout after 2 minutes - likely network or RPC failure'
      })
      .eq('status', 'ACTIVATING')
      .is('deployment_tx_hash', null)
      .lt('created_at', twoMinutesAgo)
      .select('id, name, symbol, created_at');

    if (markError) {
      console.error('❌ Error marking stuck agents:', markError);
      throw markError;
    }

    const markedCount = stuckAgents?.length || 0;
    console.log(`✅ Marked ${markedCount} stuck agents as FAILED`);

    // ============================================================
    // Step 2: Deactivate deployed_contracts for FAILED agents
    // This prevents foreign key constraint violations
    // ============================================================
    const { error: deactivateError } = await supabase
      .from('deployed_contracts')
      .update({ is_active: false })
      .in('agent_id', (await supabase.from('agents').select('id').eq('status', 'FAILED')).data?.map(a => a.id) || []);

    if (deactivateError) {
      console.warn('⚠️ Error deactivating deployed contracts:', deactivateError);
    }

    // ============================================================
    // Step 3: Delete ALL FAILED agents
    // Name/symbol now available for retry
    // ============================================================
    const { data: deletedAgents, error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('status', 'FAILED')
      .select('id, name, symbol, failed_at, failure_reason');

    if (deleteError) {
      console.error('❌ Error deleting failed agents:', deleteError);
      throw deleteError;
    }

    const deletedCount = deletedAgents?.length || 0;
    console.log(`🗑️ Deleted ${deletedCount} FAILED agents`);

    // ============================================================
    // Step 4: Log cleanup actions to system_alerts
    // ============================================================
    if (markedCount > 0 || deletedCount > 0) {
      const alertData = {
        alert_type: 'cleanup',
        severity: 'info',
        title: 'Failed Agents Cleanup',
        message: `Marked ${markedCount} stuck agents as FAILED, deleted ${deletedCount} failed agents`,
        metadata: {
          marked_agents: stuckAgents?.map(a => ({ id: a.id, name: a.name, symbol: a.symbol })),
          deleted_agents: deletedAgents?.map(a => ({ id: a.id, name: a.name, symbol: a.symbol, reason: a.failure_reason })),
          cleanup_timestamp: new Date().toISOString()
        },
        resolved: true
      };

      const { error: alertError } = await supabase
        .from('system_alerts')
        .insert(alertData);

      if (alertError) {
        console.warn('⚠️ Could not log cleanup alert:', alertError);
      }
    }

    // ============================================================
    // Step 5: Return summary
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

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('💥 Cleanup function error:', error);
    
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