const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Testing V2 deployment function...')
    
    // Test 1: Check if DEPLOYER_PRIVATE_KEY exists
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY')
    if (!deployerPrivateKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'DEPLOYER_PRIVATE_KEY not found',
          step: 'env_check'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }
    
    console.log('✅ DEPLOYER_PRIVATE_KEY found')
    console.log('Key length:', deployerPrivateKey.length)
    console.log('Starts with 0x:', deployerPrivateKey.startsWith('0x'))

    // Test 2: Try viem imports
    console.log('Testing viem imports...')
    try {
      const { createPublicClient, createWalletClient, http } = await import('npm:viem')
      const { privateKeyToAccount } = await import('npm:viem/accounts')
      const { baseSepolia } = await import('npm:viem/chains')
      console.log('✅ Viem imports successful')
      
      // Test 3: Try creating account
      console.log('Testing account creation...')
      const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`)
      console.log('✅ Account created:', account.address)
      
      // Test 4: Try creating clients
      console.log('Testing client creation...')
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      })
      
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
      })
      console.log('✅ Clients created successfully')
      
      // Test 5: Check network connectivity and balance
      console.log('Testing network connectivity...')
      const blockNumber = await publicClient.getBlockNumber()
      console.log('✅ Current block:', blockNumber.toString())
      
      const balance = await publicClient.getBalance({ address: account.address })
      console.log('✅ Account balance:', balance.toString(), 'wei')
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All V2 deployment tests passed',
          data: {
            deployerAddress: account.address,
            balance: balance.toString(),
            blockNumber: blockNumber.toString(),
            keyConfigured: true
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
      
    } catch (importError) {
      console.error('Import/setup error:', importError)
      return new Response(
        JSON.stringify({
          success: false,
          error: importError.message,
          step: 'viem_setup',
          stack: importError.stack
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

  } catch (error) {
    console.error('Test error:', error)
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