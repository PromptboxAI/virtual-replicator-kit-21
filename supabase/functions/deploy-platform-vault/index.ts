import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'https://esm.sh/viem@2.31.7'
import { privateKeyToAccount } from 'https://esm.sh/viem@2.31.7/accounts'
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PlatformVault contract ABI and bytecode
const PLATFORM_VAULT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_owner", "type": "address"},
      {"internalType": "address", "name": "_initialReceiver", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "receiver",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newReceiver", "type": "address"}],
    "name": "initiateReceiverChange",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newReceiver", "type": "address"}],
    "name": "executeReceiverChange",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "sweep",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Placeholder bytecode - replace with actual compiled bytecode
const PLATFORM_VAULT_BYTECODE = "0x608060405234801561001057600080fd5b50600436106100625760003560e01c80631e0830da14610067578063238efcbc1461008357806347e7ef24146100995780634e71e0c8146100af5780638da5cb5b146100cb578063f2fde38b146100e9575b600080fd5b61008161007536600461055b565b61010557565b005b61008b6101b9565b6040519081526020015b60405180910390f35b6100a16101c8565b604051908152366020019181529083015250565b61008b6100bd36600461055b565b61020d565b6100d361021d565b6040516001600160a01b039091168152602001610090565b6100816100f736600461055b565b61022c565b6001600160a01b03811661015a5760405162461bcd60e51b815260206004820152601360248201527f496e76616c696420617070726f76657220000000000000000000000000000000604482015260640160405180910390fd5b600180546001600160a01b0319166001600160a01b0383169081179091556040519081527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906020015b60405180910390a150565b60006101c4426102a6565b9150915090565b60006101d76000843554565b6040519081527f33746f4b59d8fd4b46f2c2f1b0ad4d6e203b7fb9e3c50e92064f6fcf23caa2a990602001610090565b505050565b60006102186102b9565b905090565b6000546001600160a01b031690565b61023461030a565b6001600160a01b0381166102995760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b6064820152608401610405565b6102a281610364565b5050565b6000806102b183546103b6565b949350505050565b60006102c36103cb565b6001600160a01b0316336001600160a01b0316146103235760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152606401610405565b6103265b565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6000604080518082019091529150565b6000546001600160a01b031690565b600061045a565b6000610416565b600061051061041985610445565b6104596c010000000000000000000000008361055f565b6001600160a01b038116811461055857600080fd5b50565b60006020828403121561056d57600080fd5b8135610578816103c4565b9392505050565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b600060001982141561058157610581610595565b5060010190565b6000828210156105d3576105d3610595565b500390565b600060ff821660ff8416808210156105f2576105f2610595565b90039392505050565b634e487b7160e01b600052601260045260246000fd5b600082610620576106206105fb565b500490565b6000816000190483118215151615610639576106396105fb565b500290565b60008261064d5761064d6105fb565b500690565b60006001600160a01b038084168385168086851681871087851681881087851681891088851681895b8692509050898252885189525087518852865187529485528452835183529082529181015b90506001936001600160801b031990920191505b60007f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f8252600020905090565b6000807f0000000000000000000000000000000000000000000000000000000000000000831461076e576000915050610738565b83610777816107a4565b9250906001600160801b031682600090815260086020908152604080832093909355918152600e909152205490505b50915091565b60008082126107b257506000610738565b506001600160801b03166007021690565b6000806107cf83836107a4565b90506107da81610845565b91505b50919050565b6000826107f2576107f26105fb565b500790565b60008160001904831182151516156108115761081161054a565b500290565b6000821982111561082957610829610595565b500190565b60008282101561084057610840610595565b500390565b6000806108518361085f565b915091505b9250929050565b600080610868610877565b91509150915091565b6000610853826108b7565b600080604080518082019091529050565b6000610899836108a6565b9392505050565b6000806108ac8361070d565b915050915091565b60008060006108c28461088e565b905060006108cf8561093c565b905060006108dc86610984565b9150509250925092565b60006108f18261098c565b915050919050565b6000600160ff1b821415610581576105816105fb565b9695505050505050565b60008061092583610851565b915091509250929050565b600061073882610a00565b6000610738826109a8565b60006107388261099a565b60006109618261096b565b6000610968826109d4565b92915050565b60006109798261083f565b6000610984836109a6565b505050565b60006109948261099e565b50505050565b60006109a88261055b565b92915050565b6000610738826109bc565b600061099e826009021090565b600060016109c9836109d2565b6109a891906102fa565b600060016109e1836109f0565b6109eb9190610816565b600060016109f883610a08565b6109eb9190610830565b6000610738826002021090565b600061073882600a021090"

interface DeployPlatformVaultRequest {
  ownerAddress?: string;
  initialReceiver?: string;
  force?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🏦 Platform Vault Deployment Request')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const body: DeployPlatformVaultRequest = await req.json()
    const { ownerAddress, initialReceiver, force = false } = body

    console.log('📋 Request parameters:', { ownerAddress, initialReceiver, force })

    // Check if vault already exists
    const { data: treasuryConfig, error: configError } = await supabase
      .from('treasury_config')
      .select('*')
      .eq('network', 'testnet')
      .eq('is_active', true)
      .single()

    if (configError) {
      console.error('❌ Error fetching treasury config:', configError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch treasury configuration'
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (treasuryConfig?.platform_vault_address && !force) {
      console.log('✅ Platform vault already deployed:', treasuryConfig.platform_vault_address)
      return new Response(JSON.stringify({
        success: true,
        vaultAddress: treasuryConfig.platform_vault_address,
        message: 'Vault already deployed',
        existing: true
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Setup blockchain clients
    const privateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY')
    if (!privateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY not found')
    }

    const rpcUrl = Deno.env.get('PRIMARY_RPC_URL') || 'https://sepolia.base.org'
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl)
    })

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl)
    })

    console.log('🔧 Blockchain clients configured')
    console.log(`  - Deployer: ${account.address}`)
    console.log(`  - RPC: ${rpcUrl}`)

    // Determine deployment parameters
    const vaultOwner = ownerAddress || account.address
    const vaultReceiver = initialReceiver || treasuryConfig.treasury_address || '0x23d03610584B0f0988A6F9C281a37094D5611388'

    console.log('📦 Platform Vault Deployment Parameters:')
    console.log(`  - Owner: ${vaultOwner}`)
    console.log(`  - Initial Receiver: ${vaultReceiver}`)

    // Deploy platform vault contract
    console.log('🚀 Deploying PlatformVault contract...')
    
    const deployHash = await walletClient.deployContract({
      abi: PLATFORM_VAULT_ABI,
      bytecode: PLATFORM_VAULT_BYTECODE as `0x${string}`,
      args: [vaultOwner as `0x${string}`, vaultReceiver as `0x${string}`],
    })

    console.log(`📋 Deployment transaction: ${deployHash}`)

    // Wait for deployment receipt
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: deployHash,
      timeout: 60000
    })

    if (receipt.status !== 'success') {
      throw new Error('Contract deployment failed')
    }

    const vaultAddress = receipt.contractAddress
    if (!vaultAddress) {
      throw new Error('Contract address not found in receipt')
    }

    console.log(`✅ PlatformVault deployed at: ${vaultAddress}`)
    console.log(`  - Block: ${receipt.blockNumber}`)
    console.log(`  - Gas Used: ${receipt.gasUsed}`)

    // Update treasury configuration with vault address
    const { error: updateError } = await supabase
      .from('treasury_config')
      .update({
        platform_vault_address: vaultAddress,
        vault_deploy_tx: deployHash,
        vault_deployed_at: new Date().toISOString(),
        vault_notes: `Deployed with owner: ${vaultOwner}, receiver: ${vaultReceiver}`
      })
      .eq('id', treasuryConfig.id)

    if (updateError) {
      console.error('❌ Error updating treasury config:', updateError)
      // Don't fail deployment - just log the error
    } else {
      console.log('✅ Treasury configuration updated with vault address')
    }

    return new Response(JSON.stringify({
      success: true,
      vaultAddress,
      transactionHash: deployHash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      owner: vaultOwner,
      initialReceiver: vaultReceiver,
      network: 'base-sepolia'
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Platform vault deployment failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})