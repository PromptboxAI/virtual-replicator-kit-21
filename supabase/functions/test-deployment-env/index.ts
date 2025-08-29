import { createPublicClient, createWalletClient, http } from 'npm:viem'
import { baseSepolia } from 'npm:viem/chains'
import { privateKeyToAccount } from 'npm:viem/accounts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Testing deployment environment...');
    
    // Check environment variables
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const results = {
      deployerPrivateKey: deployerPrivateKey ? 'Present' : 'Missing',
      supabaseUrl: supabaseUrl ? 'Present' : 'Missing',
      supabaseKey: supabaseKey ? 'Present' : 'Missing',
      accountAddress: null as string | null,
      balance: null as string | null,
      blockNumber: null as string | null,
      error: null as string | null
    };

    if (!deployerPrivateKey) {
      results.error = 'DEPLOYER_PRIVATE_KEY is missing';
      return new Response(
        JSON.stringify({ success: false, results }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Test account creation
    try {
      const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
      results.accountAddress = account.address;
      console.log('Account created successfully:', account.address);
    } catch (error: any) {
      results.error = `Failed to create account: ${error.message}`;
      return new Response(
        JSON.stringify({ success: false, results }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Test public client
    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      });

      const blockNumber = await publicClient.getBlockNumber();
      results.blockNumber = blockNumber.toString();
      console.log('Current block number:', blockNumber);

      if (results.accountAddress) {
        const balance = await publicClient.getBalance({ 
          address: results.accountAddress as `0x${string}` 
        });
        results.balance = balance.toString();
        console.log('Account balance:', balance.toString());
      }
    } catch (error: any) {
      results.error = `Network connection error: ${error.message}`;
      return new Response(
        JSON.stringify({ success: false, results }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: 'Deployment environment is properly configured'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Environment test error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});