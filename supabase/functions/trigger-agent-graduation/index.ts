import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GraduationTriggerRequest {
  graduationEventId: string;
  agentId: string;
  force?: boolean; // For manual testing
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

    const requestBody = await req.json()
    console.log('🎓 Graduation trigger request:', requestBody)

    const {
      graduationEventId,
      agentId,
      force = false
    }: GraduationTriggerRequest = requestBody

    // Validate required parameters
    if (!graduationEventId || !agentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: graduationEventId and agentId are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get graduation event details
    const { data: graduationEvent, error: eventError } = await supabase
      .from('agent_graduation_events')
      .select('*')
      .eq('id', graduationEventId)
      .single()

    if (eventError || !graduationEvent) {
      console.error('❌ Graduation event not found:', eventError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Graduation event not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if already processed (unless forced)
    if (!force && graduationEvent.graduation_status !== 'initiated') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Graduation already processed with status: ${graduationEvent.graduation_status}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      console.error('❌ Agent not found:', agentError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Agent not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update graduation status to contract_deploying
    const { error: statusUpdateError } = await supabase
      .from('agent_graduation_events')
      .update({ 
        graduation_status: 'contract_deploying',
        updated_at: new Date().toISOString()
      })
      .eq('id', graduationEventId)

    if (statusUpdateError) {
      console.error('❌ Failed to update graduation status:', statusUpdateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update graduation status' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🚀 Starting V2 contract deployment for agent:', agent.name)

    // Call deploy-agent-token-v2 function
    const { data: deploymentResult, error: deploymentError } = await supabase.functions.invoke('deploy-agent-token-v2', {
      body: {
        name: agent.name,
        symbol: agent.symbol,
        agentId: agent.id,
        creatorAddress: agent.creator_wallet_address || '0x742d35Cc6636C0532925a3b8ba4e0e8A4b9f6d4e' // fallback treasury
      }
    })

    if (deploymentError) {
      console.error('❌ V2 contract deployment failed:', deploymentError)
      
      // Update graduation status to failed
      await supabase
        .from('agent_graduation_events')
        .update({ 
          graduation_status: 'failed',
          error_message: deploymentError.message || 'Contract deployment failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', graduationEventId)

      // Log transaction failure
      await supabase
        .from('graduation_transaction_logs')
        .insert({
          graduation_event_id: graduationEventId,
          transaction_type: 'contract_deployment',
          status: 'failed',
          error_details: deploymentError.message || 'Contract deployment failed'
        })

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Contract deployment failed',
          details: deploymentError 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ V2 contract deployed successfully:', deploymentResult)

    // Update graduation event with contract details
    const { error: updateError } = await supabase
      .from('agent_graduation_events')
      .update({ 
        graduation_status: 'contract_deployed',
        v2_contract_address: deploymentResult.contractAddress,
        deployment_tx_hash: deploymentResult.transactionHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', graduationEventId)

    if (updateError) {
      console.error('❌ Failed to update graduation event with contract details:', updateError)
    }

    // Log successful deployment transaction
    await supabase
      .from('graduation_transaction_logs')
      .insert({
        graduation_event_id: graduationEventId,
        transaction_type: 'contract_deployment',
        transaction_hash: deploymentResult.transactionHash,
        block_number: deploymentResult.blockNumber,
        gas_used: deploymentResult.gasUsed,
        status: 'confirmed'
      })

    // Update agent with V2 contract address
    await supabase
      .from('agents')
      .update({
        token_address: deploymentResult.contractAddress,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)

    console.log('🎓 Graduation trigger completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          graduationEventId,
          contractAddress: deploymentResult.contractAddress,
          transactionHash: deploymentResult.transactionHash,
          status: 'contract_deployed'
        },
        message: 'Agent graduated and V2 contract deployed successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error in graduation trigger:', error);
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
    )
  }
})