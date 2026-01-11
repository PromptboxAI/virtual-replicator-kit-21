import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createPublicClient, http, formatEther, parseEther } from "https://esm.sh/viem@2.7.0";
import { baseSepolia } from "https://esm.sh/viem@2.7.0/chains";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V8 Contract Addresses
const BONDING_CURVE_V8 = Deno.env.get('BONDING_CURVE_V8_ADDRESS') || '0xc511a151b0E04D5Ba87968900eE90d310530D5fB';
const BASE_SEPOLIA_RPC = Deno.env.get('BASE_SEPOLIA_RPC') || 'https://sepolia.base.org';

// BondingCurveV8 ABI - VERIFIED AGAINST DEPLOYED CONTRACT
const BONDING_CURVE_ABI = [
  {
    name: 'quoteBuy',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'promptAmountIn', type: 'uint256' }
    ],
    outputs: [
      { name: 'tokenAmountOut', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
      { name: 'priceAfter', type: 'uint256' }
    ]
  },
  {
    name: 'quoteSell',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'tokenAmountIn', type: 'uint256' }
    ],
    outputs: [
      { name: 'promptAmountOut', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
      { name: 'priceAfter', type: 'uint256' }
    ]
  },
  {
    name: 'getAgentState',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'bytes32' }],
    outputs: [
      { name: 'prototypeToken', type: 'address' },
      { name: 'supply', type: 'uint256' },
      { name: 'reserve', type: 'uint256' },
      { name: 'currentPrice', type: 'uint256' },
      { name: 'graduated', type: 'bool' }
    ]
  },
  {
    name: 'getCurrentPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'bytes32' }],
    outputs: [{ name: 'price', type: 'uint256' }]
  }
] as const;

// Convert UUID to bytes32 - MUST use padStart (not padEnd)
function uuidToBytes32(uuid: string): `0x${string}` {
  const cleanUuid = uuid.replace(/-/g, '');
  return `0x${cleanUuid.padStart(64, '0')}` as `0x${string}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const agentId = url.searchParams.get('agentId');
    const amount = url.searchParams.get('amount');

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase for data lookups
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get agent data from database
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, symbol, is_v8, prototype_token_address, graduation_phase, token_graduated, pricing_model, creation_mode')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: `Agent not found: ${agentId}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL: Check if agent is V8
    if (!agent.is_v8) {
      return new Response(
        JSON.stringify({ 
          error: 'Agent is not a V8 agent',
          details: {
            agentId,
            is_v8: agent.is_v8,
            pricing_model: agent.pricing_model,
            creation_mode: agent.creation_mode,
            message: 'This agent uses database-mode trading. Use the regular trade endpoints instead.'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if agent has prototype token deployed
    if (!agent.prototype_token_address) {
      return new Response(
        JSON.stringify({ 
          error: 'Agent has no on-chain deployment',
          details: {
            agentId,
            is_v8: agent.is_v8,
            prototype_token_address: null,
            message: 'This V8 agent has not been deployed on-chain yet.'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const agentIdBytes32 = uuidToBytes32(agentId);

    // Create viem public client for on-chain reads
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(BASE_SEPOLIA_RPC)
    });

    let responseData: Record<string, unknown>;

    switch (action) {
      case 'quoteBuy': {
        if (!amount) {
          return new Response(
            JSON.stringify({ error: 'amount is required for quoteBuy' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const promptAmountIn = parseEther(amount);
          
          const [tokenAmountOut, fee, priceAfter] = await publicClient.readContract({
            address: BONDING_CURVE_V8 as `0x${string}`,
            abi: BONDING_CURVE_ABI,
            functionName: 'quoteBuy',
            args: [agentIdBytes32, promptAmountIn]
          });

          responseData = {
            action: 'quoteBuy',
            agentId,
            is_v8: true,
            promptAmountIn: amount,
            tokenAmountOut: formatEther(tokenAmountOut),
            fee: formatEther(fee),
            priceAfter: formatEther(priceAfter),
            contractAddress: BONDING_CURVE_V8
          };
        } catch (contractError: any) {
          console.error('Contract quoteBuy failed:', contractError);
          return new Response(
            JSON.stringify({ 
              error: 'Contract call failed',
              details: contractError.message,
              hint: 'Agent may not be registered on BondingCurveV8. Check prototype_token_address.'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'quoteSell': {
        if (!amount) {
          return new Response(
            JSON.stringify({ error: 'amount is required for quoteSell' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const tokenAmountIn = parseEther(amount);
          
          const [promptAmountOut, fee, priceAfter] = await publicClient.readContract({
            address: BONDING_CURVE_V8 as `0x${string}`,
            abi: BONDING_CURVE_ABI,
            functionName: 'quoteSell',
            args: [agentIdBytes32, tokenAmountIn]
          });

          responseData = {
            action: 'quoteSell',
            agentId,
            is_v8: true,
            tokenAmountIn: amount,
            promptAmountOut: formatEther(promptAmountOut),
            fee: formatEther(fee),
            priceAfter: formatEther(priceAfter),
            contractAddress: BONDING_CURVE_V8
          };
        } catch (contractError: any) {
          console.error('Contract quoteSell failed:', contractError);
          return new Response(
            JSON.stringify({ 
              error: 'Contract call failed',
              details: contractError.message,
              hint: 'Agent may not be registered on BondingCurveV8.'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'getPrice': {
        try {
          const price = await publicClient.readContract({
            address: BONDING_CURVE_V8 as `0x${string}`,
            abi: BONDING_CURVE_ABI,
            functionName: 'getCurrentPrice',
            args: [agentIdBytes32]
          });

          responseData = {
            action: 'getPrice',
            agentId,
            is_v8: true,
            price: formatEther(price),
            contractAddress: BONDING_CURVE_V8
          };
        } catch (contractError: any) {
          console.error('Contract getCurrentPrice failed:', contractError);
          return new Response(
            JSON.stringify({ 
              error: 'Contract call failed',
              details: contractError.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'getState':
      default: {
        try {
          const [prototypeToken, supply, reserve, currentPrice, graduated] = await publicClient.readContract({
            address: BONDING_CURVE_V8 as `0x${string}`,
            abi: BONDING_CURVE_ABI,
            functionName: 'getAgentState',
            args: [agentIdBytes32]
          });

          responseData = {
            action: 'getState',
            agentId,
            is_v8: true,
            name: agent?.name,
            symbol: agent?.symbol,
            prototypeToken,
            prototypeTokenDb: agent?.prototype_token_address,
            supply: formatEther(supply),
            reserve: formatEther(reserve),
            currentPrice: formatEther(currentPrice),
            graduated,
            graduationPhase: agent?.graduation_phase,
            contractAddress: BONDING_CURVE_V8
          };
        } catch (contractError: any) {
          console.error('Contract getAgentState failed:', contractError);
          
          // Return database state if on-chain call fails
          responseData = {
            action: 'getState',
            agentId,
            is_v8: true,
            name: agent?.name,
            symbol: agent?.symbol,
            prototypeToken: agent?.prototype_token_address,
            supply: '0',
            reserve: '0',
            currentPrice: '0.00001',  // V8 P0
            graduated: false,
            graduationPhase: agent?.graduation_phase,
            contractAddress: BONDING_CURVE_V8,
            warning: 'On-chain state unavailable, returning database values',
            error: contractError.message
          };
        }
        break;
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in get-quote-v8:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
