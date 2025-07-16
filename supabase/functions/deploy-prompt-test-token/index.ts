import { createPublicClient, createWalletClient, http } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'
import { privateKeyToAccount } from 'npm:viem/accounts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PromptTestToken contract (simplified ERC20 with faucet functionality)
const PROMPT_TOKEN_BYTECODE = "0x60806040523480156200001157600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506040518060400160405280601181526020017f50726f6d7074205465737420546f6b656e0000000000000000000000000000008152506040518060400160405280600a81526020017f50524f4d5054544553540000000000000000000000000000000000000000000081525081600390805190602001906200019a929190620002c7565b508060049080519060200190620001b3929190620002c7565b5050506200020a336b033b2e3c9fd0803ce8000000620002136000000000000000000000000000000000000000000000000000000000000000000000000000000000020062000249565b505062000451565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156200028e576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620002859062000390565b60405180910390fd5b8060026000828254620002a29190620003e1565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055505050565b828054620002d59062000432565b90600052602060002090601f016020900481019282620002f9576000855562000345565b82601f106200031457805160ff191683800117855562000345565b8280016001018555821562000345579182015b828111156200034457825182559160200191906001019062000327565b5b50905062000354919062000358565b5090565b5b808211156200037357600081600090555060010162000359565b5090565b60006200038662001892620003b2565b9050919050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b6000620003c5601f83620003cc565b9150620003d282620003dd565b602082019050919050565b600082825260208201905092915050565b6000620003fb8262000402565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006200042f826200043e565b9050919050565b600060028204905060018216806200044b57607f821691505b602082108114156200046257620004616200047e565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b61139c80620004616000396000f3fe"

const PROMPT_TOKEN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
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
  },
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Deploying PromptTestToken...');
    
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

    console.log('Deploying PromptTestToken from address:', account.address);

    // Deploy the actual PromptTestToken contract
    const hash = await walletClient.deployContract({
      abi: PROMPT_TOKEN_ABI,
      bytecode: PROMPT_TOKEN_BYTECODE as `0x${string}`,
    });

    console.log('Transaction hash:', hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Contract deployed at:', receipt.contractAddress);

    return new Response(
      JSON.stringify({ 
        success: true, 
        contractAddress: receipt.contractAddress,
        transactionHash: hash,
        name: "Prompt Test Token",
        symbol: "PROMPTTEST",
        message: "PromptTestToken deployed successfully"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('PROMPTTEST deploy error:', error);
    
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