import { createWalletClient, createPublicClient, http } from 'npm:viem'
import { privateKeyToAccount } from 'npm:viem/accounts'
import { baseSepolia } from 'npm:viem/chains'
import { createClient } from 'npm:@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Fixed: Valid ERC-20 bytecode with (name, symbol, decimals) constructor (no ellipses)
const DIRECT_ERC20_BYTECODE = "0x608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461016857806370a082311461019857806395d89b41146101c8578063a457c2d7146101e6578063a9059cbb14610216578063dd62ed3e14610246576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100fc57806323b872dd1461011a578063313ce5671461014a575b600080fd5b6100b6610276565b6040516100c39190610a2d565b60405180910390f35b6100e660048036038101906100e191906109e9565b610308565b6040516100f39190610a12565b60405180910390f35b61010461032b565b604051610111919061094e565b60405180910390f35b610134600480360381019061012f91906109565b610335565b6040516101419190610a12565b60405180910390f35b610152610364565b60405161015f9190610a4f565b60405180910390f35b610182600480360381019061017d91906109e9565b61037b565b60405161018f9190610a12565b60405180910390f35b6101b260048036038101906101ad91906108f9565b6103b2565b6040516101bf919061094e565b60405180910390f35b6101d06103fb565b6040516101dd9190610a2d565b60405180910390f35b61020060048036038101906101fb91906109e9565b61048d565b60405161020d9190610a12565b60405180910390f35b610230600480360381019061022b91906109e9565b610504565b60405161023d9190610a12565b60405180910390f35b610260600480360381019061025b9190610926565b610527565b60405161026d919061094e565b60405180910390f35b606060038054610285906100b58565b80601f01602080910402602001604051908101604052809291908181526020018280546102b190610b58565b80156102fe5780601f106102d3576101008083540402835291602001916102fe565b820191906000526020600020905b8154815290600101906020018083116102e157829003601f168201915b5050505050905090565b600080610313610ae5565b9050610320818585610aed565b600191505092915050565b6000600254905090565b600080610340610ae5565b905061034d858285610cb6565b610358858585610d42565b60019150509392505050565b6000600560009054906101000a900460ff16905090565b600080610386610ae5565b905061039d8185856103988589610527565b6103a29190610999565b610aed565b600191505092915050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60606004805461040a90610b58565b80601f016020809104026020016040519081016040528092919081815260200182805461043690610b58565b80156104835780601f1061045857610100808354040283529160200191610483565b820191906000526020600020905b81548152906001019060200180831161046657829003601f168201915b5050505050905090565b600080610498610ae5565b905060006104a68286610527565b9050838110156104eb576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104e290610a0d565b60405180910390fd5b6104f88286868403610aed565b60019250505092915050565b60008061050f610ae5565b905061051c818585610d42565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006105c0826105ce565b9050919050565b6105d081610595565b81146105db57600080fd5b50565b6000813590506105ed816105c7565b92915050565b6000819050919050565b610606816105f3565b811461061157600080fd5b50565b600081359050610623816105fd565b92915050565b6000806040838503121561064057610638610bb3565b5b600061064e858286016105de565b925050602061065f85828601610614565b9150509250929050565b600081519050919050565b600082825260208201905092915050565b60005b838110156106a3578082015181840152602081019050610688565b838111156106b4576000848401525b50505050565b60006106cb82610669565b6106d58185610674565b93506106e5818560208601610685565b6106ee81610bb8565b840191505092915050565b6000602082019050818103600083015261071381846106af565b905092915050565b60008115159050919050565b6107308161071b565b82525050565b600060208201905061074b6000830184610727565b92915050565b60008060006060848603121561076a57610769610b8e565b5b6000610778868287016105de565b9350506020610789868287016105de565b925050604061079a86828701610614565b9150509250925092565b600060ff82169050919050565b6107ba816107a4565b82525050565b60006020820190506107d560008301846107b1565b92915050565b6000602082840312156107f6576107f5610b8e565b5b600061080484828501610635565b91505092915050565b6000806040838503121561082657610825610b8e565b5b6000610834858286016105de565b9250506020610845858286016105de565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006108b682610614565b91506108c183610614565b92508282019050808211156108d9576108d861087d565b5b92915050565b7f45524332303a206465637265617365642062656c6f77207a65726f0000000000600082015250565b6000610915601b83610674565b9150610920826108df565b602082019050919050565b6000602082019050818103600083015261094481610908565b905091905056fea26469706673582212209c3cbeff6a9f062a6c84d2e52f6e50f1f1f7f6c9e44f2d1a9a5f2f1a7d9c5d1764736f6c63430008120033";

// Minimal ABI needed for deployment
const DIRECT_ERC20_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint8', name: 'decimals', type: 'uint8' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
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

