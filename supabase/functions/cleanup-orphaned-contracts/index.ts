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

    // Find orphaned contracts (contracts without corresponding agents)
    const { data: orphanedContracts, error: findError } = await supabase
      .from('deployed_contracts')
      .select('id, agent_id, contract_address')
      .is('agent_id', null)
      .or('agent_id.not.in.(select id from agents)');

    if (findError) {
      console.error('❌ Error finding orphaned contracts:', findError);
    }

    // Delete using RPC or direct query with service role
    const { data: deletedContracts, error: deleteError } = await supabase
      .from('deployed_contracts')
      .delete()
      .is('agent_id', null)
      .select('id, agent_id, contract_address');

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
