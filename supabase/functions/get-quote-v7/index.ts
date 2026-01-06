/**
 * Get Quote V7
 * 
 * Preview buy/sell trades without execution.
 * Returns expected output, fees, and price impact.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V7 Constants
const V7 = {
  TRADEABLE_CAP: 248_000_000,
  DEFAULT_P0: 0.00004,
  DEFAULT_P1: 0.0003,
  GRADUATION_THRESHOLD: 42160,
  TRADING_FEE_BPS: 500,
  CREATOR_FEE_BPS: 5000,
  PLATFORM_FEE_BPS: 5000,
  BASIS_POINTS: 10000,
  TOTAL_SUPPLY: 1_000_000_000,
} as const;

function calculateCurrentPrice(sharesSold: number, p0: number, p1: number): number {
  if (sharesSold <= 0) return p0;
  if (sharesSold >= V7.TRADEABLE_CAP) return p1;
  const slope = (p1 - p0) / V7.TRADEABLE_CAP;
  return p0 + slope * sharesSold;
}

function calculateBuyQuote(
  sharesSold: number,
  promptIn: number,
  p0: number,
  p1: number
) {
  const fee = promptIn * (V7.TRADING_FEE_BPS / V7.BASIS_POINTS);
  const creatorFee = fee * (V7.CREATOR_FEE_BPS / V7.BASIS_POINTS);
  const platformFee = fee * (V7.PLATFORM_FEE_BPS / V7.BASIS_POINTS);
  const netPrompt = promptIn - fee;

  const startPrice = calculateCurrentPrice(sharesSold, p0, p1);

  if (netPrompt <= 0) {
    return {
      sharesOut: 0,
      fee,
      creatorFee,
      platformFee,
      netPrompt: 0,
      avgPrice: 0,
      newPrice: startPrice,
      priceImpact: 0,
      valid: false,
      error: 'Amount too small after fees',
    };
  }

  // Quadratic formula
  const slope = (p1 - p0) / V7.TRADEABLE_CAP;
  const a = slope / 2;
  const b = p0 + slope * sharesSold;
  const c = -netPrompt;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return {
      sharesOut: 0,
      fee,
      creatorFee,
      platformFee,
      netPrompt,
      avgPrice: 0,
      newPrice: startPrice,
      priceImpact: 0,
      valid: false,
      error: 'Invalid calculation',
    };
  }

  let sharesOut = (-b + Math.sqrt(discriminant)) / (2 * a);
  const maxShares = V7.TRADEABLE_CAP - sharesSold;
  
  if (sharesOut > maxShares) {
    sharesOut = maxShares;
  }

  const newSharesSold = sharesSold + sharesOut;
  const newPrice = calculateCurrentPrice(newSharesSold, p0, p1);
  const avgPrice = sharesOut > 0 ? netPrompt / sharesOut : 0;
  const priceImpact = startPrice > 0 ? ((newPrice - startPrice) / startPrice) * 100 : 0;

  return {
    sharesOut,
    fee,
    creatorFee,
    platformFee,
    netPrompt,
    avgPrice,
    newPrice,
    priceImpact,
    startPrice,
    newSharesSold,
    marketCap: newPrice * newSharesSold,
    fdv: newPrice * V7.TOTAL_SUPPLY,
    valid: sharesOut > 0,
    error: sharesOut > 0 ? null : 'Curve at capacity',
  };
}

function calculateSellQuote(
  sharesSold: number,
  sharesIn: number,
  promptRaised: number,
  userBalance: number,
  p0: number,
  p1: number
) {
  const startPrice = calculateCurrentPrice(sharesSold, p0, p1);

  if (sharesIn <= 0) {
    return {
      promptOut: 0,
      fee: 0,
      creatorFee: 0,
      platformFee: 0,
      grossPrompt: 0,
      avgPrice: 0,
      newPrice: startPrice,
      priceImpact: 0,
      valid: false,
      error: 'Invalid amount',
    };
  }

  if (sharesIn > userBalance) {
    return {
      promptOut: 0,
      fee: 0,
      creatorFee: 0,
      platformFee: 0,
      grossPrompt: 0,
      avgPrice: 0,
      newPrice: startPrice,
      priceImpact: 0,
      valid: false,
      error: `Insufficient balance: have ${userBalance}, trying to sell ${sharesIn}`,
    };
  }

  const actualSharesIn = Math.min(sharesIn, sharesSold);
  const newSharesSold = sharesSold - actualSharesIn;
  const newPrice = calculateCurrentPrice(newSharesSold, p0, p1);
  const avgPrice = (startPrice + newPrice) / 2;
  const grossPrompt = avgPrice * actualSharesIn;

  const fee = grossPrompt * (V7.TRADING_FEE_BPS / V7.BASIS_POINTS);
  const creatorFee = fee * (V7.CREATOR_FEE_BPS / V7.BASIS_POINTS);
  const platformFee = fee * (V7.PLATFORM_FEE_BPS / V7.BASIS_POINTS);
  const promptOut = grossPrompt - fee;

  const priceImpact = startPrice > 0 ? ((newPrice - startPrice) / startPrice) * 100 : 0;

  // Check reserve
  if (promptOut > promptRaised) {
    return {
      promptOut: 0,
      fee,
      creatorFee,
      platformFee,
      grossPrompt,
      avgPrice,
      newPrice,
      priceImpact,
      valid: false,
      error: 'Insufficient liquidity in reserve',
    };
  }

  return {
    promptOut,
    fee,
    creatorFee,
    platformFee,
    grossPrompt,
    avgPrice,
    newPrice,
    priceImpact,
    startPrice,
    newSharesSold,
    marketCap: newPrice * newSharesSold,
    fdv: newPrice * V7.TOTAL_SUPPLY,
    valid: true,
    error: null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { agentId, action, promptAmount, tokenAmount, walletAddress } = body;

    if (!agentId || !action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing agentId or action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (agent.token_graduated) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agent graduated. Use DEX for trading.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const p0 = agent.created_p0 ?? V7.DEFAULT_P0;
    const p1 = agent.created_p1 ?? V7.DEFAULT_P1;
    const sharesSold = parseFloat(agent.shares_sold || '0');
    const promptRaised = parseFloat(agent.prompt_raised || '0');

    if (action === 'buy') {
      if (!promptAmount || promptAmount <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid promptAmount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const quote = calculateBuyQuote(sharesSold, promptAmount, p0, p1);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'buy',
          quote: {
            ...quote,
            promptIn: promptAmount,
            currentPrice: calculateCurrentPrice(sharesSold, p0, p1),
            graduationProgress: (promptRaised / V7.GRADUATION_THRESHOLD) * 100,
            graduationThreshold: V7.GRADUATION_THRESHOLD,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sell') {
      if (!tokenAmount || tokenAmount <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid tokenAmount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user balance if wallet provided
      let userBalance = tokenAmount; // Default to allow quote without wallet
      if (walletAddress) {
        const { data: position } = await supabase
          .from('agent_database_positions')
          .select('token_balance')
          .eq('agent_id', agentId)
          .eq('holder_address', walletAddress.toLowerCase())
          .single();

        userBalance = position?.token_balance || 0;
      }

      const quote = calculateSellQuote(sharesSold, tokenAmount, promptRaised, userBalance, p0, p1);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'sell',
          quote: {
            ...quote,
            sharesIn: tokenAmount,
            currentPrice: calculateCurrentPrice(sharesSold, p0, p1),
            graduationProgress: (promptRaised / V7.GRADUATION_THRESHOLD) * 100,
            graduationThreshold: V7.GRADUATION_THRESHOLD,
            userBalance,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Action must be "buy" or "sell"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[V7 Quote] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
