import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecordDeploymentRequest {
  agent_id: string;
  tx_hash: string;
  deployment_method: 'atomic_client' | 'sequential_edge';
  contract_address?: string;
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

    const { agent_id, tx_hash, deployment_method, contract_address } = await req.json() as RecordDeploymentRequest;

    console.log('📝 Recording deployment:', { agent_id, tx_hash, deployment_method, contract_address });

    // Record in deployed_contracts_audit table
    const { data: auditData, error: auditError } = await supabase
      .from('deployed_contracts_audit')
      .insert({
        agent_id,
        deployment_tx_hash: tx_hash,
        token_address: contract_address || '',
        token_address_checksum: contract_address || '',
        deployment_method,
        verification_status: 'pending',
        deployer_address: '', // Will be filled by verification process
        chain_id: 84532, // Base Sepolia
        block_number: 0, // Will be filled by verification process
        block_timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (auditError) {
      console.error('❌ Failed to record audit:', auditError);
      throw auditError;
    }

    // Update agent with deployment info
    const { error: agentError } = await supabase
      .from('agents')
      .update({
        deployment_tx_hash: tx_hash,
        deployment_method,
        token_address: contract_address,
        deployment_verified: false, // Will be verified later
        updated_at: new Date().toISOString()
      })
      .eq('id', agent_id);

    if (agentError) {
      console.error('❌ Failed to update agent:', agentError);
      throw agentError;
    }

    console.log('✅ Deployment recorded successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        audit_id: auditData.id,
        message: 'Deployment recorded successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Record deployment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to record deployment' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});