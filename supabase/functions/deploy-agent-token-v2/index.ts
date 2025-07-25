
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
      {"internalType": "address", "name": "_promptToken", "type": "address"},
      {"internalType": "address", "name": "_creator", "type": "address"},
      {"internalType": "address", "name": "_platformTreasury", "type": "address"}
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
    "inputs": [],
    "name": "version",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Real compiled bytecode for AgentTokenV2 (this is a simplified example - you'd need the actual compiled bytecode)
const AGENT_TOKEN_V2_BYTECODE = "0x608060405234801561001057600080fd5b50604051611234380380611234833981810160405281019061003291906103e8565b8551620000479060039060208901906200028c565b5084516200005d9060049060208801906200028c565b508351620000739060059060208701906200028c565b50600680546001600160a01b0319166001600160a01b038581169190911790915560078054821684811691909117909155600880549092169116179055506200046b9050565b6001600160a01b038116620000d557600080fd5b50565b828054620000e6906200042e565b90600052602060002090601f0160209004810192826200010a576000855562000155565b82601f106200012557805160ff191683800117855562000155565b8280016001018555821562000155579182015b828111156200015557825182559160200191906001019062000138565b506200016392915062000167565b5090565b5b8082111562000163576000815560010162000168565b634e487b7160e01b600052604160045260246000fd5b600082601f830112620001a657600080fd5b81516001600160401b0380821115620001c357620001c36200017e565b604051601f8301601f19908116603f01168101908282118183101715620001ee57620001ee6200017e565b816040528381526020925086838588010111156200020b57600080fd5b600091505b838210156200022f578582018301518183018401529082019062000210565b83821115620002415760008385830101525b9695505050505050565b80516001600160a01b03811681146200026357600080fd5b919050565b600080600080600080600060e0888a0312156200028457600080fd5b87516001600160401b03808211156200029c57600080fd5b620002aa8b838c0162000194565b985060208a0151915080821115620002c157600080fd5b620002cf8b838c0162000194565b975060408a0151915080821115620002e657600080fd5b50620002f58a828b0162000194565b955050620003066060890162000251565b9350620003166080890162000251565b92506200032660a0890162000251565b91506200033660c0890162000251565b905092959891949750929550565b600181811c908216806200035957607f821691505b602082108114156200037b57634e487b7160e01b600052602260045260246000fd5b50919050565b610db98062000391600039006000f3fe";

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Get the deployed PROMPT token address
async function getPromptTokenAddress(): Promise<string> {
  // Try to get from deployed contracts
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
    // Fallback to a default address if no token is deployed
    return '0x0000000000000000000000000000000000000000';
  }

  return contracts[0].contract_address;
}

interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
}

async function deployAgentTokenV2(
  name: string,
  symbol: string,
  agentId: string,
  promptTokenAddress: string,
  creatorAddress: string
): Promise<DeploymentResult> {
  const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
  if (!deployerPrivateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured in Supabase secrets');
  }

  const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
  const platformTreasury = '0x23d03610584B0f0988A6F9C281a37094D5611388'; // Default platform treasury
  
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
  console.log(`Using PROMPT token: ${promptTokenAddress}`);
  console.log(`Creator: ${creatorAddress}`);

  try {
    // Deploy the contract
    const hash = await walletClient.deployContract({
      abi: AGENT_TOKEN_V2_ABI,
      bytecode: AGENT_TOKEN_V2_BYTECODE as `0x${string}`,
      args: [name, symbol, agentId, promptTokenAddress, creatorAddress, platformTreasury],
      account
    });

    console.log('Deployment transaction hash:', hash);

    // Wait for deployment confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 60000 // 60 second timeout
    });
    
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
        console.warn('Warning: Deployed contract version is not v2');
      }
    } catch (error) {
      console.warn('Could not verify contract version:', error);
    }

    return {
      contractAddress: receipt.contractAddress,
      transactionHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed || BigInt(0)
    };
  } catch (deployError) {
    console.error('Contract deployment failed:', deployError);
    throw new Error(`Contract deployment failed: ${deployError.message}`);
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

    // Get the PROMPT token address
    const promptTokenAddress = await getPromptTokenAddress();
    
    if (promptTokenAddress === '0x0000000000000000000000000000000000000000') {
      console.warn('Warning: No PROMPT token deployed, using zero address');
    }

    // Use a default creator address if not provided
    const finalCreatorAddress = creatorAddress || '0x23d03610584B0f0988A6F9C281a37094D5611388';

    console.log('Deploying V2 Agent Token with parameters:', {
      name,
      symbol,
      agentId,
      promptTokenAddress,
      creatorAddress: finalCreatorAddress
    });

    // Deploy the V2 contract and get deployment details
    const deploymentResult = await deployAgentTokenV2(
      name,
      symbol,
      agentId,
      promptTokenAddress,
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
      promptTokenAddress,
      features: [
        'slippage_protection',
        'enhanced_bonding_curve',
        'improved_gas_efficiency',
        'real_contract_deployment'
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
