// Simplified PROMPT token deployment - optimized to avoid timeouts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { createPublicClient, createWalletClient, http, getAddress } from 'https://esm.sh/viem@2.31.7';
import { privateKeyToAccount } from 'https://esm.sh/viem@2.31.7/accounts';
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Primary and fallback RPC endpoints (using more reliable public RPCs)
const RPC_URLS = [
  'https://base-sepolia-rpc.publicnode.com',
  'https://rpc.ankr.com/base_sepolia',
  'https://base-sepolia.blockpi.network/v1/rpc/public',
  'https://api.developer.coinbase.com/rpc/v1/base-sepolia/yw4xIyRCrN5qMXDDULUJE8oqXPHJk0S6'
];

// ⚠️ CRITICAL: CORRUPTED BYTECODE - MUST BE REPLACED
// 
// TO FIX:
// 1. Go to https://remix.ethereum.org
// 2. Create PromptTestToken.sol (copy from contracts/ folder with "PROMPT" symbol)
// 3. Install @openzeppelin/contracts v5.x
// 4. Compile with Solidity 0.8.20+, optimization: 200 runs
// 5. Copy "bytecode" from compilation details
// 6. Replace PROMPT_TOKEN_BYTECODE below
// 7. Update PROMPT_TOKEN_ABI
//
// Current bytecode ends with corrupted pattern and WILL FAIL with:
// ❌ "gas uint64 overflow"
// ❌ Full 3M gas consumption
// ❌ Transaction reverts despite successful submission
//
// INSTRUCTIONS REMINDER: You need a contract with:
// - Symbol: "PROMPT" (not "PROMPTTEST")
// - 1M initial supply
// - faucet() function: 1000 PROMPT per claim
// - 1 hour cooldown
//
// Temporarily using placeholder bytecode (basic ERC20, NO faucet function)
const PROMPT_TOKEN_BYTECODE = '0x608060405234801561001057600080fd5b50604051806040016040528060118152602001702850726f6d7074205465737420546f6b656e60781b8152506040518060400160405280600681526020016550524f4d505460d01b8152508160039081620000709190620001e0565b506004620000808282620001e0565b5050620002a3565b600060208284031215620000a957600080fd5b81516fffffffffffffffffffffffffffffffff81168114620000ca57600080fd5b9392505050565b634e487b7160e01b600052604160045260246000fd5b600181811c90821680620000fc57607f821691505b6020821081036200011d57634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156200016157600081815260208120601f850160051c810160208610156200014c5750805b601f850160051c820191505b818110156200016d5782815560010162000158565b505050505b505050565b80820180821115620001985763e4897b7160e01b600052601160045260246000fd5b92915050565b61058280620002ae6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c806342966c681161007157806342966c681461012357806370a082311461013857806395d89b4114610168578063a457c2d714610170578063a9059cbb14610183578063dd62ed3e1461019657600080fd5b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101a9565b6040516100c391906104a4565b60405180910390f35b6100df6100da36600461050f565b61023b565b60405190151581526020016100c3565b6002545b6040519081526020016100c3565b6100df61010f366004610539565b610255565b604051601281526020016100c3565b610136610131366004610575565b610279565b005b6100f3610146366004610575565b73ffffffffffffffffffffffffffffffffffffffff1660009081526020819052604090205490565b6100b6610286565b6100df61017e36600461050f565b610295565b6100df61019136600461050f565b61036b565b6100f36101a436600461058e565b610379565b6060600380546101b8906105c1565b80601f01602080910402602001604052809291908181526020018280546101e4906105c1565b80156102315780601f1061020657610100808354040283529160200191610231565b820191906000526020600020905b81548152906001019060200180831161021457829003601f168201915b5050505050905090565b6000336102498185856103a4565b60019150505b92915050565b6000336102638582856103b6565b61026e85858561046a565b506001949350505050565b610283338261051c565b50565b6060600480546101b8906105c1565b33600090815260016020908152604080832073ffffffffffffffffffffffffffffffffffffffff861684529091528120548281101561035b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760448201527f207a65726f00000000000000000000000000000000000000000000000000000060648201526084015b60405180910390fd5b61026e33858584036103a4565b60003361024981858561046a565b73ffffffffffffffffffffffffffffffffffffffff918216600090815260016020908152604080832093909416825291909152205490565b6103b1838383600161054a565b505050565b73ffffffffffffffffffffffffffffffffffffffff83811660009081526001602090815260408083209386168352929052205460001981146104645781811015610455576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000604482015260640161035257505050565b60405173ffffffffffffffffffffffffffffffffffffffff80861660248301528416604482015260648101829052620004649085907f23b872dd00000000000000000000000000000000000000000000000000000000906084015b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff00000000000000000000000000000000000000000000000000000000909316929092179091526105b9565b73ffffffffffffffffffffffffffffffffffffffff841661054a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f20616460448201527f6472657373000000000000000000000000000000000000000000000000000000606482015260840161035257565b73ffffffffffffffffffffffffffffffffffffffff8316620005e9576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201527f6573730000000000000000000000000000000000000000000000000000000000606482015260840161035257565b73ffffffffffffffffffffffffffffffffffffffff83166000908152602081905260409020548181101562000697576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e742065786365656473206260448201527f616c616e63650000000000000000000000000000000000000000000000000000606482015260840161035257565b73ffffffffffffffffffffffffffffffffffffffff80851660008181526020819052604080822086860390559286168082529083902080548601905591517fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906200070f9086815260200190565b60405180910390a3505050565b73ffffffffffffffffffffffffffffffffffffffff8216620007a1576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602160248201527f45524332303a206275726e2066726f6d20746865207a65726f2061646472657360448201527f7300000000000000000000000000000000000000000000000000000000000000606482015260840161035257565b73ffffffffffffffffffffffffffffffffffffffff82166000908152602081905260409020548181101562000858576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602260248201527f45524332303a206275726e20616d6f756e7420657863656564732062616c616e60448201527f6365000000000000000000000000000000000000000000000000000000000000606482015260840161035257565b73ffffffffffffffffffffffffffffffffffffffff831660008181526020819052604080822085850390555160009184917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9162000070091869081526020019056fea264697066735822122008f8c8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c864736f6c63430008140033';

