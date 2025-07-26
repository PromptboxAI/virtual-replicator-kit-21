
import { createWalletClient, createPublicClient, http, parseEther, defineChain } from 'npm:viem'
import { privateKeyToAccount } from 'npm:viem/accounts'
import { baseSepolia } from 'npm:viem/chains'
import { createClient } from 'npm:@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Agent Token Factory ABI - for calling createAgentToken function
const AGENT_TOKEN_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "string", "name": "agentId", "type": "string"}
    ],
    "name": "createAgentToken",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllTokens",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Get the deployed PROMPT token address
async function getPromptTokenAddress(): Promise<string> {
  const { data: contracts, error } = await supabase
    .from('deployed_contracts')
    .select('contract_address')
    .eq('contract_type', 'prompt_token')
    .eq('is_active', true)
    .eq('network', 'base_sepolia')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !contracts || contracts.length === 0) {
    console.log('No deployed PROMPT token found, using fallback address');
    return '0x0000000000000000000000000000000000000000';
  }

  return contracts[0].contract_address;
}

// Get the deployed Agent Token Factory address
async function getFactoryAddress(): Promise<string> {
  const { data: contracts, error } = await supabase
    .from('deployed_contracts')
    .select('contract_address')
    .eq('contract_type', 'factory')
    .eq('is_active', true)
    .eq('network', 'base_sepolia')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !contracts || contracts.length === 0) {
    throw new Error('No AgentTokenFactory deployed. Please deploy the factory first.');
  }

  return contracts[0].contract_address;
}

interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
}

async function createAgentTokenViaFactory(
  name: string,
  symbol: string,
  agentId: string,
  factoryAddress: string,
  creatorAddress: string
): Promise<DeploymentResult> {
  const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
  if (!deployerPrivateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured in Supabase secrets');
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

  console.log(`Creating Agent Token via Factory: ${name} (${symbol}) for agent ${agentId}`);
  console.log(`Using Factory: ${factoryAddress}`);
  console.log(`Creator: ${creatorAddress}`);

  try {
    // Call createAgentToken on the factory
    const hash = await walletClient.writeContract({
      address: factoryAddress as `0x${string}`,
      abi: AGENT_TOKEN_FACTORY_ABI,
      functionName: 'createAgentToken',
      args: [name, symbol, agentId],
      account
    });

    console.log('Factory createAgentToken transaction hash:', hash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 60000 // 60 second timeout
    });
    
    console.log('Factory transaction confirmed, block:', receipt.blockNumber);

    // Get the created token address from the factory's getAllTokens function
    // This is more reliable than parsing event logs
    let tokenAddress: string | null = null;
    
    try {
      // Get all tokens from factory before the transaction
      const tokensBefore = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: AGENT_TOKEN_FACTORY_ABI,
        functionName: 'getAllTokens'
      }) as `0x${string}`[];
      
      // Get all tokens from factory after the transaction
      const tokensAfter = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: AGENT_TOKEN_FACTORY_ABI,
        functionName: 'getAllTokens'
      }) as `0x${string}`[];
      
      // Find the new token (should be the last one in the array)
      if (tokensAfter.length > tokensBefore.length) {
        tokenAddress = tokensAfter[tokensAfter.length - 1];
      }
    } catch (contractError) {
      console.error('Failed to get token address from factory contract:', contractError);
      
      // Fallback: try to parse event logs
      for (const log of receipt.logs) {
        try {
          if (log.topics.length >= 3) {
            // Second topic should be the indexed tokenAddress
            const extractedAddress = `0x${log.topics[2]?.slice(26)}`;
            if (extractedAddress && extractedAddress !== '0x0000000000000000000000000000000000000000') {
              tokenAddress = extractedAddress;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
    }

    if (!tokenAddress) {
      throw new Error('Could not determine token address from factory transaction');
    }

    console.log('Agent Token created at:', tokenAddress);

    return {
      contractAddress: tokenAddress,
      transactionHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed || BigInt(0)
    };
  } catch (deployError) {
    console.error('Factory token creation failed:', deployError);
    throw new Error(`Factory token creation failed: ${deployError.message}`);
  }
}

async function recordDeployment(
  agentId: string,
  contractAddress: string,
  transactionHash: string,
  name: string,
  symbol: string,
  version: string = 'v2'
): Promise<void> {
  try {
    // Update agent record with new token address and mark as deployed
    const { error: agentError } = await supabase
      .from('agents')
      .update({ 
        token_address: contractAddress,
        updated_at: new Date().toISOString(),
        status: 'ACTIVE'
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

    console.log('Deployment recorded successfully');
  } catch (error) {
    console.error('Error in recordDeployment:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, symbol, agentId, creatorAddress } = await req.json();

    console.log('V2 Deployment request:', { name, symbol, agentId, creatorAddress });

    if (!name || !symbol || !agentId) {
      throw new Error('Missing required parameters: name, symbol, agentId');
    }

    // Get the factory address - this is required
    const factoryAddress = await getFactoryAddress();
    
    // Use a default creator address if not provided
    const finalCreatorAddress = creatorAddress || '0x23d03610584B0f0988A6F9C281a37094D5611388';

    console.log('Creating Agent Token via Factory with parameters:', {
      name,
      symbol,
      agentId,
      factoryAddress,
      creatorAddress: finalCreatorAddress
    });

    // Create the token via factory and get deployment details
    const deploymentResult = await createAgentTokenViaFactory(
      name,
      symbol,
      agentId,
      factoryAddress,
      finalCreatorAddress
    );

    // Record the deployment
    await recordDeployment(agentId, deploymentResult.contractAddress, deploymentResult.transactionHash, name, symbol, 'v2');

    console.log('V2 Agent Token deployment completed successfully');

    return new Response(JSON.stringify({
      success: true,
      contractAddress: deploymentResult.contractAddress,
      transactionHash: deploymentResult.transactionHash,
      blockNumber: deploymentResult.blockNumber,
      gasUsed: deploymentResult.gasUsed,
      agentId,
      version: 'v2',
      factoryAddress,
      features: [
        'factory_deployment',
        'automatic_fee_collection',
        'bonding_curve_trading',
        'graduation_mechanism'
      ],
      name,
      symbol,
      network: 'base_sepolia',
      explorerUrl: `https://sepolia.basescan.org/address/${deploymentResult.contractAddress}`
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
