import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TradeRequest {
  agentId: string;
  userId: string;
  promptAmount: number;
  tradeType: 'buy' | 'sell';
  tokenAmount?: number;
  expectedPrice: number;
  slippage: number;
}

interface BondingCurveResult {
  tokenAmount: number;
  newTokensSold: number;
  newPromptRaised: number;
  newPrice: number;
}

// Bonding curve calculation functions (replicated from frontend)
function calculateTokensFromPrompt(currentPromptRaised: number, promptAmount: number): BondingCurveResult {
  const GRADUATION_THRESHOLD = 42000;
  const BONDING_CURVE_K = 0.001;
  const BASE_PRICE = 30;
  
  // Calculate how many tokens can be bought with the prompt amount
  // Using the formula: price = BASE_PRICE + k * currentSupply
  let remainingPrompt = promptAmount;
  let totalTokens = 0;
  let currentSupply = currentPromptRaised;
  
  // We'll calculate in small increments to handle the price curve accurately
  const increment = 10; // Calculate in 10 PROMPT increments for precision
  
  while (remainingPrompt > 0) {
    const currentPrice = BASE_PRICE + BONDING_CURVE_K * currentSupply;
    const promptForIncrement = Math.min(remainingPrompt, increment);
    const tokensForIncrement = promptForIncrement / currentPrice;
    
    totalTokens += tokensForIncrement;
    currentSupply += promptForIncrement;
    remainingPrompt -= promptForIncrement;
    
    // Check if we've hit graduation threshold
    if (currentSupply >= GRADUATION_THRESHOLD) {
      break;
    }
  }
  
  const finalPrice = BASE_PRICE + BONDING_CURVE_K * currentSupply;
  
  return {
    tokenAmount: totalTokens,
    newTokensSold: currentSupply, // This represents total prompt raised
    newPromptRaised: currentSupply,
    newPrice: finalPrice
  };
}

function calculateSellReturn(currentPromptRaised: number, tokenAmount: number): BondingCurveResult {
  const BONDING_CURVE_K = 0.001;
  const BASE_PRICE = 30;
  
  // For selling, we reverse the calculation
  let remainingTokens = tokenAmount;
  let totalPrompt = 0;
  let currentSupply = currentPromptRaised;
  
  const increment = tokenAmount / 100; // Calculate in small increments
  
  while (remainingTokens > 0) {
    const tokensForIncrement = Math.min(remainingTokens, increment);
    const currentPrice = BASE_PRICE + BONDING_CURVE_K * (currentSupply - tokensForIncrement);
    const promptForIncrement = tokensForIncrement * currentPrice;
    
    totalPrompt += promptForIncrement;
    currentSupply -= tokensForIncrement;
    remainingTokens -= tokensForIncrement;
    
    if (currentSupply <= 0) break;
  }
  
  const finalPrice = BASE_PRICE + BONDING_CURVE_K * currentSupply;
  
  return {
    tokenAmount: totalPrompt, // For sells, this returns prompt amount
    newTokensSold: currentSupply,
    newPromptRaised: currentSupply,
    newPrice: finalPrice
  };
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

    const { agentId, userId, promptAmount, tradeType, tokenAmount, expectedPrice, slippage }: TradeRequest = await req.json()

    console.log('🔄 Processing trade:', { agentId, userId, promptAmount, tradeType, slippage })

    // Start a database transaction
    const { data: transactionResult, error: transactionError } = await supabase.rpc('execute_bonding_curve_trade', {
      p_agent_id: agentId,
      p_user_id: userId,
      p_prompt_amount: promptAmount,
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