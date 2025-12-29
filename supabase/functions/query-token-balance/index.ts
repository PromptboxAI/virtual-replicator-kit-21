import { createPublicClient, http, formatUnits, isAddress } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'
import { createClient } from 'npm:@supabase/supabase-js'

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
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// V6 PROMPT Token on Base Sepolia - uses env var for testnet/mainnet flexibility
const DEFAULT_PROMPT_TOKEN_ADDRESS = '0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673';

async function getPromptTokenAddress(): Promise<string | null> {
  try {
    // First try to get from environment variable
    const envAddress = Deno.env.get('PROMPT_TOKEN_ADDRESS');
    if (envAddress && isAddress(envAddress)) {
      console.log('Using PROMPT_TOKEN_ADDRESS from environment:', envAddress);
      return envAddress;
    }

    // Fall back to hardcoded V6 address
    console.log('Using default V6 PROMPT token address:', DEFAULT_PROMPT_TOKEN_ADDRESS);
    return DEFAULT_PROMPT_TOKEN_ADDRESS;
  } catch (error) {
    console.warn('Could not fetch prompt token address:', error);
    return DEFAULT_PROMPT_TOKEN_ADDRESS;
  }
}

async function validateContract(address: string): Promise<boolean> {
  try {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    // Try to call a simple view function to validate the contract
    await publicClient.readContract({
      address: address as `0x${string}`,
      abi: PROMPT_TOKEN_ABI,
      functionName: 'name'
    });

    return true;
  } catch (error) {
    console.warn(`Contract validation failed for ${address}:`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { address, tokenAddress } = body;
    
    if (!address) {
      throw new Error('User address parameter is required');
    }

    if (!isAddress(address)) {
      throw new Error('Invalid user address format');
    }

    // Get the token address to query
    let promptTokenAddress = tokenAddress;
    
    if (!promptTokenAddress) {
      promptTokenAddress = await getPromptTokenAddress();
    }

    if (!promptTokenAddress) {
      throw new Error('No PROMPT token contract address found. Please deploy the token contract first.');
    }

    if (!isAddress(promptTokenAddress)) {
      throw new Error('Invalid token contract address format');
    }

    // Validate the contract exists and has the expected interface
    const isValidContract = await validateContract(promptTokenAddress);
    if (!isValidContract) {
      throw new Error(`Contract at ${promptTokenAddress} does not appear to be a valid ERC20 token`);
    }

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    console.log(`Querying token balance for user: ${address} on contract: ${promptTokenAddress}`);

    // Query the token balance
    const balance = await publicClient.readContract({
      address: promptTokenAddress as `0x${string}`,
      abi: PROMPT_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });

    // Convert from wei to readable format (18 decimals)
    const formattedBalance = formatUnits(balance, 18);
    
    console.log('Raw balance:', balance.toString());
    console.log('Formatted balance:', formattedBalance);

    // Get token info for additional context
    let tokenInfo = {};
    try {
      const [name, symbol] = await Promise.all([
        publicClient.readContract({
          address: promptTokenAddress as `0x${string}`,
          abi: PROMPT_TOKEN_ABI,
          functionName: 'name'
        }),
        publicClient.readContract({
          address: promptTokenAddress as `0x${string}`,
          abi: PROMPT_TOKEN_ABI,
          functionName: 'symbol'
        })
      ]);
      
      tokenInfo = { name, symbol };
    } catch (error) {
      console.warn('Could not fetch token info:', error);
    }

    return new Response(JSON.stringify({
      success: true,
      balance: formattedBalance,
      balanceWei: balance.toString(),
      userAddress: address,
      tokenAddress: promptTokenAddress,
      tokenInfo
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error querying token balance:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to query token balance',
      balance: '0',
      details: {
        stack: error.stack,
        name: error.name
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});