import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestGraduationRequest {
  agentId: string;
  forceGraduation?: boolean;
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
    console.log('🧪 Test graduation request:', requestBody)

    const {
      agentId,
      forceGraduation = false
    }: TestGraduationRequest = requestBody

    if (!agentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameter: agentId' 
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

    console.log('📊 Agent current status:', {
      name: agent.name,
      promptRaised: agent.prompt_raised,
      graduated: agent.token_graduated,
      tokenAddress: agent.token_address
    })

    // Check if agent should graduate
    const shouldGraduate = forceGraduation || agent.prompt_raised >= 42000

    if (!shouldGraduate) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Agent has only raised ${agent.prompt_raised} PROMPT. Needs 42,000 to graduate.`,
          currentStatus: {
            promptRaised: agent.prompt_raised,
            graduationThreshold: 42000,
            percentComplete: ((agent.prompt_raised / 42000) * 100).toFixed(2)
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Force graduation for testing if specified
    if (forceGraduation && agent.prompt_raised < 42000) {
      console.log('⚠️ FORCE GRADUATING AGENT FOR TESTING');
      
      // Create a test graduation event
      const { data: graduationEvent, error: eventError } = await supabase
        .from('agent_graduation_events')
        .insert({
          agent_id: agentId,
          prompt_raised_at_graduation: agent.prompt_raised,
          graduation_status: 'initiated',
          metadata: {
            test_graduation: true,
            forced: true,
            original_prompt_raised: agent.prompt_raised
          }
        })
        .select()
        .single()

      if (eventError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create test graduation event',
            details: eventError 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Mark agent as graduated
      await supabase
        .from('agents')
        .update({
          token_graduated: true,
          graduation_event_id: graduationEvent.id,
          prompt_raised: 42000, // Set to graduation threshold for testing
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)

      // Trigger graduation process
      const { data: graduationResult, error: graduationError } = await supabase.functions.invoke('trigger-agent-graduation', {
        body: {
          graduationEventId: graduationEvent.id,
          agentId: agentId,
          force: true
        }
      })

      if (graduationError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Graduation trigger failed',
            details: graduationError 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Test graduation completed successfully',
          data: {
            agentId,
            graduationEventId: graduationEvent.id,
            graduationResult,
            testMode: true
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if already graduated
    if (agent.token_graduated) {
      // Get existing graduation event
      const { data: existingEvent } = await supabase
        .from('agent_graduation_events')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Agent already graduated',
          data: {
            agentId,
            contractAddress: agent.token_address,
            graduationEvent: existingEvent,
            alreadyGraduated: true
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Agent should graduate naturally
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Agent meets graduation criteria but not yet graduated',
        data: {
          agentId,
          promptRaised: agent.prompt_raised,
          graduationThreshold: 42000,
          readyToGraduate: true
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Test graduation error:', error);
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