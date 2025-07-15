const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Test deploy function called');
    
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    console.log('Private key exists:', !!deployerPrivateKey);
    console.log('Private key length:', deployerPrivateKey?.length || 0);
    
    if (!deployerPrivateKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'DEPLOYER_PRIVATE_KEY not configured',
          step: 'env_check'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Test basic viem imports
    console.log('Testing viem imports...');
    const { createPublicClient, http } = await import('npm:viem');
    const { baseSepolia } = await import('npm:viem/chains');
    console.log('Viem imports successful');

    // Test client creation
    console.log('Testing client creation...');
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });
    console.log('Public client created successfully');

    // Test network connection
    console.log('Testing network connection...');
    const blockNumber = await publicClient.getBlockNumber();
    console.log('Current block number:', blockNumber.toString());

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'All tests passed',
        blockNumber: blockNumber.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Test deploy error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        stack: error.stack,
        step: 'execution'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});