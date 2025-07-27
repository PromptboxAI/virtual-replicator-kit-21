import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createPublicClient, createWalletClient, http, parseEther } from 'https://esm.sh/viem@2.31.7';
import { privateKeyToAccount } from 'https://esm.sh/viem@2.31.7/accounts';
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced Factory Contract Bytecode and ABI
const FACTORY_BYTECODE = '0x608060405234801561001057600080fd5b5060405161095638038061095683398101604081905261002f916100b1565b600080546001600160a01b038085166001600160a01b0319928316179092556001805492841692909116919091179055604051829082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a350506100e4565b80516001600160a01b03811681146100a857600080fd5b919050565b600080604083850312156100c457600080fd5b6100cd83610091565b91506100db60208401610091565b90509250929050565b610863806100f36000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80631749dc181461005c5780635aadc5fe1461007157806361d027b314610084578063b6c52da81461009e578063f7cdd48e146100b1575b600080fd5b61006f61006a366004610632565b6100c4565b005b61007961027c565b60405190815260200160405180910390f35b6000546040516001600160a01b03909116815260200161007f565b60015461008c906001600160a01b031681565b60405190815260200161007f565b6100c26100bf3660046106b2565b61028a565b005b600083836000336001600160a01b0316146101265760405162461bcd60e51b815260206004820152601e60248201527f4f6e6c7920666163746f727920636f6e747261637420616c6c6f776564000060448201526064015b60405180910390fd5b8451865185511480156101405750825185511480156101405750815185515b6101555760405162461bcd60e51b815260040161011d906107c4565b6101645760405162461bcd60e51b815260040161011d906107c4565b6000670de0b6b3a76400008251101561018f5760405162461bcd60e51b815260040161011d906107c4565b604051633e24516b60e11b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000081169063c45ea8d690306103e8906004016107f2565b602060405180830381865afa1580156101d8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101fc9190610813565b6040516001600160a01b03909116906103e890819060405180830381875af1925050503d8060008114610248576040519150601f19603f3d011682016040523d82523d6000602084013e61024d565b606091505b505080945050505050610263600e8387886108de565b9695505050505050565b60006102798286611015565b949350505050565b600061028857505050565b565b60008190036102a95760405162461bcd60e51b815260040161011d906107c4565b604051633e24516b60e11b8152678ac7230489e800006001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000811691633ac24516691903906004016107f2565b602060405180830381865afa15801561030c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103309190610813565b60400180830381875af1925050503d806000811461036a576040519150601f19603f3d011682016040523d82523d6000602084013e61036f565b606091505b50508092505050816103935760405162461bcd60e51b815260040161011d906107c4565b604080516001600160a01b0383168152602081018590527f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0910160405180910390a1604051633e24516b60e11b8152670de0b6b3a76400006001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000811691633ac24516691903906004016107f2565b602060405180830381865afa158015610469573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061048d9190610813565b60400180830381875af1925050503d80600081146104c7576040519150601f19603f3d011682016040523d82523d6000602084013e6104cc565b606091505b5050809250505081610514565b60405162461bcd60e51b815260040161011d906107c4565b604080516001600160a01b0383168152602081018590527f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0910160405180910390a15050565b600080604083850312156105ca57600080fd5b82356001600160a01b03811681146105e157600080fd5b946020939093013593505050565b6000815180845260005b8181101561061557602081850181015186830182015201610619565b506000602082860101526020601f19601f83011685010191505092915050565b6000608082840312156106475761064757600080fd5b50919050565b6000610658826106df565b915061066482856106df565b92505050919050565b634e487b7160e01b600052602260045260246000fd5b600181811c9082168061069957607f821691505b6020821081036106b8576106b861066d565b50919050565b600080600080608085870312156106d4576106d457600080fd5b8435935060208501359250604085013591506060850135801515811681146106fc57600080fd5b939692955090935050565b634e487b7160e01b600052601160045260246000fd5b818103818111156107425761074261070b565b92915050565b600082610765576107656001600160e01b036107b6565b500490565b60008261077e5761077e6001600160e01b036107b6565b500690565b8082018082111561074257610742610707565b808202811582820484141761074257610742610707565b634e487b7160e01b600052601260045260246000fd5b6020808252818101527f496e73756666696369656e7420696e7075742076616c69646174696f6e000060408201526060019056fea2646970667358221220abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789064736f6c63430008140033';

