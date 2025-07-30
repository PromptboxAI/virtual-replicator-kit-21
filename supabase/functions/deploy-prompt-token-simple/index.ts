import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createPublicClient, createWalletClient, http } from 'https://esm.sh/viem@2.31.7';
import { privateKeyToAccount } from 'https://esm.sh/viem@2.31.7/accounts';
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains';
import { verifyDeployment } from '../_shared/verifyDeployment.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple ERC-20 Bytecode for PROMPT token
const PROMPT_TOKEN_BYTECODE = '0x608060405234801561001057600080fd5b50600436106100575760003560e01c806306fdde031461005c578063095ea7b31461007a57806318160ddd1461009a57806323b872dd146100bc578063313ce567146100dc57806370a08231146100f157806395d89b4114610121578063a9059cbb1461012957600080fd5b600080fd5b610064610149565b6040516100719190610678565b60405180910390f35b61008d6100883660046106e2565b6101db565b604051901515815260200161007c565b6100a26101f5565b60405190815260200161007c565b61008d6100ca36600461070c565b610204565b6100e4601281565b60405160ff909116815260200161007c565b6100a26100ff366004610748565b6001600160a01b031660009081526020819052604090205490565b610064610228565b61008d6101373660046106e2565b610237565b60606003805461015890610769565b80601f016020809104026020016040519081016040528092919081815260200182805461018490610769565b80156101d15780601f106101a6576101008083540402835291602001916101d1565b820191906000526020600020905b8154815290600101906020018083116101b457829003601f168201915b5050505050905090565b6000336101e9818585610245565b60019150505b92915050565b60006002545b905090565b600033610212858285610369565b61021d8585856103e3565b506001949350505050565b60606004805461015890610769565b6000336101e98185856103e3565b6001600160a01b0383166102a75760405162461bcd60e51b815260206004820152602460248201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b60648201526084015b60405180910390fd5b6001600160a01b0382166103085760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b606482015260840161029e565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b038381166000908152600160209081526040808320938616835292905220546000198114610417578181101561040a5760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000604482015260640161029e565b6104178484848403610245565b50505050565b6001600160a01b0383166104815760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b606482015260840161029e565b6001600160a01b0382166104e35760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f2061646472604482015262657373060ec1b606482015260840161029e565b6001600160a01b0383166000908152602081905260409020548181101561055b5760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b606482015260840161029e565b6001600160a01b03848116600081815260208181526040808320878703905593871680835291849020805487019055925185815290927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a3610417565b600060208083528351808285015260005b818110156105a5578581018301518582016040015282016105895b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b03811681146105dd57600080fd5b919050565b600080604083850312156105f557600080fd5b610600836105c6565b946020939093013593505050565b60008060006060848603121561062357600080fd5b61062c846105c6565b925061063a602085016105c6565b9150604084013590509250925092565b60006020828403121561065c57600080fd5b610665826105c6565b9392505050565b600181811c9082168061068057607f821691505b6020821081036106a057634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b808201808211156101ef576101ef6106a6565b818103818111156101ef576101ef6106a6565b634e487b7160e01b600052604160045260246000fd5b600082610718576107186106f1565b500490565b80820281158282048414176101ef576101ef6106a6565b8082018082111561074957610749610707565b9392505050565b60008261075f5761075f610742565b50069056fea264697066735822122064c8a9a85e5e8b32d4e6f8d7c2b1a0f9e8d7c6b5a4938271605e4d3c2b1a0f9864736f6c63430008140033';

