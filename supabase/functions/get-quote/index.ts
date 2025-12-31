import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitExceededResponse,
  getRateLimitConfig
} from '../_shared/rateLimitV2.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ V6.1 Constants - CORRECT VALUES (was V5 with 1M cap)
const BONDING_CURVE_V6_CONSTANTS = {
  DATABASE_TRADEABLE_CAP: 300_000_000,  // 300M tradeable supply (NOT 1M!)
  BUY_FEE_BPS: 500,   // 5%
  SELL_FEE_BPS: 500,  // 5%
  BASIS_POINTS: 10000,
  DEFAULT_P0: 0.00004,
  DEFAULT_P1: 0.00024,  // Adjusted for 42K graduation
};

function calculateCurrentPrice(p0: number, p1: number, tokensSold: number): number {
  const { DATABASE_TRADEABLE_CAP } = BONDING_CURVE_V6_CONSTANTS;
  const priceRange = p1 - p0;
  return p0 + (priceRange * tokensSold) / DATABASE_TRADEABLE_CAP;
}

function calculateBuyReturn(
  p0: number,
  p1: number,
  tokensSold: number,
  promptIn: number
): { tokensOut: number; fee: number; priceAtEnd: number; avgPrice: number } {
  const { BUY_FEE_BPS, BASIS_POINTS, DATABASE_TRADEABLE_CAP } = BONDING_CURVE_V6_CONSTANTS;

  const fee = (promptIn * BUY_FEE_BPS) / BASIS_POINTS;
  const promptAfterFee = promptIn - fee;
  const priceAtStart = calculateCurrentPrice(p0, p1, tokensSold);
  const slope = (p1 - p0) / DATABASE_TRADEABLE_CAP;

  let tokensOut: number;
  if (Math.abs(slope) < 1e-15) {
    tokensOut = promptAfterFee / priceAtStart;
  } else {
    // Quadratic formula
    const a = slope / 2;
    const b = priceAtStart;
    const c = -promptAfterFee;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      throw new Error('Invalid trade parameters');
    }

    tokensOut = (-b + Math.sqrt(discriminant)) / (2 * a);
  }

  // Cap at max supply
  tokensOut = Math.min(tokensOut, DATABASE_TRADEABLE_CAP - tokensSold);
  const priceAtEnd = calculateCurrentPrice(p0, p1, tokensSold + tokensOut);
  const avgPrice = tokensOut > 0 ? promptAfterFee / tokensOut : 0;

  return { tokensOut, fee, priceAtEnd, avgPrice };
}

