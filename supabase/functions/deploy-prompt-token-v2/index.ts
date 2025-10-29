// PROMPT token deployment with embedded contract data
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { createPublicClient, createWalletClient, http, getAddress } from 'https://esm.sh/viem@2.31.7';
import { privateKeyToAccount } from 'https://esm.sh/viem@2.31.7/accounts';
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains';
import { PROMPT_TOKEN_ABI, PROMPT_TOKEN_BYTECODE } from './prompt-contract.ts';

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

// Validate bytecode on module load
if (!PROMPT_TOKEN_BYTECODE || PROMPT_TOKEN_BYTECODE.length < 4000) {
  throw new Error(`Invalid bytecode: too short (${PROMPT_TOKEN_BYTECODE?.length || 0} chars)`);
}

if (!PROMPT_TOKEN_BYTECODE.startsWith('0x')) {
  throw new Error('Invalid bytecode: missing 0x prefix');
}

console.log('✅ Bytecode validated:', {
  length: PROMPT_TOKEN_BYTECODE.length,
  prefix: PROMPT_TOKEN_BYTECODE.slice(0, 10),
  abiLength: PROMPT_TOKEN_ABI.length
});

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

    // Strict env validation (fail fast)
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!deployerPrivateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY environment variable is missing');
    }
    
    if (!deployerPrivateKey.startsWith('0x')) {
      throw new Error('DEPLOYER_PRIVATE_KEY must start with 0x');
    }
    
    if (deployerPrivateKey.length !== 66) { // 0x + 64 hex chars
      throw new Error(`DEPLOYER_PRIVATE_KEY has invalid length: ${deployerPrivateKey.length} (expected 66)`);
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    console.log('✅ Environment variables validated');

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
    
    // --- HARD GUARD DEBUG START ---
    console.log('🔔 deploy-prompt-token-v2 invoked');

    // Create blockchain clients with fallback RPC support
    const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
    console.log('👛 Deployer address:', account.address);
    
    // Check bytecode and ABI
    console.log('📦 Bytecode prefix:', PROMPT_TOKEN_BYTECODE.slice(0, 10), 'length:', PROMPT_TOKEN_BYTECODE.length);
    console.log('📐 ABI length:', PROMPT_TOKEN_ABI.length);
    
    const ctor = PROMPT_TOKEN_ABI.find((x: any) => x.type === 'constructor');
    console.log('🧩 Constructor inputs:', JSON.stringify(ctor?.inputs || []));
    
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
        
        // Log chain ID immediately
        const chainId = await testClient.getChainId();
        console.log('⛓️  Chain ID:', chainId, '(expected 84532 for Base Sepolia)');
        
        if (chainId !== 84532) {
          throw new Error(`Wrong chain! Got ${chainId}, expected 84532 (Base Sepolia)`);
        }
        
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

    // EIP-1559 gas fees with higher minimums and buffer
    console.log('⛽ Estimating gas fees...');
    let maxFeePerGas = 1_500_000_000n; // 1.5 gwei fallback
    let maxPriorityFeePerGas = 1_000_000_000n; // 1.0 gwei fallback
    
    try {
      const feeData = await publicClient.estimateFeesPerGas();
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // Apply 120% buffer
        maxFeePerGas = (feeData.maxFeePerGas * 120n) / 100n;
        maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * 120n) / 100n;
      }
    } catch (e) {
      console.warn('⚠️ Could not estimate fees from network, using fallbacks:', e.message);
    }
    
    // Enforce absolute minimums (Base Sepolia floor)
    if (maxFeePerGas < 1_500_000_000n) {
      console.log('⬆️ Raising maxFeePerGas to 1.5 gwei floor');
      maxFeePerGas = 1_500_000_000n;
    }
    if (maxPriorityFeePerGas < 1_000_000_000n) {
      console.log('⬆️ Raising maxPriorityFeePerGas to 1.0 gwei floor');
      maxPriorityFeePerGas = 1_000_000_000n;
    }
    
    console.log('⛽ Gas fees (gwei):', {
      maxFeePerGas: Number(maxFeePerGas) / 1e9,
      maxPriorityFeePerGas: Number(maxPriorityFeePerGas) / 1e9
    });

    // Store comprehensive debug info for error reporting
    const chainId = await publicClient.getChainId();
    // ctor already declared at line 119 - reuse it here
    
    debugBag = {
      rpcUrl: workingRpcUrl,
      chainId,
      expectedChainId: 84532,
      deployerAddress: account.address,
      deployerBalance: `${Number(balance) / 1e18} ETH`,
      deployerBalanceWei: balance.toString(),
      
      // Bytecode checks
      bytecodeLength: PROMPT_TOKEN_BYTECODE.length,
      bytecodePrefix: PROMPT_TOKEN_BYTECODE.slice(0, 20),
      bytecodeValid: PROMPT_TOKEN_BYTECODE.startsWith('0x') && PROMPT_TOKEN_BYTECODE.length > 10000,
      
      // Constructor checks
      constructorInputs: ctor?.inputs?.length || 0,
      constructorArgs: [],
      
      // Gas settings
      gasSettings: {
        maxFeePerGas: `${Number(maxFeePerGas) / 1e9} gwei`,
        maxPriorityFeePerGas: `${Number(maxPriorityFeePerGas) / 1e9} gwei`,
        gasLimit: 'auto-estimated by viem'
      },
      
      // ABI validation
      abiLength: PROMPT_TOKEN_ABI.length,
      abiValid: Array.isArray(PROMPT_TOKEN_ABI) && PROMPT_TOKEN_ABI.length > 0
    };

    console.log('🚀 Deploying PROMPT token contract to Base Sepolia...');
    console.log('Deployer address:', account.address);
    console.log('Chain ID:', chainId);
    console.log('Balance:', `${Number(balance) / 1e18} ETH`);

    // Fetch explicit nonce
    console.log('🔢 Fetching current nonce...');
    const nonce = await publicClient.getTransactionCount({
      address: account.address,
      blockTag: 'pending' // Includes any pending transactions
    });
    console.log('✅ Current nonce:', nonce);
    debugBag.nonce = nonce;

    // Deploy contract with retry logic
    let hash: `0x${string}`;
    try {
      hash = await walletClient.deployContract({
        abi: PROMPT_TOKEN_ABI,
        bytecode: PROMPT_TOKEN_BYTECODE,
        account,
        args: [], // Constructor has no inputs
        nonce, // Explicit nonce
        gas: 3_000_000n, // Manual gas limit to skip RPC estimation
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
      
      console.log('📝 TX:', hash);
      debugBag.transactionHash = hash;
    } catch (deployError: any) {
      const errorMsg = `${deployError?.message || deployError}`;
      
      // Retry once for common Base Sepolia race conditions
      if (/nonce too low|already known|replacement underpriced/i.test(errorMsg)) {
        console.warn('⚠️ Nonce/price race detected, retrying once with fresh nonce...');
        
        // Fetch fresh nonce
        const freshNonce = await publicClient.getTransactionCount({
          address: account.address,
          blockTag: 'pending',
        });
        debugBag.nonceRetry = freshNonce;
        console.log('🔄 Retrying with fresh nonce:', freshNonce);
        
        // Retry deployment
        hash = await walletClient.deployContract({
          abi: PROMPT_TOKEN_ABI,
          bytecode: PROMPT_TOKEN_BYTECODE,
          account,
          args: [],
          nonce: freshNonce,
          gas: 3_000_000n, // Manual gas limit
          maxFeePerGas,
          maxPriorityFeePerGas,
        });
        
        console.log('📝 Retry TX:', hash);
        debugBag.transactionHash = hash;
      } else {
        // Re-throw if not a nonce race
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
    console.error('❌ Deployment error:', error);
    console.error('Stack:', error?.stack);
    
    // Build comprehensive debug data
    const errorDebug = {
      ...debugBag,
      errorType: error?.name || 'UnknownError',
      errorMessage: error?.message || String(error),
      errorShortMessage: error?.shortMessage,
      errorStack: error?.stack?.split('\n')?.slice(0, 10),
      timestamp: new Date().toISOString(),
      
      // Include environment info
      environment: {
        hasPrivateKey: !!Deno.env.get('DEPLOYER_PRIVATE_KEY'),
        privateKeyValid: Deno.env.get('DEPLOYER_PRIVATE_KEY')?.startsWith('0x'),
        rpcConfigured: RPC_URLS.length > 0
      }
    };
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || String(error),
        shortMessage: error?.shortMessage || 'Deployment failed',
        debug: errorDebug,
        
        // Helpful suggestions based on error type
        suggestions: [
          error?.message?.includes('insufficient') ? 'Fund deployer wallet at: https://www.alchemy.com/faucets/base-sepolia' : null,
          error?.message?.includes('nonce') ? 'Wait for pending transactions to complete' : null,
          error?.message?.includes('gas') ? 'Base Sepolia may be congested. Try again in a few minutes.' : null,
          error?.message?.includes('simulation') ? 'Contract code or constructor args are invalid' : null,
        ].filter(Boolean)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
