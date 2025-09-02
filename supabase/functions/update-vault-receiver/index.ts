import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createPublicClient, createWalletClient, http } from 'https://esm.sh/viem@2.31.7'
import { privateKeyToAccount } from 'https://esm.sh/viem@2.31.7/accounts'
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLATFORM_VAULT_ABI = [
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
    "inputs": [{"internalType": "address", "name": "newReceiver", "type": "address"}],
    "name": "getPendingReceiverChange",
    "outputs": [{"internalType": "uint256", "name": "executeTime", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newReceiver", "type": "address"}],
    "name": "canExecuteReceiverChange",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "receiver",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

interface UpdateVaultReceiverRequest {
  newReceiver: string;
  action: 'initiate' | 'execute' | 'status';
  vaultAddress?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Vault Receiver Update Request')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const body: UpdateVaultReceiverRequest = await req.json()
    const { newReceiver, action, vaultAddress: providedVaultAddress } = body

    console.log('📋 Request parameters:', { newReceiver, action, providedVaultAddress })

    // Get vault address from treasury config if not provided
    let vaultAddress = providedVaultAddress
    if (!vaultAddress) {
      const { data: treasuryConfig, error: configError } = await supabase
        .from('treasury_config')
        .select('platform_vault_address')
        .eq('network', 'testnet')
        .eq('is_active', true)
        .single()

      if (configError || !treasuryConfig?.platform_vault_address) {
        throw new Error('Platform vault not found in treasury config')
      }

      vaultAddress = treasuryConfig.platform_vault_address
    }

    console.log(`🏦 Using vault address: ${vaultAddress}`)

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

    if (action === 'status') {
      // Get current receiver and pending changes
      const [currentReceiver, pendingTime, canExecute] = await Promise.all([
        publicClient.readContract({
          address: vaultAddress as `0x${string}`,
          abi: PLATFORM_VAULT_ABI,
          functionName: 'receiver'
        }),
        publicClient.readContract({
          address: vaultAddress as `0x${string}`,
          abi: PLATFORM_VAULT_ABI,
          functionName: 'getPendingReceiverChange',
          args: [newReceiver as `0x${string}`]
        }),
        publicClient.readContract({
          address: vaultAddress as `0x${string}`,
          abi: PLATFORM_VAULT_ABI,
          functionName: 'canExecuteReceiverChange',
          args: [newReceiver as `0x${string}`]
        })
      ])

      const pendingTimestamp = Number(pendingTime)
      const executeTime = pendingTimestamp > 0 ? new Date(pendingTimestamp * 1000).toISOString() : null

      return new Response(JSON.stringify({
        success: true,
        currentReceiver,
        pendingReceiver: pendingTimestamp > 0 ? newReceiver : null,
        executeTime,
        canExecute,
        timeRemaining: pendingTimestamp > 0 ? Math.max(0, pendingTimestamp - Math.floor(Date.now() / 1000)) : 0
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'initiate') {
      console.log(`🚀 Initiating receiver change to: ${newReceiver}`)
      
      const txHash = await walletClient.writeContract({
        address: vaultAddress as `0x${string}`,
        abi: PLATFORM_VAULT_ABI,
        functionName: 'initiateReceiverChange',
        args: [newReceiver as `0x${string}`]
      })

      console.log(`📋 Transaction hash: ${txHash}`)

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: txHash,
        timeout: 60000
      })

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed')
      }

      console.log('✅ Receiver change initiated - 48 hour timelock active')

      return new Response(JSON.stringify({
        success: true,
        transactionHash: txHash,
        blockNumber: receipt.blockNumber.toString(),
        message: 'Receiver change initiated - executable in 48 hours',
        executeAfter: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'execute') {
      console.log(`🎯 Executing receiver change to: ${newReceiver}`)
      
      // Check if change can be executed
      const canExecute = await publicClient.readContract({
        address: vaultAddress as `0x${string}`,
        abi: PLATFORM_VAULT_ABI,
        functionName: 'canExecuteReceiverChange',
        args: [newReceiver as `0x${string}`]
      })

      if (!canExecute) {
        throw new Error('Receiver change cannot be executed yet - timelock still active')
      }

      const txHash = await walletClient.writeContract({
        address: vaultAddress as `0x${string}`,
        abi: PLATFORM_VAULT_ABI,
        functionName: 'executeReceiverChange',
        args: [newReceiver as `0x${string}`]
      })

      console.log(`📋 Transaction hash: ${txHash}`)

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: txHash,
        timeout: 60000
      })

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed')
      }

      console.log('✅ Receiver change executed successfully')

      return new Response(JSON.stringify({
        success: true,
        transactionHash: txHash,
        blockNumber: receipt.blockNumber.toString(),
        newReceiver,
        message: 'Receiver change executed successfully'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error(`Invalid action: ${action}`)

  } catch (error) {
    console.error('❌ Vault receiver update failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})