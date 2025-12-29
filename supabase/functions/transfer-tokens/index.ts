import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'
import { privateKeyToAccount } from 'npm:viem/accounts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client for revenue tracking
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const PROMPT_TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// V6 PROMPT Token on Base Sepolia - uses env var for testnet/mainnet flexibility
const PROMPT_TOKEN_ADDRESS = (Deno.env.get('PROMPT_TOKEN_ADDRESS') || '0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673') as `0x${string}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fromAddress, toAddress, amount, agentId, isAgentCreation } = await req.json();
    
    if (!fromAddress || !toAddress || !amount) {
      throw new Error('Missing required parameters: fromAddress, toAddress, and amount');
    }

    // NOTE: In production, this would require user wallet signature
    // For now, we'll use admin key for testing purposes
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    if (!deployerPrivateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY not found');
    }

    const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    });

    console.log('Transferring tokens:', { fromAddress, toAddress, amount });

    // Check sender balance first
    const senderBalance = await publicClient.readContract({
      address: PROMPT_TOKEN_ADDRESS,
      abi: PROMPT_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [fromAddress as `0x${string}`]
    });

    const amountInWei = parseUnits(amount.toString(), 18);
    
    if (senderBalance < amountInWei) {
      throw new Error(`Insufficient balance. Has ${formatUnits(senderBalance, 18)}, needs ${amount}`);
    }

    // NOTE: This is a simplified implementation for testing
    // In production, the user's wallet would sign this transaction
    const hash = await walletClient.writeContract({
      address: PROMPT_TOKEN_ADDRESS,
      abi: PROMPT_TOKEN_ABI,
      functionName: 'transfer',
      args: [toAddress as `0x${string}`, amountInWei]
    });

    console.log('Transfer transaction hash:', hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Transfer confirmed in block:', receipt.blockNumber);

    // Track revenue if this is an agent creation payment
    if (isAgentCreation && agentId) {
      try {
        await supabase.from('platform_revenue').insert({
          revenue_type: 'agent_creation',
          amount: parseFloat(amount),
          agent_id: agentId,
          transaction_hash: hash,
          network: 'testnet'
        });
        console.log('Revenue tracked for agent creation:', agentId);
      } catch (revenueError) {
        console.error('Failed to track revenue:', revenueError);
        // Don't fail the main transaction for revenue tracking errors
      }
    }

    return new Response(JSON.stringify({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      message: `Successfully transferred ${amount} PROMPTTEST tokens`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error transferring tokens:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to transfer tokens'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});