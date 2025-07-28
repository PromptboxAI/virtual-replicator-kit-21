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
    if (privateKey) {
      logs.push(`Key length: ${privateKey.length}`);
      logs.push(`Key starts with 0x: ${privateKey.startsWith('0x')}`);
    }

    // Test 2: Import viem
    logs.push('Importing viem...');
    const { createWalletClient, createPublicClient, http } = await import('npm:viem');
    const { baseSepolia } = await import('npm:viem/chains');
    const { privateKeyToAccount } = await import('npm:viem/accounts');
    logs.push('Viem imported successfully');

    // Test 3: Create account
    if (privateKey) {
      logs.push('Creating account...');
      const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      const account = privateKeyToAccount(formattedKey as `0x${string}`);
      logs.push(`Account created: ${account.address}`);

      // Test 4: Create client
      logs.push('Creating client...');
      const client = createPublicClient({
        chain: baseSepolia,
        transport: http('https://base-sepolia.g.alchemy.com/v2/demo')
      });
      logs.push('Client created');

      // Test 5: Get balance
      logs.push('Fetching balance...');
      const balance = await client.getBalance({ address: account.address });
      logs.push(`Balance: ${(Number(balance) / 1e18).toFixed(6)} ETH`);

      // Test 6: Simple deployment
      logs.push('Creating wallet client...');
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http('https://base-sepolia.g.alchemy.com/v2/demo')
      });

      // Just return success without actually deploying
      return new Response(
        JSON.stringify({
          success: true,
          logs,
          account: account.address,
          balance: (Number(balance) / 1e18).toFixed(6) + ' ETH',
          ready: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('No private key found');

  } catch (error: any) {
    logs.push(`Error: ${error.message}`);
    logs.push(`Stack: ${error.stack}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        logs
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});