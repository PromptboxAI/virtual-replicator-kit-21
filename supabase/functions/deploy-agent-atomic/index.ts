import { createWalletClient, createPublicClient, http, parseEther } from 'npm:viem'
import { privateKeyToAccount } from 'npm:viem/accounts'
import { baseSepolia } from 'npm:viem/chains'
import { createClient } from 'npm:@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Agent Token Factory V2 ABI with atomic create+prebuy function
const AGENT_TOKEN_FACTORY_V2_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "string", "name": "agentId", "type": "string"},
      {"internalType": "uint256", "name": "prebuyPromptAmount", "type": "uint256"}
    ],
    "name": "createAgentTokenWithPrebuy",
    "outputs": [
      {"internalType": "address", "name": "tokenAddress", "type": "address"},
      {"internalType": "uint256", "name": "tokensReceived", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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
  }
] as const;

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Get the deployed Agent Token Factory V2 address
async function getFactoryV2Address(): Promise<string> {
  const { data: contracts, error } = await supabase
    .from('deployed_contracts')
    .select('contract_address')
    .eq('contract_type', 'factory_v2')
    .eq('is_active', true)
    .eq('network', 'base_sepolia')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !contracts || contracts.length === 0) {
    throw new Error('No AgentTokenFactoryV2 deployed. Please deploy the V2 factory first.');
  }

  return contracts[0].contract_address;
}

interface AtomicDeploymentRequest {
  agent_id: string;
  name: string;
  symbol: string;
  creator_address: string;
  prebuy_amount?: number; // Optional prebuy amount
}

interface AtomicDeploymentResult {
  success: boolean;
  error?: string;
  contract_address?: string;
  transaction_hash?: string;
  block_number?: number;
  gas_used?: string;
  tokens_received?: string;
  deployment_method: 'atomic_factory' | 'factory_only';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const body: AtomicDeploymentRequest = await req.json();
    console.log('Atomic deployment request:', body);

    // Validate required fields
    if (!body.agent_id || !body.name || !body.symbol || !body.creator_address) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: agent_id, name, symbol, creator_address' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    if (!deployerPrivateKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'DEPLOYER_PRIVATE_KEY not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get factory address
    const factoryAddress = await getFactoryV2Address();
    console.log('Using Factory V2:', factoryAddress);

    // Setup blockchain clients
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

    let hash: `0x${string}`;
    let deploymentMethod: 'atomic_factory' | 'factory_only';

    // Determine deployment method
    if (body.prebuy_amount && body.prebuy_amount > 0) {
      // Atomic create + prebuy
      console.log(`Deploying with atomic prebuy: ${body.prebuy_amount} PROMPT`);
      
      const prebuyAmount = parseEther(body.prebuy_amount.toString());
      
      hash = await walletClient.writeContract({
        address: factoryAddress as `0x${string}`,
        abi: AGENT_TOKEN_FACTORY_V2_ABI,
        functionName: 'createAgentTokenWithPrebuy',
        args: [body.name, body.symbol, body.agent_id, prebuyAmount],
        account
      });
      
      deploymentMethod = 'atomic_factory';
    } else {
      // Standard factory deployment
      console.log('Deploying without prebuy');
      
      hash = await walletClient.writeContract({
        address: factoryAddress as `0x${string}`,
        abi: AGENT_TOKEN_FACTORY_V2_ABI,
        functionName: 'createAgentToken',
        args: [body.name, body.symbol, body.agent_id],
        account
      });
      
      deploymentMethod = 'factory_only';
    }

    console.log('Atomic deployment transaction hash:', hash);

    // Wait for transaction confirmation with MEV protection
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      confirmations: 2, // Extra confirmation for MEV protection
      timeout: 120000 // 2 minute timeout
    });
    
    console.log('Transaction confirmed, block:', receipt.blockNumber);

    // Extract contract address from logs
    let contractAddress: string | null = null;
    let tokensReceived: string = '0';

    // Parse events to get the deployed contract address
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
        // This is an event from our factory
        if (log.topics.length >= 3) {
          // AgentTokenCreated or AgentTokenCreatedWithPrebuy event
          // The token address is typically the second indexed parameter
          contractAddress = `0x${log.topics[2]?.slice(26)}`; // Remove padding from address
          
          // For atomic deployment, extract tokens received from event data
          if (deploymentMethod === 'atomic_factory' && log.data) {
            try {
              // Decode the tokens received (last 32 bytes of event data)
              const dataHex = log.data.slice(2); // Remove 0x
              if (dataHex.length >= 64) {
                const tokensHex = dataHex.slice(-64); // Last 32 bytes
                tokensReceived = BigInt('0x' + tokensHex).toString();
              }
            } catch (e) {
              console.error('Error parsing tokens received:', e);
            }
          }
          break;
        }
      }
    }

    if (!contractAddress) {
      throw new Error('Could not extract contract address from transaction logs');
    }

    console.log('Deployed contract address:', contractAddress);
    console.log('Tokens received:', tokensReceived);

    // Update agent record in database with smart contract details
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        token_address: contractAddress,
        deployment_tx_hash: hash,
        deployment_method: deploymentMethod,
        deployment_verified: true,
        chain_id: baseSepolia.id,
        block_number: Number(receipt.blockNumber),
        updated_at: new Date().toISOString()
      })
      .eq('id', body.agent_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Don't fail the deployment, just log the error
    }

    // Create deployment audit record
    await supabase
      .from('deployed_contracts_audit')
      .insert({
        agent_id: body.agent_id,
        deployment_method: deploymentMethod,
        deployment_tx_hash: hash,
        deployer_address: account.address,
        token_address: contractAddress,
        token_address_checksum: contractAddress,
        token_name: body.name,
        token_symbol: body.symbol,
        chain_id: baseSepolia.id,
        block_number: Number(receipt.blockNumber),
        block_timestamp: new Date().toISOString(),
        gas_used: receipt.gasUsed.toString(),
        effective_gas_price: receipt.effectiveGasPrice?.toString() || '0',
        verification_status: 'verified'
      });

    const result: AtomicDeploymentResult = {
      success: true,
      contract_address: contractAddress,
      transaction_hash: hash,
      block_number: Number(receipt.blockNumber),
      gas_used: receipt.gasUsed.toString(),
      deployment_method,
      ...(deploymentMethod === 'atomic_factory' && { tokens_received: tokensReceived })
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Atomic deployment error:', error);
    
    const result: AtomicDeploymentResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error',
      deployment_method: 'atomic_factory'
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});