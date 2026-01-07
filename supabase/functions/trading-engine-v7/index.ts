/**
 * Trading Engine V7
 * 
 * Handles buy/sell operations for V7 bonding curve agents.
 * Uses database mode for pre-graduation trading.
 * 
 * Key V7 Parameters:
 * - P0: 0.00004 PROMPT
 * - P1: 0.0003 PROMPT
 * - Tradeable Cap: 248,000,000
 * - Graduation Threshold: 42,160 PROMPT
 * - Fee: 5% (50% creator / 50% platform)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ V7 Constants ============
const V7 = {
  TRADEABLE_CAP: 248_000_000,
  DEFAULT_P0: 0.00004,
  DEFAULT_P1: 0.0003,
  GRADUATION_THRESHOLD: 42160,
  TRADING_FEE_BPS: 500,      // 5% total
  CREATOR_FEE_BPS: 5000,     // 50% of fee
  PLATFORM_FEE_BPS: 5000,    // 50% of fee
  BASIS_POINTS: 10000,
} as const;

// ============ Pricing Functions ============

function calculateCurrentPrice(sharesSold: number, p0: number, p1: number): number {
  if (sharesSold <= 0) return p0;
  if (sharesSold >= V7.TRADEABLE_CAP) return p1;
  const slope = (p1 - p0) / V7.TRADEABLE_CAP;
  return p0 + slope * sharesSold;
}

function calculateBuyReturn(
  sharesSold: number,
  promptIn: number,
  p0: number,
  p1: number
): {
  sharesOut: number;
  fee: number;
  creatorFee: number;
  platformFee: number;
  netPrompt: number;
  avgPrice: number;
  newPrice: number;
} {
  const fee = promptIn * (V7.TRADING_FEE_BPS / V7.BASIS_POINTS);
  const creatorFee = fee * (V7.CREATOR_FEE_BPS / V7.BASIS_POINTS);
  const platformFee = fee * (V7.PLATFORM_FEE_BPS / V7.BASIS_POINTS);
  const netPrompt = promptIn - fee;

  if (netPrompt <= 0) {
    return {
      sharesOut: 0,
      fee,
      creatorFee,
      platformFee,
      netPrompt: 0,
      avgPrice: 0,
      newPrice: calculateCurrentPrice(sharesSold, p0, p1),
    };
  }

  // Quadratic formula for shares out
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
      newPrice: calculateCurrentPrice(sharesSold, p0, p1),
    };
  }

  let sharesOut = (-b + Math.sqrt(discriminant)) / (2 * a);
  const maxShares = V7.TRADEABLE_CAP - sharesSold;
  if (sharesOut > maxShares) sharesOut = maxShares;

  const newSharesSold = sharesSold + sharesOut;
  const newPrice = calculateCurrentPrice(newSharesSold, p0, p1);
  const avgPrice = sharesOut > 0 ? netPrompt / sharesOut : 0;

  return {
    sharesOut,
    fee,
    creatorFee,
    platformFee,
    netPrompt,
    avgPrice,
    newPrice,
  };
}

function calculateSellReturn(
  sharesSold: number,
  sharesIn: number,
  p0: number,
  p1: number
): {
  promptOut: number;
  fee: number;
  creatorFee: number;
  platformFee: number;
  grossPrompt: number;
  avgPrice: number;
  newPrice: number;
} {
  if (sharesIn <= 0 || sharesSold <= 0) {
    return {
      promptOut: 0,
      fee: 0,
      creatorFee: 0,
      platformFee: 0,
      grossPrompt: 0,
      avgPrice: 0,
      newPrice: calculateCurrentPrice(sharesSold, p0, p1),
    };
  }

  const actualSharesIn = Math.min(sharesIn, sharesSold);
  const startPrice = calculateCurrentPrice(sharesSold, p0, p1);
  const newSharesSold = sharesSold - actualSharesIn;
  const newPrice = calculateCurrentPrice(newSharesSold, p0, p1);
  const avgPrice = (startPrice + newPrice) / 2;
  const grossPrompt = avgPrice * actualSharesIn;

  const fee = grossPrompt * (V7.TRADING_FEE_BPS / V7.BASIS_POINTS);
  const creatorFee = fee * (V7.CREATOR_FEE_BPS / V7.BASIS_POINTS);
  const platformFee = fee * (V7.PLATFORM_FEE_BPS / V7.BASIS_POINTS);
  const promptOut = grossPrompt - fee;

  return {
    promptOut,
    fee,
    creatorFee,
    platformFee,
    grossPrompt,
    avgPrice,
    newPrice,
  };
}

// ============ Rate Limiting ============

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  walletAddress: string
): Promise<{ allowed: boolean; error?: string }> {
  const windowMs = 60000; // 1 minute
  const maxRequests = 30;
  const now = Date.now();
  const windowStart = new Date(now - windowMs).toISOString();

  const { count } = await supabase
    .from('agent_token_buy_trades')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', walletAddress.toLowerCase())
    .gte('created_at', windowStart);

  if ((count || 0) >= maxRequests) {
    return { allowed: false, error: 'Rate limit exceeded. Please wait before trading again.' };
  }

  return { allowed: true };
}

// ============ Main Handler ============

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const {
      agentId,
      action,
      promptAmount,
      tokenAmount,
      walletAddress,
      minSharesOut,
      minPromptOut,
    } = body;

    // Validate required fields
    if (!agentId || !action || !walletAddress) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: agentId, action, walletAddress' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action !== 'buy' && action !== 'sell') {
      return new Response(
        JSON.stringify({ success: false, error: 'Action must be "buy" or "sell"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit check
    const rateCheck = await checkRateLimit(supabase, walletAddress);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: rateCheck.error }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch agent data
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

    // Check if graduated
    if (agent.token_graduated) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agent has graduated. Trade on DEX.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get V7 pricing parameters
    const p0 = agent.created_p0 ?? V7.DEFAULT_P0;
    const p1 = agent.created_p1 ?? V7.DEFAULT_P1;
    const sharesSold = parseFloat(agent.shares_sold || '0');
    const promptRaised = parseFloat(agent.prompt_raised || '0');

    console.log(`[V7] Agent ${agentId}: shares_sold=${sharesSold}, prompt_raised=${promptRaised}, p0=${p0}, p1=${p1}`);

    // ============ BUY ============
    if (action === 'buy') {
      if (!promptAmount || promptAmount <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid promptAmount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate buy return
      const result = calculateBuyReturn(sharesSold, promptAmount, p0, p1);

      if (result.sharesOut <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Trade amount too small or curve at capacity' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Slippage check
      if (minSharesOut && result.sharesOut < minSharesOut) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Slippage exceeded: would receive ${result.sharesOut.toFixed(4)} shares, minimum ${minSharesOut}`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newSharesSold = sharesSold + result.sharesOut;
      const newPromptRaised = promptRaised + result.netPrompt;

      // Atomic update agent state
      const { data: agentUpdate, error: updateError } = await supabase.rpc(
        'atomic_update_agent_state',
        {
          p_agent_id: agentId,
          p_shares_delta: result.sharesOut,
          p_prompt_delta: result.netPrompt,
          p_new_price: result.newPrice,
        }
      );

      if (updateError) {
        console.error('[V7] Agent state update error:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update agent state' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update user position
      const { error: positionError } = await supabase.rpc('atomic_update_position', {
        p_agent_id: agentId,
        p_holder_address: walletAddress.toLowerCase(),
        p_delta: result.sharesOut,
      });

      if (positionError) {
        console.error('[V7] Position update error:', positionError);
      }

      // Record trade
      await supabase.from('agent_token_buy_trades').insert({
        agent_id: agentId,
        user_id: walletAddress.toLowerCase(),
        prompt_amount: promptAmount,
        token_amount: result.sharesOut,
        price_per_token: result.avgPrice,
        bonding_curve_price: result.newPrice,
        tokens_sold_before: sharesSold,
      });

      // Update token_holders count
      const { count: holderCount } = await supabase
        .from('agent_database_positions')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .gt('token_balance', 0);

      await supabase
        .from('agents')
        .update({ token_holders: holderCount || 0 })
        .eq('id', agentId);

      // Sync to agent_token_holders
      await supabase.from('agent_token_holders').upsert(
        {
          agent_id: agentId,
          user_id: walletAddress.toLowerCase(),
          token_balance: (agentUpdate?.new_balance || 0) + result.sharesOut,
          total_invested: promptAmount,
          average_buy_price: result.avgPrice,
        },
        { onConflict: 'agent_id,user_id' }
      );

      // Check graduation
      const shouldGraduate = newPromptRaised >= V7.GRADUATION_THRESHOLD;

      console.log(`[V7] BUY complete: ${result.sharesOut.toFixed(4)} shares for ${promptAmount} PROMPT, newPrice=${result.newPrice.toFixed(8)}, shouldGraduate=${shouldGraduate}`);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'buy',
          sharesOut: result.sharesOut,
          promptIn: promptAmount,
          fee: result.fee,
          creatorFee: result.creatorFee,
          platformFee: result.platformFee,
          netPrompt: result.netPrompt,
          avgPrice: result.avgPrice,
          newPrice: result.newPrice,
          newSharesSold,
          newPromptRaised,
          shouldGraduate,
          graduationProgress: (newPromptRaised / V7.GRADUATION_THRESHOLD) * 100,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ SELL ============
    if (action === 'sell') {
      if (!tokenAmount || tokenAmount <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid tokenAmount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user balance
      const { data: position } = await supabase
        .from('agent_database_positions')
        .select('token_balance')
        .eq('agent_id', agentId)
        .eq('holder_address', walletAddress.toLowerCase())
        .single();

      const userBalance = position?.token_balance || 0;

      if (tokenAmount > userBalance) {
        return new Response(
          JSON.stringify({ success: false, error: `Insufficient balance: have ${userBalance}, trying to sell ${tokenAmount}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate sell return
      const result = calculateSellReturn(sharesSold, tokenAmount, p0, p1);

      // Check reserve
      if (result.promptOut > promptRaised) {
        return new Response(
          JSON.stringify({ success: false, error: 'Insufficient liquidity in reserve' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Slippage check
      if (minPromptOut && result.promptOut < minPromptOut) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Slippage exceeded: would receive ${result.promptOut.toFixed(4)} PROMPT, minimum ${minPromptOut}`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newSharesSold = sharesSold - tokenAmount;
      const newPromptRaised = promptRaised - result.grossPrompt;

      // Atomic update agent state (negative delta for sell)
      const { data: agentUpdate, error: updateError } = await supabase.rpc(
        'atomic_update_agent_state',
        {
          p_agent_id: agentId,
          p_shares_delta: -tokenAmount,
          p_prompt_delta: -result.grossPrompt,
          p_new_price: result.newPrice,
        }
      );

      if (updateError) {
        console.error('[V7] Agent state update error:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update agent state' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update user position (negative delta)
      await supabase.rpc('atomic_update_position', {
        p_agent_id: agentId,
        p_holder_address: walletAddress.toLowerCase(),
        p_delta: -tokenAmount,
      });

      // Record trade
      await supabase.from('agent_token_sell_trades').insert({
        agent_id: agentId,
        user_id: walletAddress.toLowerCase(),
        prompt_amount: result.promptOut,
        token_amount: tokenAmount,
        price_per_token: result.avgPrice,
        bonding_curve_price: result.newPrice,
        tokens_sold_before: sharesSold,
      });

      // Update token_holders count
      const { count: holderCount } = await supabase
        .from('agent_database_positions')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .gt('token_balance', 0);

      await supabase
        .from('agents')
        .update({ token_holders: holderCount || 0 })
        .eq('id', agentId);

      // Sync to agent_token_holders
      const newBalance = userBalance - tokenAmount;
      if (newBalance > 0) {
        await supabase.from('agent_token_holders').upsert(
          {
            agent_id: agentId,
            user_id: walletAddress.toLowerCase(),
            token_balance: newBalance,
          },
          { onConflict: 'agent_id,user_id' }
        );
      } else {
        await supabase
          .from('agent_token_holders')
          .delete()
          .eq('agent_id', agentId)
          .eq('user_id', walletAddress.toLowerCase());
      }

      console.log(`[V7] SELL complete: ${tokenAmount} shares for ${result.promptOut.toFixed(4)} PROMPT, newPrice=${result.newPrice.toFixed(8)}`);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'sell',
          sharesIn: tokenAmount,
          promptOut: result.promptOut,
          fee: result.fee,
          creatorFee: result.creatorFee,
          platformFee: result.platformFee,
          grossPrompt: result.grossPrompt,
          avgPrice: result.avgPrice,
          newPrice: result.newPrice,
          newSharesSold,
          newPromptRaised,
          graduationProgress: (Math.max(0, newPromptRaised) / V7.GRADUATION_THRESHOLD) * 100,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[V7] Trading engine error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
