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

interface TradeRequest {
  agentId: string;
  walletAddress: string;
  promptAmount?: number;
  sharesAmount?: number;
  action: 'buy' | 'sell';
}

// V6.1 Constants
const CONSTANTS = {
  TOTAL_SUPPLY: 1_000_000_000,
  DATABASE_TRADEABLE_CAP: 300_000_000,
  GRADUATION_THRESHOLD_PROMPT: 42_000,
  DEFAULT_P0: 0.00004,
  DEFAULT_P1: 0.00024, // Adjusted for 42K PROMPT graduation threshold
  TRADING_FEE_BPS: 500, // 5%
  CREATOR_FEE_BPS: 4000, // 40% of fee
  VAULT_FEE_BPS: 4000, // 40% of fee
  LP_TREASURY_FEE_BPS: 2000, // 20% of fee
};

// Calculate current price based on shares sold
function calculateCurrentPrice(sharesSold: number, p0: number, p1: number): number {
  const m = (p1 - p0) / CONSTANTS.DATABASE_TRADEABLE_CAP;
  return p0 + m * sharesSold;
}

// Calculate buy return
function calculateBuyReturn(sharesSold: number, promptIn: number, p0: number, p1: number) {
  const feeAmount = promptIn * (CONSTANTS.TRADING_FEE_BPS / 10000);
  const promptAfterFee = promptIn - feeAmount;
  
  const m = (p1 - p0) / CONSTANTS.DATABASE_TRADEABLE_CAP;
  const currentPrice = p0 + m * sharesSold;
  
  // Quadratic formula for shares
  const a = m / 2;
  const b = currentPrice;
  const c = -promptAfterFee;
  
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    throw new Error('Invalid trade parameters');
  }
  
  const sharesOut = (-b + Math.sqrt(discriminant)) / (2 * a);
  const newSharesSold = sharesSold + sharesOut;
  
  if (newSharesSold > CONSTANTS.DATABASE_TRADEABLE_CAP) {
    throw new Error('Exceeds database tradeable cap');
  }
  
  const avgPrice = promptAfterFee / sharesOut;
  const newPrice = p0 + m * newSharesSold;
  
  // Fee distribution
  const creatorFee = feeAmount * (CONSTANTS.CREATOR_FEE_BPS / 10000);
  const vaultFee = feeAmount * (CONSTANTS.VAULT_FEE_BPS / 10000);
  const lpTreasuryFee = feeAmount * (CONSTANTS.LP_TREASURY_FEE_BPS / 10000);
  
  return {
    sharesOut,
    promptIn,
    promptAfterFee,
    feeAmount,
    avgPrice,
    newPrice,
    newSharesSold,
    creatorFee,
    vaultFee,
    lpTreasuryFee,
  };
}

