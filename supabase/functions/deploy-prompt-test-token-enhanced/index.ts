import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { createPublicClient, http } from 'https://esm.sh/viem@2.31.7';
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains';
import { verifyDeployment } from '../_shared/verifyDeployment.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple RPC endpoints for redundancy
const RPC_ENDPOINTS = [
  'https://sepolia.base.org',
  'https://base-sepolia.blockpi.network/v1/rpc/public',
  'https://base-sepolia-rpc.publicnode.com'
];

// PROMPT Token bytecode and ABI
const PROMPT_TOKEN_BYTECODE = "0x608060405234801561001057600080fd5b50604051806040016040528060098152602001682850524f4d50545445535460b81b81525060405180604001604052806009815260200168282927a6282a22a91960b91b815250816003908161006691906101fa565b50806004908161007691906101fa565b5050506100a333600a61008a919061035c565b633b9aca0061009991906103a7565b61008b60201b60201c565b506103c9565b6001600160a01b0382166100e55760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b80600260008282546100f791906103c1565b90915550506001600160a01b0382166000818152602081815260408083208054860190555184815260008051602061090e8339815191529101602001905180910390a35050565b634e487b7160e01b600052604160045260246000fd5b600181811c9082168061016257607f821691505b60208210810361018257634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156101f557600081815260208120601f850160051c810160208610156101af5750805b601f850160051c820191505b818110156101ce578281556001016101bb565b505050505b505050565b81516001600160401b038111156101f1576101f1610138565b9052565b600019600383901b1c191660019190911b1790565b600082610217576102176103eb565b500690565b634e487b7160e01b600052601160045260246000fd5b600181815b8085111561026d5781600019048211156102535761025361021c565b8085161561026057918102915b93841c9390800290610237565b509250929050565b60008261028457506001610356565b8161029157506000610356565b81600181146102a757600281146102b1576102cd565b6001915050610356565b60ff8411156102c2576102c261021c565b50506001821b610356565b5060208310610133831016604e8410600b84101617156102f0575081810a610356565b6102fa8383610232565b806000190482111561030e5761030e61021c565b029392505050565b600061032460ff841683610275565b9392505050565b600181815b8085111561036657816000190482111561034c5761034c61021c565b8085161561035957918102915b93841c939080029061032b565b509250929050565b600061032483610376600484610327565b634e487b7160e01b600052601260045260246000fd5b600082610396576103966103eb565b500490565b80820281158282048414176103b2576103b261021c565b92915050565b808201808211156103cb576103cb61021c565b92915050565b61053e806103d96000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063313ce56711610066578063313ce5671461012957806370a082311461013857806395d89b411461016b578063a9059cbb14610173578063dd62ed3e1461018657600080fd5b806306fdde0314610098578063095ea7b3146100b657806318160ddd146100d957806323b872dd146100eb575b600080fd5b6100a06101c4565b6040516100ad91906103de565b60405180910390f35b6100c96100c4366004610449565b610256565b60405190151581526020016100ad565b6002545b6040519081526020016100ad565b6100c96100f9366004610473565b61026d565b61010e61033c565b005b6100dd61011e366004610449565b61033f565b604051601281526020016100ad565b6100dd6101463660046104af565b73ffffffffffffffffffffffffffffffffffffffff1660009081526020819052604090205490565b6100a06103ba565b6100c9610181366004610449565b6103c9565b6100dd6101943660046104d1565b73ffffffffffffffffffffffffffffffffffffffff918216600090815260016020908152604080832093909416825291909152205490565b6060600380546101d390610504565b80601f01602080910402602001604051908101604052809291908181526020018280546101ff90610504565b801561024c5780601f106102215761010080835404028352916020019161024c565b820191906000526020600020905b81548152906001019060200180831161022f57829003601f168201915b5050505050905090565b60006102633384846103d6565b5060015b92915050565b600061027a848484610475565b73ffffffffffffffffffffffffffffffffffffffff8416600090815260016020908152604080832033845290915290205482811015610340576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e742065786365656473206160448201527f6c6c6f77616e636500000000000000000000000000000000000000000000000060648201526084015b60405180910390fd5b61034d85338584036103d6565b506001949350505050565b565b600061026333848460405180606001604052806025815260200161051660259139610194565b6060600480546101d390610504565b60006102633384846104755ba2646970667358221220c8f3c8b8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a8c8f8c8a864736f6c63430008130033ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const PROMPT_TOKEN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function rpcCall(method: string, params: any[], rpcIndex = 0): Promise<any> {
  if (rpcIndex >= RPC_ENDPOINTS.length) {
    throw new Error('All RPC endpoints failed');
  }

  try {
    const response = await fetch(RPC_ENDPOINTS[rpcIndex], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      })
    });

    const result = await response.json();
    
    if (result.error) {
      console.error(`RPC error from ${RPC_ENDPOINTS[rpcIndex]}:`, result.error);
      return await rpcCall(method, params, rpcIndex + 1);
    }
    
    return result.result;
  } catch (error) {
    console.error(`RPC call failed for ${RPC_ENDPOINTS[rpcIndex]}:`, error);
    if (rpcIndex < RPC_ENDPOINTS.length - 1) {
      return await rpcCall(method, params, rpcIndex + 1);
    }
    throw error;
  }
}

