import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const body: TradeRequest = await req.json();
    const { agentId, walletAddress, promptAmount, sharesAmount, action } = body;

    console.log(`[trading-engine-v6] ${action} request for agent ${agentId} from ${walletAddress}`);

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
    let newSharesSold: number;
    let newPromptRaised: number;
    let userSharesDelta: number;

    if (action === 'buy') {
      if (!promptAmount || promptAmount <= 0) {
        throw new Error('Invalid PROMPT amount');
      }

      result = calculateBuyReturn(sharesSold, promptAmount, p0, p1);
      newSharesSold = result.newSharesSold;
      newPromptRaised = promptRaised + result.promptAfterFee;
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

    // Update agent state
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        shares_sold: newSharesSold,
        prompt_raised: newPromptRaised,
        current_price: result.newPrice,
      })
      .eq('id', agentId);

    if (updateError) {
      throw new Error(`Failed to update agent: ${updateError.message}`);
    }

    // Update user position
    const { data: existingPosition } = await supabase
      .from('agent_database_positions')
      .select('token_balance')
      .eq('agent_id', agentId)
      .eq('holder_address', walletAddress.toLowerCase())
      .single();

    const currentBalance = existingPosition?.token_balance || 0;
    const newBalance = currentBalance + userSharesDelta;

    if (newBalance > 0) {
      const { error: positionError } = await supabase
        .from('agent_database_positions')
        .upsert({
          agent_id: agentId,
          holder_address: walletAddress.toLowerCase(),
          token_balance: newBalance,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'agent_id,holder_address',
        });

      if (positionError) {
        throw new Error(`Failed to update position: ${positionError.message}`);
      }
    } else if (existingPosition) {
      // Remove position if balance is 0
      await supabase
        .from('agent_database_positions')
        .delete()
        .eq('agent_id', agentId)
        .eq('holder_address', walletAddress.toLowerCase());
    }

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

    // Check graduation threshold
    let shouldGraduate = false;
    if (newPromptRaised >= CONSTANTS.GRADUATION_THRESHOLD_PROMPT) {
      console.log(`[trading-engine-v6] Agent ${agentId} reached graduation threshold!`);
      shouldGraduate = true;
      
      // Mark as pending graduation
      await supabase
        .from('agents')
        .update({ bonding_curve_phase: 'graduating' })
        .eq('id', agentId);
    }

    const response = {
      success: true,
      action,
      agentId,
      walletAddress,
      result: {
        ...result,
        newSharesSold,
        newPromptRaised,
        userNewBalance: newBalance,
      },
      shouldGraduate,
      graduationThreshold: CONSTANTS.GRADUATION_THRESHOLD_PROMPT,
      progressPercent: (newPromptRaised / CONSTANTS.GRADUATION_THRESHOLD_PROMPT) * 100,
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