const PROMPT_TOKEN_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol", 
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🪙 Starting simple PROMPT token deployment...');

    // Get deployer private key
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    if (!deployerPrivateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY not configured');
    }

    // Initialize clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    console.log('👤 Deployer account:', account.address);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clean up old PROMPT token deployments
    console.log('🧹 Cleaning up old PROMPT token deployments...');
    const { error: cleanupError } = await supabase
      .from('deployed_contracts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('contract_type', 'prompt_token')
      .eq('network', 'base_sepolia');

    if (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError.message);
    }

    // Estimate gas for deployment
    console.log('⛽ Estimating gas for PROMPT token deployment...');
    
    let estimatedGas: bigint;
    try {
      estimatedGas = await publicClient.estimateContractGas({
        abi: PROMPT_TOKEN_ABI,
        bytecode: PROMPT_TOKEN_BYTECODE as `0x${string}`,
        args: [],
        account: account.address,
      });
      console.log('📊 Estimated gas:', estimatedGas.toString());
    } catch (gasError) {
      console.warn('⚠️ Gas estimation failed, using default:', gasError);
      estimatedGas = BigInt(2000000); // Default fallback for ERC-20
    }

    // Add 20% buffer to prevent out-of-gas
    const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100);
    console.log('🛡️ Gas with 20% buffer:', gasWithBuffer.toString());

    // Deploy the PROMPT token contract
    console.log('🚀 Deploying PROMPT token contract...');
    
    const deployHash = await walletClient.deployContract({
      abi: PROMPT_TOKEN_ABI,
      bytecode: PROMPT_TOKEN_BYTECODE as `0x${string}`,
      args: [],
      gas: gasWithBuffer,
    });

    console.log('📝 Deployment transaction hash:', deployHash);

    // Wait for transaction confirmation
    console.log('⏳ Waiting for transaction confirmation...');
    
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: deployHash,
      timeout: 120000 // 2 minute timeout
    });

    if (receipt.status !== 'success') {
      throw new Error(`Transaction failed with status: ${receipt.status}`);
    }

    const contractAddress = receipt.contractAddress;
    if (!contractAddress) {
      throw new Error('No contract address in receipt');
    }

    console.log('🎉 PROMPT token deployed successfully at:', contractAddress);

    // 🔒 MANDATORY VERIFICATION: Ensure contract exists on-chain before proceeding
    console.log('🔍 Verifying PROMPT token deployment before database operations...');
    const verification = await verifyDeployment(contractAddress, publicClient, 'prompt_token');
    console.log('✅ Contract verification passed:', verification);

    // Test contract functions
    try {
      const name = await publicClient.readContract({
        address: contractAddress,
        abi: PROMPT_TOKEN_ABI,
        functionName: 'name'
      });
      
      const symbol = await publicClient.readContract({
        address: contractAddress,
        abi: PROMPT_TOKEN_ABI,
        functionName: 'symbol'
      });

      const totalSupply = await publicClient.readContract({
        address: contractAddress,
        abi: PROMPT_TOKEN_ABI,
        functionName: 'totalSupply'
      });

      console.log('✅ PROMPT token contract verification:', {
        name,
        symbol,
        totalSupply: totalSupply.toString()
      });

    } catch (verifyError) {
      console.error('❌ Contract state verification failed:', verifyError);
      throw new Error(`PROMPT token verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`);
    }

    // Store deployment in database
    console.log('💾 Storing PROMPT token deployment in database...');
    
    const { error: dbError } = await supabase
      .from('deployed_contracts')
      .insert({
        contract_type: 'prompt_token',
        contract_address: contractAddress.toLowerCase(),
        network: 'base_sepolia',
        version: 'v1_simple',
        transaction_hash: deployHash,
        is_active: true,
        deployment_timestamp: new Date().toISOString(),
        name: 'Prompt Token',
        symbol: 'PROMPT'
      });

    if (dbError) {
      console.error('❌ Database storage failed:', dbError);
      throw new Error(`Failed to store deployment: ${dbError.message}`);
    }

    console.log('✅ PROMPT token deployment stored successfully');

    return new Response(
      JSON.stringify({
        success: true,
        contractAddress: contractAddress,
        transactionHash: deployHash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber.toString(),
        verification: verification
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ PROMPT token deployment failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});