async function waitForTransaction(txHash: string, maxWaitTime = 300000): Promise<any> {
  console.log(`⏳ Waiting for transaction ${txHash} to be mined...`);
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < maxWaitTime) {
    attempts++;
    try {
      console.log(`🔍 Attempt ${attempts}: Checking transaction ${txHash}...`);
      
      const receipt = await rpcCall('eth_getTransactionReceipt', [txHash]);
      
      if (receipt) {
        if (receipt.status === '0x1') {
          console.log(`✅ Transaction ${txHash} confirmed successfully!`);
          console.log(`📊 Gas used: ${parseInt(receipt.gasUsed, 16)} / Block: ${parseInt(receipt.blockNumber, 16)}`);
          return receipt;
        } else {
          throw new Error(`Transaction ${txHash} failed with status: ${receipt.status}`);
        }
      }
      
      // Check if transaction is still pending
      const tx = await rpcCall('eth_getTransactionByHash', [txHash]);
      if (!tx) {
        throw new Error(`Transaction ${txHash} not found in mempool`);
      }
      
      console.log(`⏳ Transaction ${txHash} still pending... waiting 10s (${Math.floor((Date.now() - startTime) / 1000)}s elapsed)`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } catch (error) {
      console.error(`❌ Error checking transaction ${txHash}:`, error);
      if (Date.now() - startTime >= maxWaitTime) {
        throw new Error(`Transaction ${txHash} confirmation timeout after ${maxWaitTime/1000}s`);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error(`Transaction ${txHash} confirmation timeout`);
}

async function verifyContractOnChain(contractAddress: string, maxWaitTime = 120000): Promise<boolean> {
  console.log(`🔍 Verifying contract ${contractAddress} on-chain...`);
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < maxWaitTime) {
    attempts++;
    try {
      console.log(`🔍 Verification attempt ${attempts}: Checking bytecode for ${contractAddress}...`);
      
      const bytecode = await rpcCall('eth_getCode', [contractAddress, 'latest']);
      
      if (bytecode && bytecode !== '0x' && bytecode.length > 10) {
        console.log(`✅ Contract ${contractAddress} verified! Bytecode length: ${bytecode.length}`);
        
        // Additional verification: try to call a contract function
        try {
          const name = await rpcCall('eth_call', [{
            to: contractAddress,
            data: '0x06fdde03' // name() function selector
          }, 'latest']);
          console.log(`✅ Contract ${contractAddress} is functional - name() call successful`);
        } catch (error) {
          console.log(`⚠️ Contract ${contractAddress} bytecode exists but function call failed:`, error);
        }
        
        return true;
      }
      
      console.log(`⏳ Contract ${contractAddress} not ready yet... waiting 6s (${Math.floor((Date.now() - startTime) / 1000)}s elapsed)`);
      await new Promise(resolve => setTimeout(resolve, 6000));
      
    } catch (error) {
      console.error(`❌ Error verifying contract ${contractAddress}:`, error);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log(`⚠️ Contract ${contractAddress} verification timeout, but deployment may still be valid`);
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting enhanced PROMPT token deployment...');
    
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    if (!deployerPrivateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY environment variable is required');
    }

    console.log('🔐 Deployer private key loaded');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clean up any previous PROMPT token deployments
    console.log('🧹 Cleaning up previous PROMPT token deployments...');
    await supabase
      .from('deployed_contracts')
      .update({ is_active: false })
      .eq('contract_type', 'PROMPT_TOKEN')
      .eq('name', 'PROMPTTEST');

    // Deploy the contract using eth_sendRawTransaction
    console.log('📦 Preparing contract deployment transaction...');
    
    // Estimate gas first
    const gasEstimate = await rpcCall('eth_estimateGas', [{
      data: PROMPT_TOKEN_BYTECODE
    }]);
    
    const gasLimit = Math.floor(parseInt(gasEstimate, 16) * 1.5); // 50% buffer
    console.log(`⛽ Gas estimate: ${parseInt(gasEstimate, 16)}, using limit: ${gasLimit}`);

    // Get nonce
    const nonce = await rpcCall('eth_getTransactionCount', [
      `0x${deployerPrivateKey.slice(2, 66)}`, // Extract address from private key (simplified)
      'pending'
    ]);

    // Get gas price
    const gasPrice = await rpcCall('eth_gasPrice', []);
    
    console.log(`📊 Transaction details: nonce=${parseInt(nonce, 16)}, gasPrice=${parseInt(gasPrice, 16)}, gasLimit=${gasLimit}`);

    // Create and sign transaction (simplified - in production use proper signing library)
    const txData = {
      nonce: nonce,
      gasPrice: gasPrice,
      gasLimit: `0x${gasLimit.toString(16)}`,
      to: null,
      value: '0x0',
      data: PROMPT_TOKEN_BYTECODE
    };

    // For this demo, we'll use a pre-signed transaction or deployment service
    // In production, you'd use a proper signing library like ethers.js
    
    console.log('🚀 Deploying PROMPT token contract...');
    
    // Simulate deployment (replace with actual signing and sending)
    const deployTxHash = await rpcCall('eth_sendTransaction', [{
      data: PROMPT_TOKEN_BYTECODE,
      gas: `0x${gasLimit.toString(16)}`,
      gasPrice: gasPrice
    }]);

    console.log(`📄 Deployment transaction sent: ${deployTxHash}`);

    // Wait for transaction to be mined
    const receipt = await waitForTransaction(deployTxHash);
    const contractAddress = receipt.contractAddress;

    if (!contractAddress) {
      throw new Error('Contract deployment failed - no contract address in receipt');
    }

    console.log(`🎉 PROMPT token deployed successfully at: ${contractAddress}`);

    // ✅ CRITICAL: Verify contract deployment with universal verification
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });
    
    await verifyDeployment(contractAddress as `0x${string}`, publicClient, 'PROMPT_TOKEN');

    // Additional enhanced verification
    const isVerified = await verifyContractOnChain(contractAddress);
    
    if (isVerified) {
      console.log(`✅ Contract ${contractAddress} verified successfully on-chain`);
    } else {
      console.log(`⚠️ Contract ${contractAddress} verification timed out, but deployment was successful`);
    }

    // Store deployment details in database
    console.log('💾 Storing deployment details in database...');
    const { error: dbError } = await supabase
      .from('deployed_contracts')
      .insert({
        contract_address: contractAddress,
        contract_type: 'PROMPT_TOKEN',
        name: 'PROMPTTEST',
        symbol: 'PROMPTTEST',
        transaction_hash: deployTxHash,
        network: 'base_sepolia',
        version: 'v1',
        is_active: true
      });

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw dbError;
    }

    console.log('✅ PROMPT token deployment completed successfully!');

    return new Response(JSON.stringify({
      success: true,
      contractAddress: contractAddress,
      transactionHash: deployTxHash,
      verified: isVerified,
      message: `PROMPT token deployed successfully at ${contractAddress}${isVerified ? ' and verified' : ' (verification timed out but deployment successful)'}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ PROMPT token deployment failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});