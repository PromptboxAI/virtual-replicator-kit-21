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

// PROMPT Token bytecode (basic ERC20 with faucet)
const PROMPT_TOKEN_BYTECODE = "0x608060405234801561001057600080fd5b50604051806040016040528060098152602001682850524f4d50545445535460b81b81525060405180604001604052806009815260200168282927a6282a22a91960b91b815250816003908161006691906101fa565b50806004908161007691906101fa565b5050506100a333600a61008a919061035c565b633b9aca0061009991906103a7565b61008b60201b60201c565b506103c9565b6001600160a01b0382166100e55760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b80600260008282546100f791906103c1565b90915550506001600160a01b0382166000818152602081815260408083208054860190555184815260008051602061090e8339815191529101602001905180910390a35050565b634e487b7160e01b600052604160045260246000fd5b600181811c9082168061016257607f821691505b60208210810361018257634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156101f557600081815260208120601f850160051c810160208610156101af5750805b601f850160051c820191505b818110156101ce578281556001016101bb565b505050505b505050565b81516001600160401b038111156101f1576101f1610138565b9052565b600019600383901b1c191660019190911b1790565b600082610217576102176103eb565b500690565b634e487b7160e01b600052601160045260246000fd5b600181815b8085111561026d5781600019048211156102535761025361021c565b8085161561026057918102915b93841c9390800290610237565b509250929050565b60008261028457506001610356565b8161029157506000610356565b81600181146102a757600281146102b1576102cd565b6001915050610356565b60ff8411156102c2576102c261021c565b50506001821b610356565b5060208310610133831016604e8410600b84101617156102f0575081810a610356565b6102fa8383610232565b806000190482111561030e5761030e61021c565b029392505050565b600061032460ff841683610275565b9392505050565b600181815b8085111561036657816000190482111561034c5761034c61021c565b8085161561035957918102915b93841c939080029061032b565b509250929050565b600061032483610376600484610327565b634e487b7160e01b600052601260045260246000fd5b600082610396576103966103eb565b500490565b80820281158282048414176103b2576103b261021c565b92915050565b808201808211156103cb576103cb61021c565b92915050565b61053e806103d96000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063313ce56711610066578063313ce5671461012957806370a082311461013857806395d89b411461016b578063a9059cbb14610173578063dd62ed3e1461018657600080fd5b806306fdde0314610098578063095ea7b3146100b657806318160ddd146100d957806323b872dd146100eb575b600080fd5b6100a06101c4565b6040516100ad91906103de565b60405180910390f35b6100c96100c4366004610449565b610256565b60405190151581526020016100ad565b6002545b6040519081526020016100ad565b6100c96100f9366004610473565b61026d565b61010e61033c565b005b6100dd61011e366004610449565b61033f565b604051601281526020016100ad565b6100dd6101463660046104af565b73ffffffffffffffffffffffffffffffffffffffff1660009081526020819052604090205490565b6100a06103ba565b6100c9610181366004610449565b6103c9565b6100dd6101943660046104d1565b73ffffffffffffffffffffffffffffffffffffffff918216600090815260016020908152604080832093909416825291909152205490565b6060600380546101d390610504565b80601f01602080910402602001604051908101604052809291908181526020018280546101ff90610504565b801561024c5780601f106102215761010080835404028352916020019161024c565b820191906000526020600020905b81548152906001019060200180831161022f57829003601f168201915b5050505050905090565b60006102633384846103d6565b5060015b92915050565b600061027a848484610475565b73ffffffffffffffffffffffffffffffffffffffff8416600090815260016020908152604080832033845290915290205482811015610340576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e742065786365656473206160448201527f6c6c6f77616e636500000000000000000000000000000000000000000000000060648201526084015b60405180910390fd5b61034d85338584036103d6565b506001949350505050565b565b600061026333848460405180606001604052806025815260200161051660259139610194565b6060600480546101d390610504565b60006102633384846104755ba2646970667358221220c8f3c8b8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a864736f6c63430008130033ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

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
      
      // Prepare the deployment transaction
      const request = await publicClient.prepareTransactionRequest({
        account,
        data: PROMPT_TOKEN_BYTECODE as `0x${string}`,
        gas: 2000000n,
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
    
    if (!receipt?.contractAddress || receipt.status !== 'success') {
      throw new Error(`Failed: ${hash}`);
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
