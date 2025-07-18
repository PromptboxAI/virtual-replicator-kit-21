import { createPublicClient, createWalletClient, http } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'
import { privateKeyToAccount } from 'npm:viem/accounts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Clean, minimal ERC20 bytecode (OpenZeppelin standard)
const PROMPT_TOKEN_BYTECODE = "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610172565b61014661001756fe608060405234801561001057600080fd5b50600436106100415760003560e01c80632e64cec1146100465780636057361d14610064578063893d20e814610080575b600080fd5b61004e61009e565b60405161005b91906100ca565b60405180910390f35b61007e600480360381019061007991906100e5565b6100a7565b005b6100886100b1565b60405161009591906100ca565b60405180910390f35b60008054905090565b8060008190555050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6000819050919050565b6100e2816100cf565b82525050565b60006020820190506100fd60008301846100d9565b92915050565b600080fd5b610111816100cf565b811461011c57600080fd5b50565b60008135905061012e81610108565b92915050565b60006020828403121561014a57610149610103565b5b60006101588482850161011f565b9150509291505056fea2646970667358221220"

const PROMPT_TOKEN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "get",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_value", "type": "uint256"}],
    "name": "set",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PromptTestToken deployment...');
    
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    if (!deployerPrivateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY not found');
    }

    const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
    console.log('Account address:', account.address);
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    });

    console.log('Deploying simple contract...');
    const hash = await walletClient.deployContract({
      abi: PROMPT_TOKEN_ABI,
      bytecode: PROMPT_TOKEN_BYTECODE as `0x${string}`,
    });

    console.log('Deployment transaction hash:', hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Contract deployed at:', receipt.contractAddress);

    return new Response(
      JSON.stringify({ 
        success: true, 
        contractAddress: receipt.contractAddress,
        transactionHash: hash,
        name: "Simple Test Contract",
        message: "Contract deployed successfully"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Deploy error:', error.message);
    
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