function calculateSellReturn(
  p0: number,
  p1: number,
  tokensSold: number,
  tokensIn: number
): { promptOut: number; fee: number; priceAtEnd: number; avgPrice: number } {
  const { SELL_FEE_BPS, BASIS_POINTS, DATABASE_TRADEABLE_CAP } = BONDING_CURVE_V6_CONSTANTS;

  const priceAtStart = calculateCurrentPrice(p0, p1, tokensSold);

  // Area under curve = integral from (tokensSold - tokensIn) to tokensSold
  const newTokensSold = tokensSold - tokensIn;
  const priceAtEnd = calculateCurrentPrice(p0, p1, newTokensSold);

  // Trapezoidal area (average price * quantity)
  const avgPriceGross = (priceAtStart + priceAtEnd) / 2;
  const grossPrompt = avgPriceGross * tokensIn;

  const fee = (grossPrompt * SELL_FEE_BPS) / BASIS_POINTS;
  const promptOut = grossPrompt - fee;
  const avgPrice = tokensIn > 0 ? promptOut / tokensIn : 0;

  return { promptOut, fee, priceAtEnd, avgPrice };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limiting
    const clientId = getClientIdentifier(req);
    const config = getRateLimitConfig('get-quote');
    const rateCheck = await checkRateLimit(supabase, clientId, 'get-quote', config.maxRequests, config.windowSeconds);

    if (!rateCheck.allowed) {
      return rateLimitExceededResponse(rateCheck, corsHeaders, config.maxRequests);
    }

    // Support both query params (GET) and JSON body (POST)
    let side: string | null = null;
    let amount: number | null = null;
    let agentId: string | null = null;
    let address: string | null = null;
    let chainId: string = '84532';

    if (req.method === 'GET') {
      const url = new URL(req.url);
      side = url.searchParams.get('side');
      const amountStr = url.searchParams.get('amount');
      amount = amountStr ? parseFloat(amountStr) : null;
      agentId = url.searchParams.get('agentId');
      address = url.searchParams.get('address');
      chainId = url.searchParams.get('chainId') || '84532';
    } else {
      const body = await req.json();
      side = body.action || body.side;
      amount = body.promptAmount || body.tokenAmount || body.amount;
      agentId = body.agentId;
      address = body.address;
      chainId = body.chainId || '84532';
    }

    // Validate required params
    if (!side || amount === null) {
      return new Response(
        JSON.stringify({
          ok: false,
          success: false,
          error: 'side and amount are required',
          usage: 'GET /get-quote?agentId={id}&side={buy|sell}&amount={number}'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (side !== 'buy' && side !== 'sell') {
      return new Response(
        JSON.stringify({ ok: false, success: false, error: 'side must be "buy" or "sell"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ ok: false, success: false, error: 'amount must be a positive number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!address && !agentId) {
      return new Response(
        JSON.stringify({ ok: false, success: false, error: 'address or agentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch agent data
    let query = supabase.from('agents').select('*');

    if (agentId) {
      console.log(`[get-quote] Looking up by agentId: ${agentId}`);
      query = query.eq('id', agentId);
    } else if (address) {
      console.log(`[get-quote] Looking up by address: ${address}, chainId: ${chainId}`);
      query = query.ilike('token_address', address.toLowerCase()).eq('chain_id', parseInt(chainId));
    }

    const { data: agent, error } = await query.maybeSingle();

    if (error) {
      console.error('[get-quote] DB error:', error);
      return new Response(
        JSON.stringify({ ok: false, success: false, error: 'Database error', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!agent) {
      console.log(`[get-quote] Token not found for agentId=${agentId}, address=${address}`);
      return new Response(
        JSON.stringify({ ok: false, success: false, error: 'Token not found', searched: { agentId, address, chainId } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-quote] Found agent ${agent.name} (${agent.symbol})`);

    // Check if graduated
    if (agent.token_graduated || agent.bonding_curve_phase === 'graduated') {
      return new Response(
        JSON.stringify({
          ok: false,
          success: false,
          error: 'Token has graduated - use DEX for trading',
          graduated: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get bonding curve params - use shares_sold for V6
    const p0 = Number(agent.created_p0) || BONDING_CURVE_V6_CONSTANTS.DEFAULT_P0;
    const p1 = Number(agent.created_p1) || BONDING_CURVE_V6_CONSTANTS.DEFAULT_P1;
    const tokensSold = Number(agent.shares_sold) || Number(agent.bonding_curve_supply) || Number(agent.circulating_supply) || 0;
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
      const result = calculateBuyReturn(p0, p1, tokensSold, amount);
      const priceImpact = currentPrice > 0 ? ((result.priceAtEnd - currentPrice) / currentPrice) * 100 : 0;

      quote = {
        input_amount: amount,
        output_amount: Number(result.tokensOut.toFixed(6)),
        price_impact_percent: Number(priceImpact.toFixed(4)),
        fee_amount: Number(result.fee.toFixed(6)),
        effective_price: Number(result.avgPrice.toFixed(8)),
        side: 'buy',
      };
    } else {
      // amount is tokens to sell
      if (amount > tokensSold) {
        return new Response(
          JSON.stringify({ ok: false, success: false, error: 'Cannot sell more than available supply' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = calculateSellReturn(p0, p1, tokensSold, amount);
      const priceImpact = currentPrice > 0 ? ((result.priceAtEnd - currentPrice) / currentPrice) * 100 : 0;

      quote = {
        input_amount: amount,
        output_amount: Number(result.promptOut.toFixed(6)),
        price_impact_percent: Number(Math.abs(priceImpact).toFixed(4)),
        fee_amount: Number(result.fee.toFixed(6)),
        effective_price: Number(result.avgPrice.toFixed(8)),
        side: 'sell',
      };
    }

    console.log(`[get-quote] ${side} quote for ${agent.symbol}: input=${quote.input_amount}, output=${quote.output_amount}`);

    return new Response(
      JSON.stringify({
        ok: true,
        success: true,
        data: {
          ...quote,
          token: {
            id: agent.id,
            symbol: agent.symbol,
            name: agent.name,
            current_price: currentPrice,
          }
        },
        // Also include for compatibility with other callers
        quote: {
          ...quote,
          tokensOut: quote.side === 'buy' ? quote.output_amount : undefined,
          promptOut: quote.side === 'sell' ? quote.output_amount : undefined,
          priceAtEnd: quote.side === 'buy' 
            ? calculateCurrentPrice(p0, p1, tokensSold + quote.output_amount)
            : calculateCurrentPrice(p0, p1, tokensSold - quote.input_amount),
        },
        currentPrice,
        agentState: {
          sharesSold: tokensSold,
          p0,
          p1,
          cap: BONDING_CURVE_V6_CONSTANTS.DATABASE_TRADEABLE_CAP,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[get-quote] Error:', error);
    return new Response(
      JSON.stringify({ ok: false, success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
