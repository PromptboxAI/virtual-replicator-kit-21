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
      graduationEventId: requestedGraduationEventId,
      agentId,
      force = false
    }: GraduationTriggerRequest = requestBody

    // Validate required parameters - agentId is always required
    if (!agentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameter: agentId is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let graduationEvent;
    let graduationEventId = requestedGraduationEventId;

    if (graduationEventId) {
      // Get existing graduation event
      const { data: existingEvent, error: eventError } = await supabase
        .from('agent_graduation_events')
        .select('*')
        .eq('id', graduationEventId)
        .single()

      if (eventError || !existingEvent) {
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

      graduationEvent = existingEvent;

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
    } else {
      // No graduation event ID provided - need to create one or find existing
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()

      if (!agent) {
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

      // Create new graduation event
      const { data: newEvent, error: createError } = await supabase
        .from('agent_graduation_events')
        .insert({
          agent_id: agentId,
          prompt_raised_at_graduation: agent.prompt_raised || 42000,
          graduation_status: 'initiated',
          metadata: {
            forced: force,
            test_graduation: true,
            original_prompt_raised: agent.prompt_raised
          }
        })
        .select()
        .single()

      if (createError || !newEvent) {
        console.error('❌ Failed to create graduation event:', createError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create graduation event' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      graduationEvent = newEvent;
      graduationEventId = newEvent.id;

      // Update agent with graduation event ID
      await supabase
        .from('agents')
        .update({ graduation_event_id: graduationEventId })
        .eq('id', agentId)
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

    // Step 1: Deploy platform vault first
    console.log('🏦 Deploying platform vault for agent:', agent.name)
    
    const { data: vaultResult, error: vaultError } = await supabase.functions.invoke('deploy-platform-vault', {
      body: {
        agentId: agent.id,
        agentName: agent.name
      }
    })

    let platformVaultAddress = null;
    if (vaultError) {
      console.error('❌ Platform vault deployment failed:', vaultError)
      // Continue without vault - not critical for graduation
    } else {
      platformVaultAddress = vaultResult?.vaultAddress;
      console.log('✅ Platform vault deployed:', platformVaultAddress)
    }

    console.log('🚀 Starting V2 contract deployment for agent:', agent.name)

    // Call deploy-agent-token-v2 function with platform vault address
    const { data: deploymentResult, error: deploymentError } = await supabase.functions.invoke('deploy-agent-token-v2', {
      body: {
        name: agent.name,
        symbol: agent.symbol,
        agentId: agent.id,
        creatorAddress: agent.creator_wallet_address || '0x742d35Cc6636C0532925a3b8ba4e0e8A4b9f6d4e', // fallback treasury
        platformVaultAddress,
        includePlatformAllocation: true
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

    // Now create the liquidity pool to complete graduation
    console.log('💧 Creating liquidity pool for graduated agent...')
    
    const { data: liquidityResult, error: liquidityError } = await supabase.functions.invoke('create-liquidity-pool', {
      body: {
        graduationEventId,
        contractAddress: deploymentResult.contractAddress,
        promptAmount: graduationEvent.prompt_raised_at_graduation.toString(),
        tokenAmount: "196000000", // 196M tokens (1B total - 4M platform allocation)
        platformVaultAddress: platformVaultAddress
      }
    })

    if (liquidityError) {
      console.error('❌ Liquidity pool creation failed:', liquidityError)
      
      // Update graduation status to indicate LP creation failed
      await supabase
        .from('agent_graduation_events')
        .update({ 
          graduation_status: 'liquidity_failed',
          error_message: liquidityError.message || 'Liquidity pool creation failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', graduationEventId)

      // Still return success for contract deployment, but note LP failure
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: 'Contract deployed but liquidity pool creation failed',
          data: {
            graduationEventId,
            contractAddress: deploymentResult.contractAddress,
            transactionHash: deploymentResult.transactionHash,
            status: 'contract_deployed'
          },
          liquidityError: liquidityError.message
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🎓 Full graduation completed successfully - contract deployed and LP created')

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          graduationEventId,
          contractAddress: deploymentResult.contractAddress,
          transactionHash: deploymentResult.transactionHash,
          liquidityPoolAddress: liquidityResult.data?.liquidityPoolAddress,
          liquidityTxHash: liquidityResult.data?.transactionHash,
          status: 'completed'
        },
        message: 'Agent graduated, V2 contract deployed, and liquidity pool created successfully'
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