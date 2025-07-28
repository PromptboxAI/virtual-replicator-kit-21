const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🚀 test-basic-deploy function called');
  
  if (req.method === 'OPTIONS') {
    console.log('📋 Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📊 Starting test execution...');
  const logs = [];

  try {
    logs.push('Starting test...');
    console.log('✅ Test started successfully');

    // Test 1: Check environment
    const privateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    logs.push(`Private key exists: ${!!privateKey}`);
    console.log(`Private key exists: ${!!privateKey}`);
    
    if (privateKey) {
      logs.push(`Key length: ${privateKey.length}`);
      logs.push(`Key starts with 0x: ${privateKey.startsWith('0x')}`);
      console.log(`Key length: ${privateKey.length}, starts with 0x: ${privateKey.startsWith('0x')}`);
    }

    // Test 2: Try to import viem (this might be where it fails)
    logs.push('Attempting to import viem...');
    console.log('Attempting to import viem...');
    
    try {
      const viem = await import('npm:viem');
      logs.push('✅ Viem imported successfully');
      console.log('✅ Viem imported successfully');
      
      const { privateKeyToAccount } = await import('npm:viem/accounts');
      logs.push('✅ Viem accounts imported successfully');
      console.log('✅ Viem accounts imported successfully');
      
      if (privateKey) {
        const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        console.log('Creating account with formatted key...');
        
        const account = privateKeyToAccount(formattedKey as `0x${string}`);
        logs.push(`✅ Account created: ${account.address}`);
        console.log(`✅ Account created: ${account.address}`);
        
        return new Response(
          JSON.stringify({
            success: true,
            logs,
            account: account.address,
            ready: true,
            message: 'All tests passed!'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (viemError: any) {
      logs.push(`❌ Viem import failed: ${viemError.message}`);
      console.error('❌ Viem import failed:', viemError);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Viem import failed: ${viemError.message}`,
          logs
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    throw new Error('No private key found');

  } catch (error: any) {
    logs.push(`❌ Error: ${error.message}`);
    console.error('❌ Function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        logs,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});