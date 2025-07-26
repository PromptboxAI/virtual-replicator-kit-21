import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🧪 Testing V2 deployment function...')
    
    const results = {
      environment: {
        hasPrivateKey: false,
        privateKeyCheck: null,
        supabaseUrl: null,
        supabaseKey: null
      },
      viem: {
        importSuccess: false,
        accountCreation: null,
        publicClientCreation: null,
        walletClientCreation: null,
        networkConnectivity: null
      },
      blockchain: {
        blockNumber: null,
        balance: null
      },
      promptToken: {
        exists: false,
        address: null,
        error: null
      }
    };

    // Test 1: Environment Variables
    console.log('📋 Testing environment variables...')
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY')
    results.environment.hasPrivateKey = !!deployerPrivateKey
    results.environment.privateKeyCheck = deployerPrivateKey ? 'Present' : 'Missing'
    results.environment.supabaseUrl = Deno.env.get('SUPABASE_URL') ? 'Present' : 'Missing'
    results.environment.supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Present' : 'Missing'

    if (!deployerPrivateKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'DEPLOYER_PRIVATE_KEY not found',
          results
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('✅ Environment variables check passed')

    // Test 2: Check for PROMPT token in database
    console.log('🪙 Checking for PROMPT token...')
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { data: promptToken, error: promptError } = await supabase
        .from('deployed_contracts')
        .select('contract_address')
        .eq('contract_type', 'prompt_token')
        .eq('is_active', true)
        .single()

      if (promptError || !promptToken) {
        results.promptToken.error = 'No PROMPT token found in database'
        console.log('⚠️ No PROMPT token found in database')
      } else {
        results.promptToken.exists = true
        results.promptToken.address = promptToken.contract_address
        console.log(`✅ PROMPT token found: ${promptToken.contract_address}`)
      }
    } catch (dbError) {
      results.promptToken.error = `Database error: ${dbError}`
      console.error('❌ Database check failed:', dbError)
    }

    // Test 3: Viem Library Import and Usage
    console.log('📦 Testing viem imports and setup...')
    try {
      const { createPublicClient, createWalletClient, http } = await import('npm:viem')
      const { privateKeyToAccount } = await import('npm:viem/accounts')
      const { baseSepolia } = await import('npm:viem/chains')
      console.log('✅ Viem imports successful')
      
      // Test account creation
      const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`)
      results.viem.accountCreation = `Success - Address: ${account.address}`
      console.log(`✅ Account created: ${account.address}`)

      // Test public client
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      })
      results.viem.publicClientCreation = 'Success'
      console.log('✅ Public client created')

      // Test wallet client
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
      })
      results.viem.walletClientCreation = 'Success'
      console.log('✅ Wallet client created')

      results.viem.importSuccess = true

      // Test 4: Network Connectivity
      console.log('🌐 Testing network connectivity...')
      try {
        const blockNumber = await publicClient.getBlockNumber()
        results.blockchain.blockNumber = Number(blockNumber)
        console.log(`✅ Current block number: ${blockNumber}`)

        const balance = await publicClient.getBalance({
          address: account.address
        })
        results.blockchain.balance = balance.toString()
        console.log(`✅ Account balance: ${balance} wei`)

        results.viem.networkConnectivity = 'Success'
      } catch (networkError) {
        console.error('❌ Network connectivity test failed:', networkError)
        results.viem.networkConnectivity = `Failed: ${networkError}`
      }

    } catch (viemError) {
      console.error('❌ Viem library test failed:', viemError)
      results.viem.importSuccess = false
      return new Response(
        JSON.stringify({
          success: false,
          error: `Viem library test failed: ${viemError}`,
          results
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    const allTestsPassed = results.environment.hasPrivateKey && 
                          results.viem.importSuccess && 
                          results.viem.networkConnectivity === 'Success'

    console.log(`🎯 V2 deployment test summary: ${allTestsPassed ? 'READY' : 'NOT READY'}`)

    return new Response(
      JSON.stringify({
        success: allTestsPassed,
        message: allTestsPassed ? 'V2 deployment system is ready' : 'V2 deployment system has issues',
        readyForDeployment: allTestsPassed && results.promptToken.exists,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ V2 deployment test failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        step: 'general_error',
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})