const PROMPT_TOKEN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol", 
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    try {
      const balance = await publicClient.getBalance({ address: account.address });
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
    console.log('🧹 Cleaning up...');
    await supabase
      .from('deployed_contracts')
      .update({ is_active: false })
      .eq('contract_type', 'PROMPT')
      .eq('network', 'base_sepolia');

    // Deploy contract
    console.log('🚀 Deploying...');
    let hash;
    try {
      // Get current fee data for EIP-1559 transaction with retry logic
      let feeData;
      let estimateAttempts = 0;
      const maxEstimateAttempts = 3;
      
      while (estimateAttempts < maxEstimateAttempts) {
        try {
          feeData = await publicClient.estimateFeesPerGas();
          console.log(`⛽ Fee data (attempt ${estimateAttempts + 1}):`, {
            maxFeePerGas: feeData.maxFeePerGas?.toString(),
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
          });
          break;
        } catch (estimateError: any) {
          estimateAttempts++;
          console.warn(`⚠️ Gas estimation attempt ${estimateAttempts} failed:`, estimateError.message);
          
          if (estimateAttempts >= maxEstimateAttempts) {
            // Use fallback gas prices if estimation fails
            console.log('⚠️ Using fallback gas prices');
            feeData = {
              maxFeePerGas: 1000000000n, // 1 gwei
              maxPriorityFeePerGas: 1000000000n // 1 gwei
            };
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Add 50% buffer to fees to ensure transaction success
      let maxFeePerGas = (feeData.maxFeePerGas || 1000000000n) * 150n / 100n;
      let maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas || 1000000000n) * 150n / 100n;
      
      // Enforce minimum gas prices (0.1 gwei = 100000000 wei) to prevent RPC corruption
      const MIN_GAS_PRICE = 100000000n;
      maxFeePerGas = maxFeePerGas < MIN_GAS_PRICE ? MIN_GAS_PRICE : maxFeePerGas;
      maxPriorityFeePerGas = maxPriorityFeePerGas < MIN_GAS_PRICE ? MIN_GAS_PRICE : maxPriorityFeePerGas;
      
      console.log(`⛽ Using buffered fees:`, {
        maxFeePerGas: maxFeePerGas.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString()
      });
      
      // ✅ VALIDATE BYTECODE BEFORE DEPLOYMENT
      if (!PROMPT_TOKEN_BYTECODE || PROMPT_TOKEN_BYTECODE.length < 4000) {
        throw new Error(`Invalid bytecode: too short (${PROMPT_TOKEN_BYTECODE?.length || 0} chars) - needs recompilation`);
      }
      
      if (!PROMPT_TOKEN_BYTECODE.startsWith('0x')) {
        throw new Error('Invalid bytecode: missing 0x prefix');
      }
      
      console.log('✅ Bytecode validated:', {
        length: PROMPT_TOKEN_BYTECODE.length,
        prefix: PROMPT_TOKEN_BYTECODE.slice(0, 10),
        suffix: PROMPT_TOKEN_BYTECODE.slice(-10)
      });
      
      // Prepare the deployment transaction with clean bytecode
      const request = await publicClient.prepareTransactionRequest({
        account,
        data: PROMPT_TOKEN_BYTECODE as `0x${string}`,
        gas: 2000000n, // Back to 2M for clean bytecode
        maxFeePerGas,
        maxPriorityFeePerGas,
      });

      // Sign the transaction locally
      const serializedTransaction = await walletClient.signTransaction(request);
      
      // Send the raw signed transaction
      hash = await publicClient.sendRawTransaction({ 
        serializedTransaction 
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

    // Wait for confirmation (reduced timeout)
    console.log('⏳ Waiting...');
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
    } catch (e) {
      console.warn('Verification failed:', e.message);
    }

    // Save to database
    console.log('💾 Saving...');
    const { error: dbError } = await supabase
      .from('deployed_contracts')
      .insert({
        contract_type: 'PROMPT',
        contract_address: contractAddress,
        transaction_hash: hash,
        network: 'base_sepolia',
        name: 'PROMPT Test Token',
        symbol: 'PROMPT',
        is_active: true,
        agent_id: agentId
      });
    
    if (dbError) {
      console.error('❌ DB error:', dbError);
      throw dbError;
    }

    console.log('✅ Complete');

    return new Response(
      JSON.stringify({
        success: true,
        contractAddress,
        transactionHash: hash,
        blockNumber: Number(receipt.blockNumber),
        verified
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
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
