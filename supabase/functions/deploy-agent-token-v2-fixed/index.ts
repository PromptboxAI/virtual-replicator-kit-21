import { createWalletClient, createPublicClient, http, parseEther, defineChain, encodeFunctionData } from 'npm:viem'
import { privateKeyToAccount } from 'npm:viem/accounts'
import { baseSepolia } from 'npm:viem/chains'
import { createClient } from 'npm:@supabase/supabase-js'
import { verifyDeployment } from '../_shared/verifyDeployment.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Simple ERC-20 contract with fixed 18 decimals and 1M initial supply
const SIMPLE_ERC20_BYTECODE = "0x608060405234801561001057600080fd5b5060405161080e38038061080e83398101604052810190610030919061024a565b8160039081610040919061046c565b50806004908161005091906104f8565b506012600560006101000a81548160ff021916908360ff16021790555069d3c21bcecceda100000060008060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505050505050610604565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101088261009f565b810181811067ffffffffffffffff82111715610127576101266100d0565b5b80604052505050565b600061013a6100b6565b905061014682826100ff565b919050565b600067ffffffffffffffff821115610166576101656100d0565b5b61016f8261009f565b9050602081019050919050565b60005b8381101561019a57808201518184015260208101905061017f565b60008484015250505050565b60006101b96101b48461014b565b610130565b9050828152602081018484840111156101d5576101d461009a565b5b6101e084828561017c565b509392505050565b600082601f8301126101fd576101fc610095565b5b815161020d8482602086016101a6565b91505092915050565b60008060408385031215610233576102326100c0565b5b600083015167ffffffffffffffff811115610251576102506100c5565b5b61025d858286016101e8565b925050602083015167ffffffffffffffff81111561027e5761027d6100c5565b5b61028a858286016101e8565b9150509250929050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806102e657607f821691505b6020821081036102f9576102f8610f2f565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026103614fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610324565b61036b8683610324565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b60006103b26103ad6103a884610383565b61038d565b610383565b9050919050565b6000819050919050565b6103cc83610397565b6103e06103d8826103b9565b848454610331565b825550505050565b600090565b6103f56103e8565b6104008184846103c3565b505050565b5b818110156104245761041960008261ed565b60018101905061406565b5050565b601f82111561469576104a81610000565b61044d84610318565b8101602085101561045c578190505b61047061046885610318565b830182610405565b50505b505050565b600082821c905092915050565b600061049660001984600802610478565b1980831691505092915050565b60006104af8383610485565b9150826002028217905092915050565b6104c882610294565b67ffffffffffffffff8111156104e1576104e06100d0565b5b6104eb82546102ce565b6104f6828285610428565b600060209050601f83116001811461052957600084156105178782015190505b61052185826104a3565b865550610589565b601f19841661053786610300565b60005b8281101561055f5784890151825560018201915060208501945060208101905061053a565b8683101561057c5784890151610578601f891682610485565b8355505b6001600288020188555050505b505050505050565b60006020820190506105a66000830184610583565b92915050565b6000819050919050565b610203803803806105c683396000f3fe..."

const SIMPLE_ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "string", "name": "_symbol", "type": "string"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
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
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
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

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  deploymentMethod: 'direct';
}

async function deploySimpleERC20(
  name: string,
  symbol: string,
  agentId: string,
  creatorAddress: string
): Promise<DeploymentResult> {
  const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
  if (!deployerPrivateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured in Supabase secrets');
  }

  const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
  
  const rpcUrl = Deno.env.get('PRIMARY_RPC_URL') || 'https://sepolia.base.org';

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(rpcUrl)
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl)
  });

  console.log(`🔄 Deploying Simple ERC20: ${name} (${symbol}) for agent ${agentId}`);
  console.log(`Creator: ${creatorAddress}`);

  try {
    
    // Deploy the contract
    console.log('Deploying contract with bytecode length:', SIMPLE_ERC20_BYTECODE.length);
    
    const hash = await walletClient.deployContract({
      abi: SIMPLE_ERC20_ABI,
      bytecode: SIMPLE_ERC20_BYTECODE as `0x${string}`,
      args: [name, symbol],
      account
    });

    console.log('✅ Simple ERC20 deployment transaction hash:', hash);

    // Wait for transaction receipt with 2 confirmations
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      confirmations: 2,
      timeout: 120000
    });
    
    console.log('✅ Contract deployed, block:', receipt.blockNumber);
    console.log('✅ Contract address:', receipt.contractAddress);

    if (!receipt.contractAddress) {
      throw new Error('No contract address in receipt');
    }

    return {
      contractAddress: receipt.contractAddress,
      transactionHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed,
      deploymentMethod: 'direct'
    };

  } catch (error: any) {
    console.error('❌ Error in deploySimpleERC20:', error);
    throw new Error(`Simple ERC20 deployment failed: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, symbol, agentId, creatorAddress } = await req.json();
    
    console.log('V2 Deployment request:', { name, symbol, agentId, creatorAddress });

    // Validate required fields
    if (!name || !symbol || !agentId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: name, symbol, agentId' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if agent exists and get current state
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, token_address')
      .eq('id', agentId)
      .single();

    if (agentError) {
      console.error('Agent query error:', agentError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Agent not found: ${agentError.message}` 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Agent current token_address:', agent.token_address, '(will be updated)');

    // Deploy simple ERC20 token
    const deploymentResult = await deploySimpleERC20(
      name,
      symbol,
      agentId,
      creatorAddress || 'system'
    );

    console.log('🎉 Deployment successful:', deploymentResult);

    // Update agent with new token address
    const { error: updateError } = await supabase
      .from('agents')
      .update({ 
        token_address: deploymentResult.contractAddress,
        deployment_method: 'direct-fixed',
        deployment_tx_hash: deploymentResult.transactionHash,
        chain_id: 84532,
        block_number: deploymentResult.blockNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (updateError) {
      console.error('❌ Failed to update agent:', updateError);
      // Don't fail the deployment, just log the error
    } else {
      console.log('✅ Agent updated with token address');
    }

    // Store deployment record
    const { error: deploymentRecordError } = await supabase
      .from('deployed_contracts')
      .insert({
        contract_type: 'AGENT',
        contract_address: deploymentResult.contractAddress,
        transaction_hash: deploymentResult.transactionHash,
        network: 'base_sepolia',
        name,
        symbol: symbol.toUpperCase(),
        is_active: true,
        version: 'v2-fixed',
        agent_id: agentId
      });

    if (deploymentRecordError) {
      console.error('❌ Failed to store deployment record:', deploymentRecordError);
    } else {
      console.log('✅ Deployment record stored');
    }

    return new Response(
      JSON.stringify({
        success: true,
        contractAddress: deploymentResult.contractAddress,
        transactionHash: deploymentResult.transactionHash,
        blockNumber: deploymentResult.blockNumber,
        gasUsed: deploymentResult.gasUsed.toString(),
        deploymentMethod: deploymentResult.deploymentMethod,
        agentId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error deploying V2 Agent Token:', error);
    
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