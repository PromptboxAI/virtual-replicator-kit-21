import { createPublicClient, createWalletClient, http } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'
import { privateKeyToAccount } from 'npm:viem/accounts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Complete simple storage contract bytecode - this stores and retrieves a number
const SIMPLE_CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b506040516101113803806101118339818101604052810190610032919061007a565b80600081905550506100a7565b600080fd5b6000819050919050565b61005781610044565b811461006257600080fd5b50565b6000815190506100748161004e565b92915050565b6000602082840312156100905761008f61003f565b5b600061009e84828501610065565b91505092915050565b605c806100b66000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100a0565b60405180910390f35b610073600480360381019061006e91906100ec565b61007e565b005b60008054905090565b8060008190555050565b6000819050919050565b61009a81610087565b82525050565b60006020820190506100b56000830184610091565b92915050565b600080fd5b6100c981610087565b81146100d457600080fd5b50565b6000813590506100e6816100c0565b92915050565b600060208284031215610102576101016100bb565b5b6000610110848285016100d7565b9150509291505056fea2646970667358221220c8de24bb0000000000000000000000000000000000000000000000000000000064736f6c63430008110033"

const SIMPLE_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "_initialValue", "type": "uint256"}],
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
    console.log('Bytecode length:', SIMPLE_CONTRACT_BYTECODE.length);

    // Deploy simple contract with initial value 42
    const hash = await walletClient.deployContract({
      abi: SIMPLE_CONTRACT_ABI,
      bytecode: SIMPLE_CONTRACT_BYTECODE as `0x${string}`,
      args: [42] // initial value
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