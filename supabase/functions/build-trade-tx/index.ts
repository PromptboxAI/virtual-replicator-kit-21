import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { encodeFunctionData, parseEther } from 'npm:viem@2.31.7';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Load frozen ABI from repo
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

interface BuildTxRequest {
  agentId: string;
  tradeType: 'buy' | 'sell';
  amount: number;
  userAddress: string;
}

interface TxParams {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  from: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const { agentId, tradeType, amount, userAddress }: BuildTxRequest = await req.json();

    console.log('🔨 Building transaction:', { agentId, tradeType, amount, userAddress });

    // Validate inputs
    if (!agentId || !tradeType || !amount || !userAddress) {
      throw new Error('Missing required parameters: agentId, tradeType, amount, userAddress');
    }

    if (!['buy', 'sell'].includes(tradeType)) {
      throw new Error('Invalid trade type. Must be "buy" or "sell"');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch agent's token contract address from deployed_contracts
    const { data: contractData, error: contractError } = await supabase
      .from('deployed_contracts')
      .select('contract_address')
      .eq('agent_id', agentId)
      .eq('contract_type', 'agent_token')
      .eq('is_active', true)
      .single();

    if (contractError || !contractData) {
      throw new Error(`No active contract found for agent ${agentId}: ${contractError?.message}`);
    }

    const tokenAddress = contractData.contract_address;
    console.log('📍 Token contract address:', tokenAddress);

    // Build transaction based on trade type
    let txParams: TxParams;

    if (tradeType === 'buy') {
      // For buy: encode transfer() function
      // In a real bonding curve, this would call a buy() function instead
      const amountInWei = parseEther(amount.toString());
      
      const data = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'transfer',
        args: [userAddress as `0x${string}`, amountInWei]
      });

      txParams = {
        to: tokenAddress,
        data,
        value: '0', // No ETH sent for ERC20 transfer
        gasLimit: '100000', // Standard ERC20 transfer gas
        from: userAddress
      };

    } else {
      // For sell: encode approve() function
      // User must approve the bonding curve contract to spend their tokens
      const amountInWei = parseEther(amount.toString());
      
      const data = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'approve',
        args: [tokenAddress as `0x${string}`, amountInWei] // Approve the token contract itself as spender
      });

      txParams = {
        to: tokenAddress,
        data,
        value: '0',
        gasLimit: '60000', // Standard ERC20 approve gas
        from: userAddress
      };
    }

    console.log('✅ Transaction built successfully');
    console.log('TX Params:', {
      to: txParams.to,
      dataPreview: txParams.data.slice(0, 66) + '...',
      value: txParams.value,
      gasLimit: txParams.gasLimit,
      from: txParams.from
    });

    return new Response(
      JSON.stringify({
        ok: true,
        apiVersion: 'v1',
        data: {
          transaction: txParams,
          tokenAddress,
          tradeType,
          amount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error building transaction:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        apiVersion: 'v1',
        error: error.message || 'Failed to build transaction',
        code: 'TRANSACTION_BUILD_FAILED',
        details: { stack: error.stack }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
