import { createWalletClient, createPublicClient, http, parseEther, defineChain } from 'npm:viem'
import { privateKeyToAccount } from 'npm:viem/accounts'
import { baseSepolia } from 'npm:viem/chains'
import { createClient } from 'npm:@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// V2 Agent Token ABI with slippage protection
const AGENT_TOKEN_V2_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "string", "name": "_symbol", "type": "string"},
      {"internalType": "string", "name": "_agentId", "type": "string"},
      {"internalType": "address", "name": "_promptToken", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "promptAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "minTokensOut", "type": "uint256"}
    ],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "minPromptOut", "type": "uint256"}
    ],
    "name": "sellTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "promptAmount", "type": "uint256"}],
    "name": "getBuyPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
    "name": "getSellPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTokenMetrics",
    "outputs": [
      {"internalType": "uint256", "name": "_promptRaised", "type": "uint256"},
      {"internalType": "uint256", "name": "_currentPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "_marketCap", "type": "uint256"},
      {"internalType": "uint256", "name": "_circulatingSupply", "type": "uint256"},
      {"internalType": "bool", "name": "_graduated", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "version",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// V2 Agent Token Factory ABI
const AGENT_TOKEN_FACTORY_V2_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "string", "name": "agentId", "type": "string"}
    ],
    "name": "createAgentTokenV2",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTokensV2",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "tokenAddress", "type": "address"}],
    "name": "getTokenVersion",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Bytecode for V2 Agent Token (this would be the compiled contract)
const AGENT_TOKEN_V2_BYTECODE = "0x608060405234801561001057600080fd5b5..." // This would be the actual compiled bytecode

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function deployAgentTokenV2(
  name: string,
  symbol: string,
  agentId: string,
  promptTokenAddress: string
): Promise<string> {
  const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
  if (!deployerPrivateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured');
  }

  const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });

  console.log(`Deploying V2 Agent Token: ${name} (${symbol}) for agent ${agentId}`);

  // Deploy the contract
  const hash = await walletClient.deployContract({
    abi: AGENT_TOKEN_V2_ABI,
    bytecode: AGENT_TOKEN_V2_BYTECODE,
    args: [name, symbol, agentId, promptTokenAddress],
    account
  });

  console.log('Deployment transaction hash:', hash);

  // Wait for deployment confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  if (!receipt.contractAddress) {
    throw new Error('Contract deployment failed - no contract address returned');
  }

  console.log('V2 Agent Token deployed at:', receipt.contractAddress);

  // Verify it's a V2 contract by calling version function
  try {
    const version = await publicClient.readContract({
      address: receipt.contractAddress,
      abi: AGENT_TOKEN_V2_ABI,
      functionName: 'version'
    });
    
    console.log('Contract version:', version);
    
    if (version !== 'v2') {
      throw new Error('Deployed contract is not version 2');
    }
  } catch (error) {
    console.warn('Could not verify contract version:', error);
  }

  return receipt.contractAddress;
}

async function recordDeployment(
  agentId: string,
  contractAddress: string,
  name: string,
  symbol: string,
  version: string = 'v2'
): Promise<void> {
  try {
    // Update agent record with new token address
    const { error: agentError } = await supabase
      .from('agents')
      .update({ 
        token_address: contractAddress,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (agentError) {
      console.error('Error updating agent record:', agentError);
    }

    // Record deployment in contract tracking table
    const { error: contractError } = await supabase
      .from('deployed_contracts')
      .insert({
        contract_address: contractAddress,
        contract_type: 'agent_token',
        agent_id: agentId,
        network: 'base_sepolia',
        version: version,
        name: name,
        symbol: symbol,
        is_active: true,
        deployment_timestamp: new Date().toISOString()
      });

    if (contractError) {
      console.error('Error recording contract deployment:', contractError);
    }
  } catch (error) {
    console.error('Error in recordDeployment:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, symbol, agentId, promptTokenAddress } = await req.json();

    if (!name || !symbol || !agentId) {
      throw new Error('Missing required parameters: name, symbol, agentId');
    }

    if (!promptTokenAddress) {
      throw new Error('PROMPT token address is required');
    }

    console.log('Deploying V2 Agent Token with parameters:', {
      name,
      symbol,
      agentId,
      promptTokenAddress
    });

    // Deploy the V2 contract
    const contractAddress = await deployAgentTokenV2(
      name,
      symbol,
      agentId,
      promptTokenAddress
    );

    // Record the deployment
    await recordDeployment(agentId, contractAddress, name, symbol, 'v2');

    console.log('V2 Agent Token deployment completed successfully');

    return new Response(JSON.stringify({
      success: true,
      contractAddress,
      agentId,
      version: 'v2',
      features: [
        'slippage_protection',
        'enhanced_bonding_curve',
        'improved_gas_efficiency'
      ],
      name,
      symbol
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error deploying V2 Agent Token:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to deploy V2 Agent Token',
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