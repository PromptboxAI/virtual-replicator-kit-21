// PROMPT token deployment with clean Remix bytecode
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { createPublicClient, createWalletClient, http, getAddress } from 'https://esm.sh/viem@2.31.7';
import { privateKeyToAccount } from 'https://esm.sh/viem@2.31.7/accounts';
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Primary and fallback RPC endpoints
const RPC_URLS = [
  'https://base-sepolia-rpc.publicnode.com',
  'https://rpc.ankr.com/base_sepolia',
  'https://base-sepolia.blockpi.network/v1/rpc/public',
  'https://api.developer.coinbase.com/rpc/v1/base-sepolia/yw4xIyRCrN5qMXDDULUJE8oqXPHJk0S6'
];

// Load contract artifact
async function loadContractArtifact() {
  try {
    const artifactPath = new URL('./artifacts/PromptTestToken_compData.json', import.meta.url).pathname;
    const artifactText = await Deno.readTextFile(artifactPath);
    const comp = JSON.parse(artifactText);
    const metadata = JSON.parse(comp.metadata);
    
    const abi = metadata.output.abi;
    const bytecode = (metadata.output?.evm?.bytecode?.object || comp.data?.bytecode?.object) as `0x${string}`;
    
    if (!bytecode || !bytecode.startsWith('0x') || bytecode.length < 4000) {
      throw new Error(`Invalid bytecode: ${bytecode?.length || 0} chars`);
    }
    
    console.log('✅ Bytecode loaded:', bytecode.length, 'chars');
    return { abi, bytecode };
  } catch (error) {
    console.error('❌ Failed to load artifact:', error);
    throw new Error(`Artifact load failed: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Debug bag for error diagnostics
  let debugBag: any = {};

  try {
    // Parse request
    let agentId = null;
    let userId = null;
    try {
      const body = await req.json();
      agentId = body?.agentId || null;
      userId = body?.userId || null;
    } catch {
      // No body
    }

    // Verify user is provided
    if (!userId) {
      throw new Error('Unauthorized: User ID required');
    }

    // Get env vars
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!deployerPrivateKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has admin role
    console.log(`🔐 Verifying admin role for user: ${userId}`);
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (roleError) {
      console.error('❌ Role check error:', roleError);
      throw new Error('Failed to verify user permissions');
    }

    if (!hasAdminRole) {
      console.warn(`⛔ Unauthorized deployment attempt by user: ${userId}`);
      throw new Error('Unauthorized: Admin access required');
    }

    console.log(`✅ Admin verified: ${userId}`);
    console.log('🚀 Starting PROMPT deployment');
    
    // Load contract artifact
    const { abi: PROMPT_TOKEN_ABI, bytecode: PROMPT_TOKEN_BYTECODE } = await loadContractArtifact();

    // Create blockchain clients with fallback RPC support
    const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
    
    let publicClient;
    let walletClient;
    let workingRpcUrl = null;
    
    // Try each RPC endpoint until one works
    for (const rpcUrl of RPC_URLS) {
      try {
        console.log(`🔌 Trying RPC: ${rpcUrl}`);
        const transport = http(rpcUrl, { timeout: 10000 });
        
        const testClient = createPublicClient({
          chain: baseSepolia,
          transport
        });
        
        // Test if RPC is working
        await testClient.getBlockNumber();
        
        publicClient = testClient;
        walletClient = createWalletClient({
          chain: baseSepolia,
          transport,
          account
        });
        
        workingRpcUrl = rpcUrl;
        console.log(`✅ Connected to RPC: ${rpcUrl}`);
        break;
      } catch (error) {
        console.warn(`❌ RPC failed: ${rpcUrl} - ${error.message}`);
        continue;
      }
    }
    
    if (!publicClient || !walletClient) {
      throw new Error('All RPC endpoints failed. Base Sepolia network may be experiencing issues.');
    }

    console.log('👤 Deployer:', account.address);
    
    // Check deployer balance
    let balance = 0n;
    try {
      balance = await publicClient.getBalance({ address: account.address });
      const balanceEth = Number(balance) / 1e18;
      console.log(`💰 Deployer balance: ${balanceEth.toFixed(4)} ETH`);
      
      if (balance === 0n) {
        throw new Error(`Deployer wallet has 0 ETH. Please fund ${account.address} with Base Sepolia ETH from https://www.alchemy.com/faucets/base-sepolia`);
      }
      
      if (balanceEth < 0.001) {
        console.warn(`⚠️ Low balance: ${balanceEth.toFixed(4)} ETH. May not be enough for deployment.`);
      }
    } catch (balanceError) {
      console.error('❌ Failed to check balance:', balanceError.message);
      throw new Error('Could not verify deployer wallet balance. RPC may be unstable.');
    }

    // Deactivate old contracts
    console.log('🧹 Cleaning up old contracts...');
    await supabase
      .from('deployed_contracts')
      .update({ is_active: false })
      .eq('contract_type', 'PROMPT')
      .eq('network', 'base_sepolia');

    // Get current fee data for EIP-1559 transaction
    console.log('⛽ Estimating gas...');
    let feeData;
    try {
      feeData = await publicClient.estimateFeesPerGas();
      console.log(`⛽ Fee data:`, {
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
      });
    } catch (estimateError: any) {
      console.warn(`⚠️ Gas estimation failed, using fallbacks:`, estimateError.message);
      feeData = {
        maxFeePerGas: 1000000000n, // 1 gwei fallback
        maxPriorityFeePerGas: 1000000000n
      };
    }
    
    // Apply 20% buffer and enforce minimum of 0.11 gwei
    let maxFeePerGas = feeData.maxFeePerGas 
      ? (feeData.maxFeePerGas * 120n) / 100n 
      : 110_000_000n; // ≥0.11 gwei fallback

    let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas 
      ? (feeData.maxPriorityFeePerGas * 120n) / 100n 
      : 110_000_000n;

    // Enforce absolute minimums (0.11 gwei)
    const MIN_GAS = 110_000_000n;
    if (maxFeePerGas < MIN_GAS) maxFeePerGas = MIN_GAS;
    if (maxPriorityFeePerGas < MIN_GAS) maxPriorityFeePerGas = MIN_GAS;

    console.log('⛽ Gas prices (with buffer):', {
      maxFeePerGas: `${Number(maxFeePerGas) / 1e9} gwei`,
      maxPriorityFeePerGas: `${Number(maxPriorityFeePerGas) / 1e9} gwei`
    });

    // Constructor arguments - REQUIRED by the contract ABI
    const NAME = 'Prompt Test Token';
    const SYMBOL = 'PROMPT';

    // Build debug bag for diagnostics
    debugBag = {
      rpcUrl: workingRpcUrl,
      chainId: baseSepolia.id,
      deployerAddress: account.address,
      deployerBalance: `${Number(balance) / 1e18} ETH`,
      bytecodeLength: PROMPT_TOKEN_BYTECODE.length,
      constructorArgs: [NAME, SYMBOL],
      gasSettings: {
        maxFeePerGas: `${Number(maxFeePerGas) / 1e9} gwei`,
        maxPriorityFeePerGas: `${Number(maxPriorityFeePerGas) / 1e9} gwei`,
        gasLimit: '2000000'
      }
    };

    console.log('🔍 Debug info:', debugBag);

    // Deploy contract using deployContract method with constructor args
    console.log('🚀 Deploying contract...');
    let hash: `0x${string}`;
    
    try {
      hash = await walletClient.deployContract({
        abi: PROMPT_TOKEN_ABI,
        bytecode: PROMPT_TOKEN_BYTECODE,
        account: account.address,  // Pass address, not account object
        args: [NAME, SYMBOL],       // Constructor args
        gas: 2_000_000n,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
      
      console.log('📝 TX:', hash);
    } catch (deployError: any) {
      console.error('❌ Deployment transaction failed:', deployError);
      
      // Provide helpful error messages
      if (deployError.message?.includes('insufficient funds')) {
        throw new Error(`Insufficient ETH in deployer wallet (${account.address}). Fund it at: https://www.alchemy.com/faucets/base-sepolia`);
      }
      
      if (deployError.message?.includes('nonce')) {
        throw new Error('Nonce error. The deployer wallet may have pending transactions. Please wait and try again.');
      }
      
      if (deployError.message?.includes('gas')) {
        throw new Error('Gas estimation failed. The Base Sepolia network may be congested. Try again in a few minutes.');
      }
      
      throw new Error(`Deployment failed: ${deployError.message || 'Unknown error'}. Check Base Sepolia network status.`);
    }

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 60000, // 1 minute
      confirmations: 1
    });
    
    console.log('📋 Receipt:', JSON.stringify({
      status: receipt.status,
      contractAddress: receipt.contractAddress,
      gasUsed: receipt.gasUsed?.toString(),
      blockNumber: receipt.blockNumber?.toString()
    }));
    
    if (!receipt?.contractAddress || receipt.status !== 'success') {
      // Try to get revert reason
      let revertReason = 'Unknown';
      try {
        await publicClient.call({
          data: PROMPT_TOKEN_BYTECODE as `0x${string}`,
          account: account.address
        });
      } catch (e: any) {
        revertReason = e.message || e.toString();
      }
      
      throw new Error(`Transaction reverted: ${hash}\nReason: ${revertReason}\nGas used: ${receipt.gasUsed?.toString()}`);
    }
    
    const contractAddress = getAddress(receipt.contractAddress);
    console.log('✅ Deployed:', contractAddress);

    // Quick verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    let verified = false;
    try {
      const bytecode = await publicClient.getBytecode({ 
        address: contractAddress as `0x${string}` 
      });
      verified = bytecode && bytecode !== '0x';
      console.log(`✅ Bytecode verified on-chain: ${verified}`);
    } catch (e) {
      console.warn('⚠️ Verification check failed:', e.message);
    }

    // Save to database
    console.log('💾 Saving to database...');
    const { error: dbError } = await supabase
      .from('deployed_contracts')
      .insert({
        contract_type: 'PROMPT',
        contract_address: contractAddress,
        transaction_hash: hash,
        network: 'base_sepolia',
        name: 'Prompt Test Token',
        symbol: 'PROMPT',
        is_active: true,
        agent_id: agentId,
        deployer_address: account.address,
        block_number: receipt.blockNumber?.toString(),
        gas_used: receipt.gasUsed?.toString()
      });

    if (dbError) {
      console.error('❌ Database error:', dbError);
      // Don't fail the whole deployment for DB issues
      console.warn('⚠️ Contract deployed but not saved to database');
    } else {
      console.log('✅ Saved to database');
    }

    return new Response(
      JSON.stringify({
        success: true,
        contractAddress,
        transactionHash: hash,
        chainId: baseSepolia.id,
        verified,
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString(),
        debugInfo: debugBag
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString(),
        debugBag: debugBag  // Include diagnostics
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
