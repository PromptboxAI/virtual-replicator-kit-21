import { createPublicClient, createWalletClient, http } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'
import { privateKeyToAccount } from 'npm:viem/accounts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple ERC20-like contract bytecode (much smaller for testing)
const SIMPLE_TOKEN_BYTECODE = "0x608060405234801561001057600080fd5b5060405161020f38038061020f8339818101604052810190610032919061007a565b80600081905550506100a7565b600080fd5b6000819050919050565b61005781610044565b811461006257600080fd5b50565b6000815190506100748161004e565b92915050565b6000602082840312156100905761008f61003f565b5b600061009e84828501610065565b91505092915050565b610159806100b66000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806318160ddd1461003b578063a9059cbb14610059575b600080fd5b610043610075565b60405161005091906100d0565b60405180910390f35b610073600480360381019061006e919061011c565b61007e565b005b60008054905090565b806000808282546100909190610185565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546100e59190610185565b925050819055505050565b6000819050919050565b6100f2816100ef565b82525050565b600060208201905061010d60008301846100e9565b92915050565b610116816100ef565b811461012157600080fd5b50565b6000813590506101338161010d565b92915050565b60008060408385031215610150576101...)"

const SIMPLE_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "_supply", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Simple contract deploy test started');
    
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    if (!deployerPrivateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY not found');
    }

    console.log('Creating account and clients...');
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

    console.log('Deploying from address:', account.address);
    console.log('Bytecode length:', SIMPLE_TOKEN_BYTECODE.length);

    // Deploy simple contract
    const hash = await walletClient.deployContract({
      abi: SIMPLE_TOKEN_ABI,
      bytecode: SIMPLE_TOKEN_BYTECODE as `0x${string}`,
      args: [1000000] // 1M token supply
    });

    console.log('Transaction hash:', hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Contract deployed at:', receipt.contractAddress);

    return new Response(
      JSON.stringify({ 
        success: true, 
        contractAddress: receipt.contractAddress,
        transactionHash: hash
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Simple deploy error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});