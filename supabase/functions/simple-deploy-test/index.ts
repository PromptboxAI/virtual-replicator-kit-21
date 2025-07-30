import { createPublicClient, createWalletClient, http } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'
import { privateKeyToAccount } from 'npm:viem/accounts'
import { verifyDeployment } from '../_shared/verifyDeployment.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Clean, valid simple storage contract bytecode
const SIMPLE_CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b506040516101e93803806101e98339818101604052810190610032919061007a565b8060008190555050610092565b600080fd5b6000819050919050565b61005781610044565b811461006257600080fd5b50565b6000815190506100748161004e565b92915050565b6000602082840312156100905761008f61003f565b5b600061009e84828501610065565b91505092915050565b610148806100b66000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80632e64cec1146100465780636057361d14610064578063a87430ba14610080575b600080fd5b61004e61009c565b60405161005b9190610104565b60405180910390f35b61007e600480360381019061007991906100a0565b6100a5565b005b6100986004803603810190610093919061010c565b6100af565b005b60008054905090565b8060008190555050565b806000819055503373ffffffffffffffffffffffffffffffffffffffff167fb922f092a64f1a076de6f21e4d7c6400b6e55791cc935e7bb8e7e90f7652f15b826040516100fe9190610104565b60405180910390a250565b6000819050919050565b61011c8161010c565b82525050565b60006020820190506101376000830184610113565b92915050565b600080fd5b61014b8161010c565b811461015657600080fd5b50565b60008135905061016881610142565b92915050565b600060208284031215610184576101836b013d565b5b600061019284828501610159565b9150509291505056fea26469706673582212205a9e5b5e8c9f8d7a5b9e6c3f2e8d5a4b9c7e6f1a3d8c5e7b2a9f8e6c4d3b5a964736f6c63430008110033"

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

    // ✅ CRITICAL: Verify contract deployment before returning success
    if (!receipt.contractAddress) {
      throw new Error('Contract deployment failed - no address returned');
    }
    await verifyDeployment(receipt.contractAddress, publicClient, 'SIMPLE_CONTRACT');

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