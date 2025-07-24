import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TradeRequest {
  agentId: string;
  userId: string;
  promptAmount?: number;
  tradeType: 'buy' | 'sell';
  tokenAmount?: number;
  expectedPrice?: number;
  slippage?: number;
}

// Remove old bonding curve functions - now handled by database

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

    // Parse request body
    const requestBody = await req.json()
    console.log('📥 Raw request body:', requestBody)

    // Extract parameters from the body property (frontend sends nested parameters)
    const {
      agentId,
      userId,
      promptAmount,
      tradeType,
      tokenAmount,
      expectedPrice = 30.0,
      slippage = 0.5
    }: TradeRequest = requestBody.body || requestBody

    console.log('🔄 Processing trade:', { agentId, userId, promptAmount, tradeType, tokenAmount, slippage })

    // Validate required parameters
    if (!agentId || !userId || !tradeType) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: agentId, userId, and tradeType are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate trade type specific parameters
    if (tradeType === 'buy' && (!promptAmount || promptAmount <= 0)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'For buy trades, promptAmount must be greater than 0' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (tradeType === 'sell' && (!tokenAmount || tokenAmount <= 0)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'For sell trades, tokenAmount must be greater than 0' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Execute the trade using the updated database function
    const { data: transactionResult, error: transactionError } = await supabase.rpc('execute_bonding_curve_trade', {
      p_agent_id: agentId,
      p_user_id: userId,
      p_prompt_amount: promptAmount || 0,
      p_trade_type: tradeType,
      p_token_amount: tokenAmount || 0,
      p_expected_price: expectedPrice,
      p_slippage: slippage
    });

    if (transactionError) {
      console.error('❌ Transaction failed:', transactionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: transactionError.message,
          code: transactionError.code 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Trade executed successfully:', transactionResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: transactionResult,
        message: `${tradeType} trade completed successfully`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error);
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