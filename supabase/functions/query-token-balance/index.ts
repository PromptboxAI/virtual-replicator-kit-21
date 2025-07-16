import { createPublicClient, http, formatUnits } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROMPT_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// This will be updated after the real token is deployed
const PROMPT_TOKEN_ADDRESS = "0x62fa50ce04dd11d2be35f1dee04063e63118c727" as `0x${string}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    
    if (!address) {
      throw new Error('Address parameter is required');
    }

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    console.log('Querying PROMPTTEST token balance for:', address);

    // Query the token balance
    const balance = await publicClient.readContract({
      address: PROMPT_TOKEN_ADDRESS,
      abi: PROMPT_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });

    // Convert from wei to readable format (18 decimals)
    const formattedBalance = formatUnits(balance, 18);
    
    console.log('Raw balance:', balance.toString());
    console.log('Formatted balance:', formattedBalance);

    return new Response(JSON.stringify({
      success: true,
      balance: formattedBalance,
      balanceWei: balance.toString(),
      address: address
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error querying token balance:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to query token balance',
      balance: '0'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});