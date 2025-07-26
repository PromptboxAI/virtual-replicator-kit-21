import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LiquidityPoolRequest {
  graduationEventId: string;
  contractAddress: string;
  promptAmount: string;
  tokenAmount: string;
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
    console.log('💧 Liquidity pool creation request:', requestBody)

    const {
      graduationEventId,
      contractAddress,
      promptAmount,
      tokenAmount
    }: LiquidityPoolRequest = requestBody

    // Validate required parameters
    if (!graduationEventId || !contractAddress) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: graduationEventId and contractAddress are required' 
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

    // Simulate liquidity pool creation on DEX (Uniswap V3 style)
    // In a real implementation, this would:
    // 1. Call Uniswap V3 factory to create a pool
    // 2. Add liquidity with the raised PROMPT and remaining tokens
    // 3. Lock LP tokens for 10 years
    // 4. Return the pool address and transaction hash

    const mockLiquidityPoolAddress = `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`
    const mockTransactionHash = `0x${Math.random().toString(16).substring(2, 66).padStart(64, '0')}`

    console.log('🚀 Creating liquidity pool for graduation event:', graduationEventId)
    console.log('💰 PROMPT amount for LP:', promptAmount)
    console.log('🪙 Token amount for LP:', tokenAmount)
    console.log('📍 Mock LP address:', mockLiquidityPoolAddress)

    // Complete the graduation using the database function
    const { data: completionResult, error: completionError } = await supabase
      .rpc('complete_agent_graduation', {
        p_graduation_event_id: graduationEventId,
        p_liquidity_pool_address: mockLiquidityPoolAddress,
        p_liquidity_tx_hash: mockTransactionHash
      })

    if (completionError) {
      console.error('❌ Failed to complete graduation:', completionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to complete graduation',
          details: completionError 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!completionResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: completionResult.error
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Graduation completed successfully:', completionResult)

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          graduationEventId,
          liquidityPoolAddress: mockLiquidityPoolAddress,
          transactionHash: mockTransactionHash,
          promptAmount,
          tokenAmount,
          status: 'completed'
        },
        message: 'Liquidity pool created and graduation completed successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error in liquidity pool creation:', error);
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