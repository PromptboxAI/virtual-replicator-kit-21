import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bonding Curve V5 Constants
const BONDING_CURVE_V5_CONSTANTS = {
  GRADUATION_SUPPLY: 1_000_000,
  BUY_FEE_BPS: 500, // 5%
  SELL_FEE_BPS: 500, // 5%
  BASIS_POINTS: 10000,
  DEFAULT_P0: 0.00004,
  DEFAULT_P1: 0.00024, // Adjusted for 42K PROMPT graduation threshold
};

function calculateCurrentPrice(p0: number, p1: number, tokensSold: number): number {
  const priceRange = p1 - p0;
  return p0 + (priceRange * tokensSold) / BONDING_CURVE_V5_CONSTANTS.GRADUATION_SUPPLY;
}

function calculateBuyReturn(
  p0: number, 
  p1: number, 
  tokensSold: number, 
  promptIn: number
): { tokensOut: number; fee: number; priceAtEnd: number } {
  const { BUY_FEE_BPS, BASIS_POINTS, GRADUATION_SUPPLY } = BONDING_CURVE_V5_CONSTANTS;
  
  const fee = (promptIn * BUY_FEE_BPS) / BASIS_POINTS;
  const promptAfterFee = promptIn - fee;
  const priceAtStart = calculateCurrentPrice(p0, p1, tokensSold);
  const slope = (p1 - p0) / GRADUATION_SUPPLY;
  
  let tokensOut: number;
  if (Math.abs(slope) < 1e-15) {
    tokensOut = promptAfterFee / priceAtStart;
  } else {
    const a = slope / 2;
    const b = priceAtStart;
    const c = -promptAfterFee;
    const discriminant = b * b - 4 * a * c;
    tokensOut = (-b + Math.sqrt(discriminant)) / (2 * a);
  }
  
  tokensOut = Math.min(tokensOut, GRADUATION_SUPPLY - tokensSold);
  const priceAtEnd = calculateCurrentPrice(p0, p1, tokensSold + tokensOut);
  
  return { tokensOut, fee, priceAtEnd };
}

function calculateSellReturn(
  p0: number,
  p1: number,
  tokensSold: number,
  tokensIn: number
): { promptNet: number; fee: number; priceAtEnd: number } {
  const { SELL_FEE_BPS, BASIS_POINTS } = BONDING_CURVE_V5_CONSTANTS;
  
  const priceAtStart = calculateCurrentPrice(p0, p1, tokensSold);
  const priceAtEnd = calculateCurrentPrice(p0, p1, tokensSold - tokensIn);
  const averagePrice = (priceAtStart + priceAtEnd) / 2;
  const promptGross = tokensIn * averagePrice;
  const fee = (promptGross * SELL_FEE_BPS) / BASIS_POINTS;
  const promptNet = promptGross - fee;
  
  return { promptNet, fee, priceAtEnd };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const address = url.searchParams.get('address');
    const agentId = url.searchParams.get('agentId');
    const chainId = url.searchParams.get('chainId') || '84532';
    const side = url.searchParams.get('side'); // 'buy' or 'sell'
    const amountStr = url.searchParams.get('amount');

    // Validate required params
    if (!side || !amountStr) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'side and amount are required',
          usage: 'GET /get-quote?agentId={id}&side={buy|sell}&amount={number}'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (side !== 'buy' && side !== 'sell') {
      return new Response(
        JSON.stringify({ ok: false, error: 'side must be "buy" or "sell"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ ok: false, error: 'amount must be a positive number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!address && !agentId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'address or agentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch agent data
    let query = supabase.from('agents').select('*');
    
    if (agentId) {
      console.log(`📊 get-quote: Looking up by agentId: ${agentId}`);
      query = query.eq('id', agentId);
    } else if (address) {
      console.log(`📊 get-quote: Looking up by address: ${address}, chainId: ${chainId}`);
      query = query.ilike('token_address', address.toLowerCase()).eq('chain_id', parseInt(chainId));
    }

    const { data: agent, error } = await query.maybeSingle();

    if (error) {
      console.error('❌ get-quote DB error:', error);
      return new Response(
        JSON.stringify({ ok: false, error: 'Database error', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!agent) {
      console.log(`⚠️ get-quote: Token not found for agentId=${agentId}, address=${address}`);
      return new Response(
        JSON.stringify({ ok: false, error: 'Token not found', searched: { agentId, address, chainId } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ get-quote: Found agent ${agent.name} (${agent.symbol})`);


    // Check if graduated
    if (agent.token_graduated) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Token has graduated - use DEX for trading',
          graduated: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get bonding curve params
    const p0 = Number(agent.created_p0) || BONDING_CURVE_V5_CONSTANTS.DEFAULT_P0;
    const p1 = Number(agent.created_p1) || BONDING_CURVE_V5_CONSTANTS.DEFAULT_P1;
    const tokensSold = Number(agent.bonding_curve_supply) || Number(agent.circulating_supply) || 0;
    const currentPrice = calculateCurrentPrice(p0, p1, tokensSold);

    let quote: {
      input_amount: number;
      output_amount: number;
      price_impact_percent: number;
      fee_amount: number;
      effective_price: number;
      side: string;
    };

    if (side === 'buy') {
      // amount is PROMPT input
      const { tokensOut, fee, priceAtEnd } = calculateBuyReturn(p0, p1, tokensSold, amount);
      const priceImpact = ((priceAtEnd - currentPrice) / currentPrice) * 100;
      const effectivePrice = tokensOut > 0 ? (amount - fee) / tokensOut : 0;

      quote = {
        input_amount: amount,
        output_amount: Number(tokensOut.toFixed(6)),
        price_impact_percent: Number(priceImpact.toFixed(4)),
        fee_amount: Number(fee.toFixed(6)),
        effective_price: Number(effectivePrice.toFixed(8)),
        side: 'buy',
      };
    } else {
      // amount is tokens to sell
      const { promptNet, fee, priceAtEnd } = calculateSellReturn(p0, p1, tokensSold, amount);
      const priceImpact = ((priceAtEnd - currentPrice) / currentPrice) * 100;
      const effectivePrice = amount > 0 ? promptNet / amount : 0;

      quote = {
        input_amount: amount,
        output_amount: Number(promptNet.toFixed(6)),
        price_impact_percent: Number(Math.abs(priceImpact).toFixed(4)),
        fee_amount: Number(fee.toFixed(6)),
        effective_price: Number(effectivePrice.toFixed(8)),
        side: 'sell',
      };
    }

    console.log(`📊 Quote generated for ${agent.symbol}:`, quote);

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          ...quote,
          token: {
            id: agent.id,
            symbol: agent.symbol,
            name: agent.name,
            current_price: currentPrice,
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in get-quote:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