// Calculate sell return
function calculateSellReturn(sharesSold: number, sharesIn: number, p0: number, p1: number) {
  if (sharesIn > sharesSold) {
    throw new Error('Cannot sell more than available supply');
  }
  
  const m = (p1 - p0) / CONSTANTS.DATABASE_TRADEABLE_CAP;
  const startPrice = p0 + m * sharesSold;
  const endPrice = p0 + m * (sharesSold - sharesIn);
  
  // Area under curve (integral)
  const promptGross = sharesIn * (startPrice + endPrice) / 2;
  const feeAmount = promptGross * (CONSTANTS.TRADING_FEE_BPS / 10000);
  const promptNet = promptGross - feeAmount;
  
  const newSharesSold = sharesSold - sharesIn;
  const newPrice = p0 + m * newSharesSold;
  const avgPrice = promptNet / sharesIn;
  
  // Fee distribution
  const creatorFee = feeAmount * (CONSTANTS.CREATOR_FEE_BPS / 10000);
  const vaultFee = feeAmount * (CONSTANTS.VAULT_FEE_BPS / 10000);
  const lpTreasuryFee = feeAmount * (CONSTANTS.LP_TREASURY_FEE_BPS / 10000);
  
  return {
    promptOut: promptNet,
    promptGross,
    feeAmount,
    avgPrice,
    newPrice,
    newSharesSold,
    creatorFee,
    vaultFee,
    lpTreasuryFee,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // DB-backed rate limiting: 50 trades per minute per client (persistent across instances)
    const clientId = getClientIdentifier(req);
    const config = getRateLimitConfig('trading-engine-v6');
    const rateCheck = await checkRateLimit(supabase, clientId, 'trading-engine-v6', config.maxRequests, config.windowSeconds);
    
    if (!rateCheck.allowed) {
      console.warn(`[trading-engine-v6] Rate limit exceeded for ${clientId}`);
      return rateLimitExceededResponse(rateCheck, corsHeaders, config.maxRequests);
    }

    const body: TradeRequest = await req.json();
    const { agentId, walletAddress, promptAmount, sharesAmount, action } = body;

    console.log(`[trading-engine-v6] ${action} request for agent ${agentId} from ${walletAddress} (remaining: ${rateCheck.remaining})`);

    // Get agent data
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*, creator_wallet_address')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentError?.message}`);
    }

    if (agent.bonding_curve_phase === 'graduated') {
      throw new Error('Agent has graduated - trade on Uniswap');
    }

    const sharesSold = agent.shares_sold || 0;
    const promptRaised = agent.prompt_raised || 0;
    const p0 = agent.created_p0 || CONSTANTS.DEFAULT_P0;
    const p1 = agent.created_p1 || CONSTANTS.DEFAULT_P1;

    let result;
    let userSharesDelta: number;

    if (action === 'buy') {
      if (!promptAmount || promptAmount <= 0) {
        throw new Error('Invalid PROMPT amount');
      }

      result = calculateBuyReturn(sharesSold, promptAmount, p0, p1);
      userSharesDelta = result.sharesOut;

      console.log(`[trading-engine-v6] Buy: ${promptAmount} PROMPT -> ${result.sharesOut} shares`);
    } else if (action === 'sell') {
      if (!sharesAmount || sharesAmount <= 0) {
        throw new Error('Invalid shares amount');
      }

      // Check user has enough shares
      const { data: position } = await supabase
        .from('agent_database_positions')
        .select('token_balance')
        .eq('agent_id', agentId)
        .eq('holder_address', walletAddress.toLowerCase())
        .single();

      const userBalance = position?.token_balance || 0;
      if (sharesAmount > userBalance) {
        throw new Error(`Insufficient shares: have ${userBalance}, want to sell ${sharesAmount}`);
      }

      result = calculateSellReturn(sharesSold, sharesAmount, p0, p1);
      newSharesSold = result.newSharesSold;
      newPromptRaised = promptRaised - result.promptOut;
      userSharesDelta = -sharesAmount;

      console.log(`[trading-engine-v6] Sell: ${sharesAmount} shares -> ${result.promptOut} PROMPT`);
    } else {
      throw new Error('Invalid action');
    }

    // ============================================
    // ATOMIC STATE UPDATES (prevents race conditions)
    // ============================================

    // 1. Atomically update agent state
    const { data: agentUpdate, error: agentUpdateError } = await supabase.rpc('atomic_update_agent_state', {
      p_agent_id: agentId,
      p_shares_delta: action === 'buy' ? result.sharesOut : -sharesAmount!,
      p_prompt_delta: action === 'buy' ? result.promptAfterFee : -result.promptOut,
      p_new_price: result.newPrice
    });

    if (agentUpdateError || !agentUpdate?.success) {
      throw new Error(`Failed to update agent state: ${agentUpdateError?.message || agentUpdate?.error}`);
    }

    // 2. Atomically update user position
    const { data: positionUpdate, error: positionError } = await supabase.rpc('atomic_update_position', {
      p_agent_id: agentId,
      p_holder_address: walletAddress.toLowerCase(),
      p_delta: userSharesDelta
    });

    if (positionError || !positionUpdate?.success) {
      console.error('[trading-engine-v6] Position update failed after agent state update - potential inconsistency');
      throw new Error(`Failed to update position: ${positionError?.message || positionUpdate?.error}`);
    }

    const newBalance = positionUpdate.new_balance;

    // Record trade
    const tradeRecord = {
      agent_id: agentId,
      user_id: walletAddress.toLowerCase(),
      prompt_amount: action === 'buy' ? promptAmount : result.promptOut,
      token_amount: action === 'buy' ? result.sharesOut : sharesAmount,
      price_per_token: result.avgPrice,
      bonding_curve_price: result.newPrice,
    };

    if (action === 'buy') {
      await supabase.from('agent_token_buy_trades').insert(tradeRecord);
    } else {
      await supabase.from('agent_token_sell_trades').insert(tradeRecord);
    }

    // Update token_holders count on agents table
    const { count: holderCount } = await supabase
      .from('agent_database_positions')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .gt('token_balance', 0);

    await supabase
      .from('agents')
      .update({ token_holders: holderCount || 0 })
      .eq('id', agentId);

    // Also sync to agent_token_holders for compatibility with other views
    await supabase
      .from('agent_token_holders')
      .upsert({
        agent_id: agentId,
        user_id: walletAddress.toLowerCase(),
        token_balance: newBalance,
        total_invested: action === 'buy' ? promptAmount : 0,
        average_buy_price: result.avgPrice,
      }, { onConflict: 'agent_id,user_id' });

    // Check graduation (from atomic function result)
    const shouldGraduate = agentUpdate.should_graduate || false;
    if (shouldGraduate) {
      console.log(`[trading-engine-v6] Agent ${agentId} reached graduation threshold!`);
    }

    const response = {
      success: true,
      action,
      agentId,
      walletAddress,
      result: {
        ...result,
        newSharesSold: agentUpdate.shares_sold,
        newPromptRaised: agentUpdate.prompt_raised,
        userNewBalance: newBalance,
      },
      shouldGraduate,
      graduationThreshold: CONSTANTS.GRADUATION_THRESHOLD_PROMPT,
      progressPercent: (agentUpdate.prompt_raised / CONSTANTS.GRADUATION_THRESHOLD_PROMPT) * 100,
    };

    console.log(`[trading-engine-v6] Trade completed:`, response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[trading-engine-v6] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
