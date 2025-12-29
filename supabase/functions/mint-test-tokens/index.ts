import { createPublicClient, createWalletClient, http, parseUnits } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'
import { privateKeyToAccount } from 'npm:viem/accounts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROMPT_TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [],
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
    const { toAddress, amount } = await req.json();
    
    if (!toAddress || !amount) {
      throw new Error('Missing required parameters: toAddress and amount');
    }

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

    console.log('Minting tokens:', { toAddress, amount });
    console.log('From admin address:', account.address);

    // Convert amount to proper units (18 decimals)
    const amountInWei = parseUnits(amount.toString(), 18);

    // Call mint function on the token contract
    const hash = await walletClient.writeContract({
      address: PROMPT_TOKEN_ADDRESS,
      abi: PROMPT_TOKEN_ABI,
      functionName: 'mint',
      args: [toAddress as `0x${string}`, amountInWei]
    });

    console.log('Mint transaction hash:', hash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Mint transaction confirmed in block:', receipt.blockNumber);

    // Verify the new balance
    const newBalance = await publicClient.readContract({
      address: PROMPT_TOKEN_ADDRESS,
      abi: PROMPT_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [toAddress as `0x${string}`]
    });

    return new Response(JSON.stringify({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      newBalance: newBalance.toString(),
      message: `Successfully minted ${amount} PROMPTTEST tokens to ${toAddress}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error minting tokens:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to mint tokens',
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});