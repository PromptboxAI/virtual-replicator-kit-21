import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { createPublicClient, http, parseEther, formatUnits, encodeFunctionData } from 'https://esm.sh/viem@2.7.0';
import { baseSepolia, base } from 'https://esm.sh/viem@2.7.0/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uniswap V3 Quoter V2 contract addresses
const UNISWAP_QUOTER_V2: Record<number, string> = {
  84532: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3', // Base Sepolia
  8453: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',  // Base Mainnet
};

// Uniswap V3 pool fees (in hundredths of a bip, i.e., 1e-6)
const POOL_FEES = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

// QuoterV2 ABI for quoteExactInputSingle
const QUOTER_V2_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ],
        name: 'params',
        type: 'tuple'
      }
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

interface DEXQuoteRequest {
  agentId: string;
  side: 'buy' | 'sell';
  amount: number;
  slippage?: number;
}

interface QuoteResult {
  input_amount: string;
  input_amount_raw: string;
  output_amount: string;
  output_amount_raw: string;
  price_impact_percent: number;
  fee_percent: number;
  fee_amount: string;
  gas_estimate: string;
  gas_estimate_usd: number;
  effective_price: number;
  min_output_amount: string;
  liquidity_pool: string | null;
  dex_type: string;
  route: string[];
  pool_fee_tier: number;
  expires_at: number;
  slippage_tolerance: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Parse request - support both GET query params and POST body
    let params: DEXQuoteRequest;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      params = {
        agentId: url.searchParams.get('agentId') || '',
        side: (url.searchParams.get('side') as 'buy' | 'sell') || 'buy',
        amount: parseFloat(url.searchParams.get('amount') || '0'),
        slippage: parseFloat(url.searchParams.get('slippage') || '0.5'),
      };
    } else {
      params = await req.json();
    }

    const { agentId, side, amount, slippage = 0.5 } = params;

    console.log(`📊 DEX Quote Request: ${side} ${amount} for agent ${agentId}`);

    // Validate required parameters
    if (!agentId || !side || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Missing or invalid required parameters: agentId, side, amount'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get agent data
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*, agent_graduation_events!agents_graduation_event_id_fkey(*)')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ ok: false, error: `Agent not found: ${agentError?.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Verify agent is graduated
    if (!agent.token_graduated) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Agent has not graduated yet - use bonding curve trading via trade-agent-token endpoint',
          graduated: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get PROMPT token address
    const { data: promptContract } = await supabase
      .from('deployed_contracts')
      .select('contract_address')
      .eq('contract_type', 'PROMPT')
      .eq('is_active', true)
      .single();

    const PROMPT_TOKEN = promptContract?.contract_address;
    const AGENT_TOKEN = agent.token_address;

    if (!PROMPT_TOKEN || !AGENT_TOKEN) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Token addresses not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Determine trade direction
    const tokenIn = side === 'buy' ? PROMPT_TOKEN : AGENT_TOKEN;
    const tokenOut = side === 'buy' ? AGENT_TOKEN : PROMPT_TOKEN;
    const amountIn = parseEther(amount.toString());

    // Get chain configuration
    const chainId = agent.chain_id || 84532; // Default to Base Sepolia
    const chain = chainId === 8453 ? base : baseSepolia;
    const rpcUrl = chainId === 8453 
      ? 'https://mainnet.base.org' 
      : 'https://sepolia.base.org';

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    // Get liquidity pool address from graduation event
    const liquidityPoolAddress = agent.agent_graduation_events?.liquidity_pool_address || null;

    // Try to get quote from Uniswap V3 Quoter
    let bestQuote: {
      amountOut: bigint;
      gasEstimate: bigint;
      fee: number;
    } | null = null;

    const quoterAddress = UNISWAP_QUOTER_V2[chainId];
    
    if (quoterAddress) {
      // Try each fee tier to find the best quote
      for (const fee of POOL_FEES) {
        try {
          console.log(`🔍 Trying fee tier ${fee / 10000}%...`);
          
          const quoteParams = {
            tokenIn: tokenIn as `0x${string}`,
            tokenOut: tokenOut as `0x${string}`,
            amountIn,
            fee,
            sqrtPriceLimitX96: BigInt(0),
          };

          // Use staticCall to simulate the quote
          const result = await publicClient.simulateContract({
            address: quoterAddress as `0x${string}`,
            abi: QUOTER_V2_ABI,
            functionName: 'quoteExactInputSingle',
            args: [quoteParams],
          });

          const [amountOut, , , gasEstimate] = result.result as [bigint, bigint, number, bigint];

          if (!bestQuote || amountOut > bestQuote.amountOut) {
            bestQuote = { amountOut, gasEstimate, fee };
            console.log(`✅ Found quote at ${fee / 10000}% fee: ${formatUnits(amountOut, 18)} tokens`);
          }
        } catch (err) {
          console.log(`⚠️ No liquidity at ${fee / 10000}% fee tier`);
        }
      }
    }

    // If no on-chain quote available, calculate estimated quote
    let outputAmount: bigint;
    let gasEstimate: bigint;
    let poolFeeTier: number;
    let priceImpact: number;

    if (bestQuote) {
      outputAmount = bestQuote.amountOut;
      gasEstimate = bestQuote.gasEstimate;
      poolFeeTier = bestQuote.fee;
      
      // Calculate price impact (simplified)
      const spotPrice = agent.current_price || 0.0001;
      const executedPrice = parseFloat(formatUnits(outputAmount, 18)) / amount;
      priceImpact = Math.abs((executedPrice - spotPrice) / spotPrice) * 100;
    } else {
      // Fallback: estimate based on current price with simulated slippage
      console.log('⚠️ No on-chain quote available, using estimated pricing');
      
      const spotPrice = agent.current_price || 0.0001;
      const estimatedSlippage = Math.min(amount * 0.001, 5); // 0.1% per unit, max 5%
      
      if (side === 'buy') {
        // Buying agent tokens with PROMPT
        const tokensReceived = amount / spotPrice * (1 - estimatedSlippage / 100);
        outputAmount = parseEther(tokensReceived.toFixed(18));
      } else {
        // Selling agent tokens for PROMPT
        const promptReceived = amount * spotPrice * (1 - estimatedSlippage / 100);
        outputAmount = parseEther(promptReceived.toFixed(18));
      }
      
      gasEstimate = BigInt(150000); // Estimated gas for Uniswap V3 swap
      poolFeeTier = 3000; // Default 0.3% fee
      priceImpact = estimatedSlippage;
    }

    // Calculate fee amount
    const feePercent = poolFeeTier / 10000;
    const feeAmount = amount * (feePercent / 100);

    // Calculate min output with slippage
    const slippageMultiplier = 1 - (slippage / 100);
    const minOutputAmount = BigInt(
      Math.floor(Number(outputAmount) * slippageMultiplier)
    );

    // Estimate gas cost in USD (assuming ~$2000 ETH price and typical gas prices)
    const gasPrice = BigInt(1000000); // 0.001 gwei for L2
    const gasCostWei = gasEstimate * gasPrice;
    const gasCostEth = parseFloat(formatUnits(gasCostWei, 18));
    const ethPrice = 2500; // Could fetch real price from oracle
    const gasCostUsd = gasCostEth * ethPrice;

    // Calculate effective price
    const outputAmountNum = parseFloat(formatUnits(outputAmount, 18));
    const effectivePrice = side === 'buy' 
      ? amount / outputAmountNum  // PROMPT per token
      : outputAmountNum / amount; // PROMPT per token

    // Build quote response
    const quote: QuoteResult = {
      input_amount: amount.toString(),
      input_amount_raw: amountIn.toString(),
      output_amount: formatUnits(outputAmount, 18),
      output_amount_raw: outputAmount.toString(),
      price_impact_percent: Math.round(priceImpact * 100) / 100,
      fee_percent: feePercent,
      fee_amount: feeAmount.toFixed(6),
      gas_estimate: formatUnits(gasEstimate, 0),
      gas_estimate_usd: Math.round(gasCostUsd * 100) / 100,
      effective_price: Math.round(effectivePrice * 1000000) / 1000000,
      min_output_amount: formatUnits(minOutputAmount, 18),
      liquidity_pool: liquidityPoolAddress,
      dex_type: 'uniswap_v3',
      route: [tokenIn, tokenOut],
      pool_fee_tier: poolFeeTier,
      expires_at: Date.now() + 30000, // Quote valid for 30 seconds
      slippage_tolerance: slippage,
    };

    console.log(`✅ DEX Quote generated:`, {
      side,
      input: amount,
      output: quote.output_amount,
      impact: quote.price_impact_percent + '%',
      fee: quote.fee_percent + '%',
    });

    return new Response(
      JSON.stringify({
        ok: true,
        data: quote,
        agent: {
          id: agent.id,
          name: agent.name,
          symbol: agent.symbol,
          token_address: AGENT_TOKEN,
          current_price: agent.current_price,
          graduated: true,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ DEX Quote failed:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
