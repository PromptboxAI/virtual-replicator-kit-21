import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { createPublicClient, http } from 'https://esm.sh/viem@2.31.7'
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains'

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
    const { transactionHash } = await req.json();
    
    if (!transactionHash) {
      throw new Error('Transaction hash is required');
    }

    console.log('🔍 Verifying deployment transaction:', transactionHash);

    // Create viem client for Base Sepolia
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    // Get transaction details
    const transaction = await publicClient.getTransaction({
      hash: transactionHash as `0x${string}`
    });

    console.log('📋 Transaction details:', {
      hash: transaction.hash,
      to: transaction.to,
      blockNumber: transaction.blockNumber,
      input: transaction.input?.slice(0, 100) + '...' // Just first 100 chars
    });

    // Get transaction receipt to find contract address
    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`
    });

    console.log('📄 Transaction receipt:', {
      status: receipt.status,
      contractAddress: receipt.contractAddress,
      gasUsed: receipt.gasUsed.toString(),
      logs: receipt.logs.length
    });

    if (!receipt.contractAddress) {
      throw new Error('No contract address found in transaction receipt');
    }

    // Check if transaction was successful
    if (receipt.status !== 'success') {
      throw new Error(`Transaction failed with status: ${receipt.status}`);
    }

    // Verify the contract exists at the deployed address
    const bytecode = await publicClient.getBytecode({
      address: receipt.contractAddress
    });

    const hasContract = bytecode && bytecode !== '0x';
    
    console.log('✅ Contract verification:', {
      address: receipt.contractAddress,
      hasBytecode: hasContract,
      bytecodeLength: bytecode?.length
    });

    // Update the database with the correct contract address if needed
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if we need to update the database
    const { data: existingContract } = await supabase
      .from('deployed_contracts')
      .select('contract_address')
      .eq('contract_type', 'factory')
      .eq('network', 'base_sepolia')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let databaseUpdated = false;
    if (existingContract?.contract_address !== receipt.contractAddress) {
      console.log('🔄 Updating database with correct contract address...');
      
      // Deactivate old contracts
      await supabase
        .from('deployed_contracts')
        .update({ is_active: false })
        .eq('contract_type', 'factory')
        .eq('network', 'base_sepolia');

      // Insert the correct contract address
      const { error: insertError } = await supabase
        .from('deployed_contracts')
        .insert({
          contract_address: receipt.contractAddress,
          contract_type: 'factory',
          network: 'base_sepolia',
          version: 'v2',
          name: 'AgentTokenFactory',
          symbol: 'FACTORY',
          is_active: true
        });

      if (insertError) {
        console.error('❌ Database update failed:', insertError);
      } else {
        databaseUpdated = true;
        console.log('✅ Database updated with correct contract address');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction: {
          hash: transaction.hash,
          blockNumber: transaction.blockNumber?.toString(),
          status: receipt.status
        },
        contract: {
          address: receipt.contractAddress,
          hasBytecode: hasContract,
          bytecodeLength: bytecode?.length
        },
        database: {
          previousAddress: existingContract?.contract_address,
          currentAddress: receipt.contractAddress,
          updated: databaseUpdated
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Verification failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});