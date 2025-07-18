import { createPublicClient, http } from 'npm:viem'
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
    console.log('Starting debug checks...');
    
    const deployerPrivateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    
    if (!deployerPrivateKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'DEPLOYER_PRIVATE_KEY not found in environment',
          step: 'env_check'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Private key found, length:', deployerPrivateKey.length);
    console.log('Private key starts with 0x:', deployerPrivateKey.startsWith('0x'));

    let account;
    try {
      account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
      console.log('Account created successfully:', account.address);
    } catch (accountError) {
      console.error('Account creation failed:', accountError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Account creation failed: ${accountError.message}`,
          step: 'account_creation',
          privateKeyLength: deployerPrivateKey.length,
          hasPrefix: deployerPrivateKey.startsWith('0x')
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    console.log('Checking balance...');
    let balance;
    try {
      balance = await publicClient.getBalance({ address: account.address });
      console.log('Balance check successful:', balance.toString());
    } catch (balanceError) {
      console.error('Balance check failed:', balanceError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Balance check failed: ${balanceError.message}`,
          step: 'balance_check',
          accountAddress: account.address
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        accountAddress: account.address,
        balance: balance.toString(),
        balanceETH: (Number(balance) / 1e18).toString(),
        privateKeyLength: deployerPrivateKey.length,
        hasPrefix: deployerPrivateKey.startsWith('0x'),
        step: 'all_checks_passed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Debug error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        step: 'unknown_error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});