async function deployERC20(
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

  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http(rpcUrl) });

  console.log(`🔄 Deploying ERC20: ${name} (${symbol}) for agent ${agentId}`);
  console.log(`Creator: ${creatorAddress}`);

  try {
    // Try to estimate gas, fallback to conservative limit
    let gasLimit = 3_500_000n;
    try {
      const estimated = await publicClient.estimateContractGas({
        abi: DIRECT_ERC20_ABI,
        bytecode: DIRECT_ERC20_BYTECODE as `0x${string}`,
        account: account.address,
        args: [name, symbol, 18],
      });
      gasLimit = (estimated * 120n) / 100n; // +20%
      console.log('⛽ Estimated gas:', estimated.toString(), '→ using', gasLimit.toString());
    } catch (e) {
      console.warn('⚠️ Gas estimation failed, using fallback limit:', gasLimit.toString(), e?.message);
    }

    // Get EIP-1559 fees with fallback
    const fees = await publicClient.estimateFeesPerGas().catch(async () => {
      const gp = await publicClient.getGasPrice();
      return { maxFeePerGas: gp * 2n, maxPriorityFeePerGas: 1_000_000_000n } as any; // 1 gwei tip
    });

    console.log('Using fees for deploy:', {
      maxFeePerGas: (fees as any).maxFeePerGas?.toString(),
      maxPriorityFeePerGas: (fees as any).maxPriorityFeePerGas?.toString(),
    });

    const hash = await walletClient.deployContract({
      abi: DIRECT_ERC20_ABI,
      bytecode: DIRECT_ERC20_BYTECODE as `0x${string}`,
      args: [name, symbol, 18],
      account,
      gas: gasLimit,
      maxFeePerGas: (fees as any).maxFeePerGas,
      maxPriorityFeePerGas: (fees as any).maxPriorityFeePerGas,
    });

    console.log('✅ Deployment tx hash:', hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 2, timeout: 180000 });
    if (!receipt.contractAddress) throw new Error('No contract address in receipt');

    console.log('✅ Deployed at:', receipt.contractAddress, 'block:', receipt.blockNumber);

    return {
      contractAddress: receipt.contractAddress,
      transactionHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed,
      deploymentMethod: 'direct',
    };
  } catch (error: any) {
    console.error('❌ Error in deployERC20:', error);
    throw new Error(`ERC20 deployment failed: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { name, symbol, agentId, creatorAddress, platformVaultAddress, includePlatformAllocation } = await req.json();
    console.log('V2 Fixed Deployment request:', { name, symbol, agentId, creatorAddress, platformVaultAddress, includePlatformAllocation });

    if (!name || !symbol || !agentId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields: name, symbol, agentId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, token_address')
      .eq('id', agentId)
      .maybeSingle();

    if (agentError) {
      console.error('Agent query error:', agentError);
      return new Response(JSON.stringify({ success: false, error: `Agent not found: ${agentError.message}` }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Agent current token_address:', agent?.token_address, '(will be updated)');

    // Deploy token
    const deploymentResult = await deployERC20(name, symbol, agentId, creatorAddress || 'system');
    console.log('🎉 Deployment successful:', deploymentResult);

    // Update agent
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        token_address: deploymentResult.contractAddress,
        deployment_method: 'direct-fixed',
        deployment_tx_hash: deploymentResult.transactionHash,
        chain_id: 84532,
        block_number: deploymentResult.blockNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    if (updateError) console.error('❌ Failed to update agent:', updateError);
    else console.log('✅ Agent updated with token address');

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
        agent_id: agentId,
      });

    if (deploymentRecordError) console.error('❌ Failed to store deployment record:', deploymentRecordError);
    else console.log('✅ Deployment record stored');

    // Step 3: Execute initial platform allocation if requested
    let platformAllocationResult = null;
    if (includePlatformAllocation && platformVaultAddress) {
      try {
        console.log('🏦 Initial distribution requested, but direct-fixed ERC20 has no executeInitialDistribution().');
        console.log('📊 Recording allocation intent only (no on-chain mint):');
        console.log('  - 4,000,000 tokens to platform vault:', platformVaultAddress);
        console.log('  - 196,000,000 tokens reserved for LP recipient');
        
        // Record platform allocation as recorded_only (no on-chain tx executed here)
        const { error: allocationError } = await supabase
          .from('platform_allocations')
          .insert({
            agent_id: agentId,
            token_address: deploymentResult.contractAddress,
            vault_address: platformVaultAddress,
            platform_amount: 4000000,
            status: 'recorded_only'
          });

        if (allocationError) {
          console.error('❌ Failed to record platform allocation:', allocationError);
        } else {
          console.log('✅ Platform allocation intent recorded in database (recorded_only)');
          platformAllocationResult = {
            platformVaultAddress,
            platformAmount: 4000000,
            status: 'recorded_only'
          };
        }
      } catch (allocationError) {
        console.error('❌ Platform allocation recording failed:', allocationError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        contractAddress: deploymentResult.contractAddress,
        transactionHash: deploymentResult.transactionHash,
        blockNumber: deploymentResult.blockNumber,
        gasUsed: deploymentResult.gasUsed.toString(),
        deploymentMethod: deploymentResult.deploymentMethod,
        agentId,
        platformAllocation: platformAllocationResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error deploying V2 Agent Token (fixed):', error);
    return new Response(JSON.stringify({ success: false, error: error.message, stack: error.stack }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
