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

// BondingCurveV8 ABI for read functions
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

// Convert UUID to bytes32
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

    const agentIdBytes32 = uuidToBytes32(agentId);

    // Create viem public client for on-chain reads
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(BASE_SEPOLIA_RPC)
    });

    // Initialize Supabase for additional data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get agent data from database for metadata
    const { data: agent } = await supabase
      .from('agents')
      .select('id, name, symbol, prototype_token_address, graduation_phase, token_graduated')
      .eq('id', agentId)
      .single();

    let responseData: Record<string, unknown>;

    switch (action) {
      case 'quoteBuy': {
        if (!amount) {
          return new Response(
            JSON.stringify({ error: 'amount is required for quoteBuy' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const promptAmountIn = parseEther(amount);
        
        // Call actual contract
        const [tokenAmountOut, fee, priceAfter] = await publicClient.readContract({
          address: BONDING_CURVE_V8 as `0x${string}`,
          abi: BONDING_CURVE_ABI,
          functionName: 'quoteBuy',
          args: [agentIdBytes32, promptAmountIn]
        });

        responseData = {
          action: 'quoteBuy',
          agentId,
          promptAmountIn: amount,
          tokenAmountOut: formatEther(tokenAmountOut),
          fee: formatEther(fee),
          priceAfter: formatEther(priceAfter),
          contractAddress: BONDING_CURVE_V8
        };
        break;
      }

      case 'quoteSell': {
        if (!amount) {
          return new Response(
            JSON.stringify({ error: 'amount is required for quoteSell' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokenAmountIn = parseEther(amount);
        
        // Call actual contract
        const [promptAmountOut, fee, priceAfter] = await publicClient.readContract({
          address: BONDING_CURVE_V8 as `0x${string}`,
          abi: BONDING_CURVE_ABI,
          functionName: 'quoteSell',
          args: [agentIdBytes32, tokenAmountIn]
        });

        responseData = {
          action: 'quoteSell',
          agentId,
          tokenAmountIn: amount,
          promptAmountOut: formatEther(promptAmountOut),
          fee: formatEther(fee),
          priceAfter: formatEther(priceAfter),
          contractAddress: BONDING_CURVE_V8
        };
        break;
      }

      case 'getPrice': {
        // Get current price from contract
        const price = await publicClient.readContract({
          address: BONDING_CURVE_V8 as `0x${string}`,
          abi: BONDING_CURVE_ABI,
          functionName: 'getCurrentPrice',
          args: [agentIdBytes32]
        });

        responseData = {
          action: 'getPrice',
          agentId,
          price: formatEther(price),
          contractAddress: BONDING_CURVE_V8
        };
        break;
      }

      case 'getState':
      default: {
        // Get full agent state from contract
        const [prototypeToken, supply, reserve, currentPrice, graduated] = await publicClient.readContract({
          address: BONDING_CURVE_V8 as `0x${string}`,
          abi: BONDING_CURVE_ABI,
          functionName: 'getAgentState',
          args: [agentIdBytes32]
        });

        responseData = {
          action: 'getState',
          agentId,
          name: agent?.name,
          symbol: agent?.symbol,
          prototypeToken,
          supply: formatEther(supply),
          reserve: formatEther(reserve),
          currentPrice: formatEther(currentPrice),
          graduated,
          graduationPhase: agent?.graduation_phase,
          contractAddress: BONDING_CURVE_V8
        };
        break;
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-quote-v8:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
