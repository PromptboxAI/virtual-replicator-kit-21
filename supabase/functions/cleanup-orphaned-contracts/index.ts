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

    console.log('🧹 Cleaning up orphaned deployed_contracts...');

    // Get all agent IDs
    const { data: agents } = await supabase
      .from('agents')
      .select('id');
    
    const validAgentIds = agents?.map(a => a.id) || [];
    console.log(`📋 Found ${validAgentIds.length} valid agents`);

    // Get all deployed contracts
    const { data: allContracts } = await supabase
      .from('deployed_contracts')
      .select('id, agent_id, contract_address');

    // Find orphaned contracts (those with agent_ids not in the valid list)
    const orphanedContracts = allContracts?.filter(
      contract => contract.agent_id && !validAgentIds.includes(contract.agent_id)
    ) || [];

    const orphanedIds = orphanedContracts.map(c => c.id);
    console.log(`🗑️ Found ${orphanedIds.length} orphaned contracts to delete`);

    let deletedContracts = [];
    let deleteError = null;

    if (orphanedIds.length > 0) {
      const result = await supabase
        .from('deployed_contracts')
        .delete()
        .in('id', orphanedIds)
        .select('id, agent_id, contract_address');
      
      deletedContracts = result.data || [];
      deleteError = result.error;
    }

    if (deleteError) {
      console.error('❌ Error deleting orphaned contracts:', deleteError);
      throw deleteError;
    }

    const deletedCount = deletedContracts?.length || 0;
    console.log(`✅ Deleted ${deletedCount} orphaned deployed_contracts`);

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      deleted_count: deletedCount,
      deleted_contracts: deletedContracts || []
    };

    console.log('✅ Orphan cleanup completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('💥 Orphan cleanup error:', error);
    
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
