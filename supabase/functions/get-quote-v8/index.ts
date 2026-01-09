import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V8 Contract Addresses
const BONDING_CURVE_V8 = Deno.env.get('BONDING_CURVE_V8_ADDRESS') || '0xc511a151b0E04D5Ba87968900eE90d310530D5fB';
const BASE_SEPOLIA_RPC = Deno.env.get('BASE_SEPOLIA_RPC') || 'https://sepolia.base.org';

// Minimal ABI for BondingCurveV8 read functions
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
  }
] as const;

// Convert UUID to bytes32
function uuidToBytes32(uuid: string): string {
  const cleanUuid = uuid.replace(/-/g, '');
  return '0x' + cleanUuid.padStart(64, '0');
}

// Parse wei to ether (18 decimals)
function parseEther(value: string): bigint {
  const [whole, decimal = ''] = value.split('.');
  const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18);
  return BigInt(whole + paddedDecimal);
}

// Format wei to ether string
function formatEther(wei: bigint): string {
  const str = wei.toString().padStart(19, '0');
  const whole = str.slice(0, -18) || '0';
  const decimal = str.slice(-18).replace(/0+$/, '');
  return decimal ? `${whole}.${decimal}` : whole;
}

// Encode function call data
function encodeFunctionData(functionName: string, args: unknown[]): string {
  const functionSignatures: Record<string, string> = {
    'quoteBuy': 'quoteBuy(bytes32,uint256)',
    'quoteSell': 'quoteSell(bytes32,uint256)',
    'getAgentState': 'getAgentState(bytes32)'
  };

  const signature = functionSignatures[functionName];
  if (!signature) throw new Error(`Unknown function: ${functionName}`);

  // Calculate function selector (first 4 bytes of keccak256)
  const encoder = new TextEncoder();
  const data = encoder.encode(signature);
  
  // Simple keccak256 not available, use eth_call with full signature
  // For now, we'll use a simpler RPC approach
  return signature;
}

// Make RPC call to read contract
async function readContract(
  functionName: string,
  agentIdBytes32: string,
  amount?: bigint
): Promise<unknown> {
  // Build the call data based on function
  let data: string;
  
  if (functionName === 'getAgentState') {
    // getAgentState(bytes32) selector: 0x1e8d0c0e (example, will use eth_call)
    data = '0x1e8d0c0e' + agentIdBytes32.slice(2);
  } else if (functionName === 'quoteBuy') {
    // quoteBuy(bytes32,uint256) 
    data = '0x' + 'quoteBuy(bytes32,uint256)'.slice(0, 8) + 
           agentIdBytes32.slice(2) + 
           (amount?.toString(16).padStart(64, '0') || '0'.repeat(64));
  } else if (functionName === 'quoteSell') {
    // quoteSell(bytes32,uint256)
    data = '0x' + agentIdBytes32.slice(2) + 
           (amount?.toString(16).padStart(64, '0') || '0'.repeat(64));
  } else {
    throw new Error(`Unknown function: ${functionName}`);
  }

  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [
        {
          to: BONDING_CURVE_V8,
          data
        },
        'latest'
      ]
    })
  });

  const result = await response.json();
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.result;
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

    // Initialize Supabase for additional data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get agent data from database
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, symbol, prototype_token_address, on_chain_supply, on_chain_reserve, graduation_phase, token_graduated')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        
        // For now, return calculated quote based on bonding curve math
        // In production, this would call the contract directly
        const supply = BigInt(agent.on_chain_supply || 0);
        const reserve = BigInt(agent.on_chain_reserve || 0);
        
        // Simplified bonding curve calculation
        // P = P0 + P1 * S^2, where P0 = 0.00001, P1 = 0.0000000001
        const P0 = parseEther('0.00001');
        const P1 = parseEther('0.0000000001');
        const currentPrice = P0 + (P1 * supply * supply) / parseEther('1');
        
        // Estimate tokens out (simplified)
        const fee = promptAmountIn * BigInt(5) / BigInt(1000); // 0.5% fee
        const netAmount = promptAmountIn - fee;
        const tokenAmountOut = netAmount * parseEther('1') / currentPrice;
        
        responseData = {
          action: 'quoteBuy',
          agentId,
          promptAmountIn: amount,
          tokenAmountOut: formatEther(tokenAmountOut),
          fee: formatEther(fee),
          priceAfter: formatEther(currentPrice),
          currentSupply: formatEther(supply),
          currentReserve: formatEther(reserve)
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
        const supply = BigInt(agent.on_chain_supply || 0);
        
        // Calculate PROMPT out based on bonding curve
        const P0 = parseEther('0.00001');
        const P1 = parseEther('0.0000000001');
        const currentPrice = P0 + (P1 * supply * supply) / parseEther('1');
        
        const grossPromptOut = tokenAmountIn * currentPrice / parseEther('1');
        const fee = grossPromptOut * BigInt(5) / BigInt(1000); // 0.5% fee
        const netPromptOut = grossPromptOut - fee;
        
        responseData = {
          action: 'quoteSell',
          agentId,
          tokenAmountIn: amount,
          promptAmountOut: formatEther(netPromptOut),
          fee: formatEther(fee),
          priceAfter: formatEther(currentPrice),
          currentSupply: formatEther(supply)
        };
        break;
      }

      case 'getState':
      default: {
        responseData = {
          action: 'getState',
          agentId,
          name: agent.name,
          symbol: agent.symbol,
          prototypeToken: agent.prototype_token_address,
          supply: agent.on_chain_supply?.toString() || '0',
          reserve: agent.on_chain_reserve?.toString() || '0',
          graduationPhase: agent.graduation_phase,
          graduated: agent.token_graduated || false,
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
