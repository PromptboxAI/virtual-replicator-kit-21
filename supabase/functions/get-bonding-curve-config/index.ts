import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V8 Contract Addresses (Base Sepolia Testnet)
const V8_CONTRACTS = {
  BONDING_CURVE: '0xc511a151b0E04D5Ba87968900eE90d310530D5fB',
  AGENT_FACTORY: '0xe8214F54e4a670A92B8A6Fc2Da1DB70b091A4a79',
  GRADUATION_MANAGER: '0x3c6878857FB1d1a1155b016A4b904c479395B2D9',
  TRADING_ROUTER: '0xce81D37B4f2855Ce1081D172dF7013b8beAE79B0',
  PROMPT_TOKEN: '0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673',
} as const;

const V8_CONSTANTS = {
  TRADING_FEE_BPS: 100, // 1%
  CREATION_FEE_WEI: '100000000000000000000', // 100 PROMPT
  GRADUATION_THRESHOLD: 50000, // tokens sold to graduate
  CHAIN_ID: 84532, // Base Sepolia
  NETWORK_ENVIRONMENT: 'testnet',
} as const;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let tokenAddress: string | null = null;

    // If agentId provided, fetch agent-specific token address
    if (agentId) {
      const { data: agent, error } = await supabase
        .from('agents')
        .select('prototype_token_address, token_address, is_v8')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('Error fetching agent:', error);
      } else if (agent) {
        // Use prototype_token_address for V8 agents, fallback to token_address
        tokenAddress = agent.prototype_token_address || agent.token_address;
      }
    }

    const response = {
      ok: true,
      apiVersion: 'v1',
      data: {
        // Agent-specific (null if no agentId provided)
        tokenAddress,

        // Global V8 contracts (same for all agents on this network)
        bondingCurveAddress: V8_CONTRACTS.BONDING_CURVE,
        tradingRouterAddress: V8_CONTRACTS.TRADING_ROUTER,
        agentFactoryAddress: V8_CONTRACTS.AGENT_FACTORY,
        graduationManagerAddress: V8_CONTRACTS.GRADUATION_MANAGER,
        promptTokenAddress: V8_CONTRACTS.PROMPT_TOKEN,

        // Network info
        chainId: V8_CONSTANTS.CHAIN_ID,
        networkEnvironment: V8_CONSTANTS.NETWORK_ENVIRONMENT,

        // Trading constants
        tradingFeeBps: V8_CONSTANTS.TRADING_FEE_BPS,
        creationFeeWei: V8_CONSTANTS.CREATION_FEE_WEI,
        graduationThreshold: V8_CONSTANTS.GRADUATION_THRESHOLD,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in get-bonding-curve-config:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
