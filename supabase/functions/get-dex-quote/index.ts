import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { createPublicClient, http, parseEther, formatUnits } from 'https://esm.sh/viem@2.7.0';
import { baseSepolia, base } from 'https://esm.sh/viem@2.7.0/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uniswap V2 Router addresses
const UNISWAP_V2_ROUTER: Record<number, string> = {
  84532: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24', // Base Sepolia
  8453: '0x4752ba5DBc23f44d87826276BF6Fd6b1C372aD24',  // Base Mainnet
};

// V2 Router ABI for getAmountsOut
const V2_ROUTER_ABI = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' }
    ],
    name: 'getAmountsOut',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'path', type: 'address[]' }
    ],
    name: 'getAmountsIn',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// V2 Pair ABI for reserves
const V2_PAIR_ABI = [
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Fixed V2 fee: 0.3%
const V2_FEE_PERCENT = 0.3;

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

    // Try to get quote from Uniswap V2 Router
    let outputAmount: bigint;
    let priceImpact: number;
    let gasEstimate = BigInt(120000); // V2 swaps typically use ~120k gas

    const routerAddress = UNISWAP_V2_ROUTER[chainId];
    
    if (routerAddress) {
      try {
        console.log(`🔍 Getting V2 quote from router...`);
        
        const path = [tokenIn as `0x${string}`, tokenOut as `0x${string}`];
        
        // Use getAmountsOut for exact input
        const amounts = await publicClient.readContract({
          address: routerAddress as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: 'getAmountsOut',
          args: [amountIn, path],
        }) as bigint[];

        outputAmount = amounts[1];
        console.log(`✅ V2 quote: ${formatUnits(outputAmount, 18)} tokens out`);

        // Calculate price impact from reserves if we have the LP address
        if (liquidityPoolAddress) {
          try {
            const reserves = await publicClient.readContract({
              address: liquidityPoolAddress as `0x${string}`,
              abi: V2_PAIR_ABI,
              functionName: 'getReserves',
            }) as [bigint, bigint, number];

            const token0 = await publicClient.readContract({
              address: liquidityPoolAddress as `0x${string}`,
              abi: V2_PAIR_ABI,
              functionName: 'token0',
            }) as string;

            // Calculate price impact based on trade size vs reserves
            const inputReserve = token0.toLowerCase() === tokenIn.toLowerCase() 
              ? reserves[0] : reserves[1];
            priceImpact = (Number(amountIn) / Number(inputReserve)) * 100;
          } catch {
            // Fallback price impact calculation
            priceImpact = Math.min(amount * 0.1, 10);
          }
        } else {
          priceImpact = Math.min(amount * 0.1, 10);
        }

      } catch (err) {
        console.log(`⚠️ Failed to get V2 quote:`, err);
        // Fallback to estimated pricing
        const spotPrice = agent.current_price || 0.0001;
        const estimatedSlippage = Math.min(amount * 0.001, 5);
        
        if (side === 'buy') {
          const tokensReceived = amount / spotPrice * (1 - estimatedSlippage / 100);
          outputAmount = parseEther(tokensReceived.toFixed(18));
        } else {
          const promptReceived = amount * spotPrice * (1 - estimatedSlippage / 100);
          outputAmount = parseEther(promptReceived.toFixed(18));
        }
        priceImpact = estimatedSlippage;
      }
    } else {
      // No router available, use estimated pricing
      console.log('⚠️ No V2 router available, using estimated pricing');
      
      const spotPrice = agent.current_price || 0.0001;
      const estimatedSlippage = Math.min(amount * 0.001, 5);
      
      if (side === 'buy') {
        const tokensReceived = amount / spotPrice * (1 - estimatedSlippage / 100);
        outputAmount = parseEther(tokensReceived.toFixed(18));
      } else {
        const promptReceived = amount * spotPrice * (1 - estimatedSlippage / 100);
        outputAmount = parseEther(promptReceived.toFixed(18));
      }
      priceImpact = estimatedSlippage;
    }

    // Calculate fee amount (fixed 0.3% for V2)
    const feeAmount = amount * (V2_FEE_PERCENT / 100);

    // Calculate min output with slippage
    const slippageMultiplier = 1 - (slippage / 100);
    const minOutputAmount = BigInt(
      Math.floor(Number(outputAmount) * slippageMultiplier)
    );

    // Estimate gas cost in USD
    const gasPrice = BigInt(1000000); // 0.001 gwei for L2
    const gasCostWei = gasEstimate * gasPrice;
    const gasCostEth = parseFloat(formatUnits(gasCostWei, 18));
    const ethPrice = 2500;
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
      fee_percent: V2_FEE_PERCENT,
      fee_amount: feeAmount.toFixed(6),
      gas_estimate: formatUnits(gasEstimate, 0),
      gas_estimate_usd: Math.round(gasCostUsd * 100) / 100,
      effective_price: Math.round(effectivePrice * 1000000) / 1000000,
      min_output_amount: formatUnits(minOutputAmount, 18),
      liquidity_pool: liquidityPoolAddress,
      dex_type: 'uniswap_v2',
      route: [tokenIn, tokenOut],
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