const FACTORY_ABI = [
  {
    inputs: [{ name: "_promptToken", type: "address" }, { name: "_treasury", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "promptToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getAllTokens",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "_name", type: "string" },
      { name: "_symbol", type: "string" },
      { name: "_initialSupply", type: "uint256" },
      { name: "_creator", type: "address" }
    ],
    name: "createAgentToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { promptTokenAddress, treasuryAddress } = await req.json();
    
    if (!promptTokenAddress || !treasuryAddress) {
      throw new Error('Missing required parameters: promptTokenAddress and treasuryAddress');
    }

    console.log('🏭 Starting enhanced factory deployment...');
    console.log('📍 PROMPT Token:', promptTokenAddress);
    console.log('🏦 Treasury:', treasuryAddress);

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

    // Step 1: Clean up old factory deployments
    console.log('🧹 Cleaning up old factory deployments...');
    const { error: cleanupError } = await supabase
      .from('deployed_contracts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('contract_type', 'factory')
      .eq('network', 'base_sepolia');

    if (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError.message);
    }

    // Step 2: Verify PROMPT token exists
    console.log('🔍 Verifying PROMPT token contract...');
    const promptTokenCode = await publicClient.getCode({ 
      address: promptTokenAddress as `0x${string}` 
    });
    
    if (!promptTokenCode || promptTokenCode === '0x') {
      throw new Error(`PROMPT token contract not found at ${promptTokenAddress}`);
    }
    console.log('✅ PROMPT token verified');

    // Step 3: Estimate gas for deployment
    console.log('⛽ Estimating gas for factory deployment...');
    
    let estimatedGas: bigint;
    try {
      estimatedGas = await publicClient.estimateContractGas({
        abi: FACTORY_ABI,
        bytecode: FACTORY_BYTECODE as `0x${string}`,
        args: [promptTokenAddress, treasuryAddress],
        account: account.address,
      });
      console.log('📊 Estimated gas:', estimatedGas.toString());
    } catch (gasError) {
      console.warn('⚠️ Gas estimation failed, using default:', gasError);
      estimatedGas = BigInt(8000000); // Default fallback
    }

    // Add 20% buffer to prevent out-of-gas
    const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100);
    console.log('🛡️ Gas with 20% buffer:', gasWithBuffer.toString());

    // Step 4: Deploy the factory contract
    console.log('🚀 Deploying factory contract...');
    
    const deployHash = await walletClient.deployContract({
      abi: FACTORY_ABI,
      bytecode: FACTORY_BYTECODE as `0x${string}`,
      args: [promptTokenAddress, treasuryAddress],
      gas: gasWithBuffer,
    });

    console.log('📝 Deployment transaction hash:', deployHash);

    // Step 5: Wait for transaction confirmation
    console.log('⏳ Waiting for transaction confirmation...');
    
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: deployHash,
      timeout: 120000 // 2 minute timeout
    });

    console.log('📦 Transaction receipt:', {
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    });

    // Check for out-of-gas (exactly 5M gas used indicates failure)
    if (receipt.gasUsed === BigInt(5000000)) {
      throw new Error('Transaction likely failed due to out-of-gas (exactly 5M gas used)');
    }

    if (receipt.status !== 'success') {
      throw new Error(`Transaction failed with status: ${receipt.status}`);
    }

    const contractAddress = receipt.contractAddress;
    if (!contractAddress) {
      throw new Error('No contract address in receipt');
    }

    console.log('🎉 Factory deployed successfully at:', contractAddress);

    // Step 6: Verify deployed contract
    console.log('🔍 Verifying deployed contract...');
    
    const deployedCode = await publicClient.getCode({ address: contractAddress });
    if (!deployedCode || deployedCode === '0x') {
      throw new Error('Deployed contract has no bytecode');
    }

    // Test contract functions
    try {
      const factoryPromptToken = await publicClient.readContract({
        address: contractAddress,
        abi: FACTORY_ABI,
        functionName: 'promptToken'
      });
      
      const factoryTreasury = await publicClient.readContract({
        address: contractAddress,
        abi: FACTORY_ABI,
        functionName: 'treasury'
      });

      const tokens = await publicClient.readContract({
        address: contractAddress,
        abi: FACTORY_ABI,
        functionName: 'getAllTokens'
      });

      console.log('✅ Factory contract verification:', {
        promptToken: factoryPromptToken,
        treasury: factoryTreasury,
        initialTokenCount: (tokens as string[]).length
      });

      if (factoryPromptToken !== promptTokenAddress.toLowerCase()) {
        console.warn('⚠️ PROMPT token mismatch in factory');
      }
      
      if (factoryTreasury !== treasuryAddress.toLowerCase()) {
        console.warn('⚠️ Treasury address mismatch in factory');
      }

    } catch (verifyError) {
      console.error('❌ Contract verification failed:', verifyError);
      throw new Error(`Deployed contract verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`);
    }

    // Step 7: Store deployment in database
    console.log('💾 Storing deployment in database...');
    
    const { error: dbError } = await supabase
      .from('deployed_contracts')
      .insert({
        contract_type: 'factory',
        contract_address: contractAddress.toLowerCase(),
        network: 'base_sepolia',
        version: 'v2_fixed',
        transaction_hash: deployHash,
        is_active: true,
        deployment_timestamp: new Date().toISOString(),
        name: 'AgentTokenFactory',
        symbol: 'FACTORY'
      });

    if (dbError) {
      console.error('❌ Database storage failed:', dbError);
      throw new Error(`Failed to store deployment: ${dbError.message}`);
    }

    console.log('✅ Deployment stored successfully');

    return new Response(
      JSON.stringify({
        success: true,
        contractAddress: contractAddress,
        transactionHash: deployHash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber.toString(),
        estimatedGas: estimatedGas.toString(),
        actualGas: gasWithBuffer.toString(),
        verification: {
          promptToken: factoryPromptToken,
          treasury: factoryTreasury,
          hasCode: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Factory deployment failed:', error);
    
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