const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Testing DEPLOYER_PRIVATE_KEY access...')
    
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY')
    
    if (!deployerPrivateKey) {
      console.error('DEPLOYER_PRIVATE_KEY not found in environment')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'DEPLOYER_PRIVATE_KEY not configured',
          hasKey: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Log that we have the key (but don't log the actual key for security)
    console.log('DEPLOYER_PRIVATE_KEY found!')
    console.log('Key length:', deployerPrivateKey.length)
    console.log('Key starts with 0x:', deployerPrivateKey.startsWith('0x'))
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'DEPLOYER_PRIVATE_KEY is configured correctly',
        hasKey: true,
        keyLength: deployerPrivateKey.length,
        startsWithHex: deployerPrivateKey.startsWith('0x')
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        hasKey: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})