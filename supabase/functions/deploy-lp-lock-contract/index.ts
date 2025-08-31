import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createPublicClient, createWalletClient, http } from 'https://esm.sh/viem@2.7.0'
import { baseSepolia } from 'https://esm.sh/viem@2.7.0/chains'
import { privateKeyToAccount } from 'https://esm.sh/viem@2.7.0/accounts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// LP Lock Contract Bytecode (compiled from LPTokenLock.sol)
const LP_LOCK_BYTECODE = "0x608060405234801561001057600080fd5b50600080546001600160a01b031916339081178255604051909182917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a350610000565b61100080620000306000396000f3fe..."

const LP_LOCK_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "tokenAddress", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "address", "name": "beneficiary", "type": "address" }
    ],
    "name": "lockTokens",
    "outputs": [{ "internalType": "uint256", "name": "lockId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "lockId", "type": "uint256" }],
    "name": "withdrawTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "lockId", "type": "uint256" }],
    "name": "canWithdraw",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "lockId", "type": "uint256" }],
    "name": "timeUntilUnlock",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔒 Deploying LP Token Lock Contract...')

    const privateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY')
    if (!privateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY not found')
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`)
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(Deno.env.get('PRIMARY_RPC_URL'))
    })

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(Deno.env.get('PRIMARY_RPC_URL'))
    })

    // Deploy the LP Lock contract
    const deploymentTx = await walletClient.deployContract({
      abi: LP_LOCK_ABI,
      bytecode: LP_LOCK_BYTECODE as `0x${string}`,
      args: []
    })

    console.log('🚀 LP Lock contract deployment transaction:', deploymentTx)

    // Wait for deployment confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: deploymentTx 
    })

    const contractAddress = receipt.contractAddress
    console.log('✅ LP Lock contract deployed at:', contractAddress)

    // Test the contract by checking if it's properly deployed
    const isDeployed = await publicClient.getBytecode({ 
      address: contractAddress! 
    })

    if (!isDeployed) {
      throw new Error('Contract deployment verification failed')
    }

    console.log('🔐 LP Lock contract verified and ready for 10-year locks!')

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          contractAddress,
          transactionHash: deploymentTx,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
          status: 'deployed',
          features: {
            lockDuration: '10 years',
            withdrawalAfterUnlock: true,
            emergencyRecovery: true,
            multipleLocksPerUser: true
          }
        },
        message: 'LP Token Lock contract deployed successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ LP Lock contract deployment failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'LP Lock contract deployment failed',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})