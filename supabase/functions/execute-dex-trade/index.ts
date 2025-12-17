import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther, 
  formatUnits,
  encodeFunctionData,
  decodeEventLog
} from 'https://esm.sh/viem@2.7.0';
import { baseSepolia, base } from 'https://esm.sh/viem@2.7.0/chains';
import { privateKeyToAccount } from 'https://esm.sh/viem@2.7.0/accounts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uniswap V3 SwapRouter02 addresses
const UNISWAP_SWAP_ROUTER: Record<number, string> = {
  84532: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4', // Base Sepolia SwapRouter02
  8453: '0x2626664c2603336E57B271c5C0b26F421741e481',  // Base Mainnet SwapRouter02
};

// ERC20 ABI for approvals
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// SwapRouter02 ABI for exactInputSingle
const SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ],
        name: 'params',
        type: 'tuple'
      }
    ],
    name: 'exactInputSingle',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  }
] as const;

interface DEXTradeRequest {
  agentId: string;
  userId: string;
  tradeType: 'buy' | 'sell';
  promptAmount?: number;
  tokenAmount?: number;
  slippage?: number;
  minOutputAmount?: string;
  poolFee?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const {
      agentId,
      userId,
      tradeType,
      promptAmount = 0,
      tokenAmount = 0,
      slippage = 0.5,
      minOutputAmount,
      poolFee = 3000, // Default 0.3% fee tier
    }: DEXTradeRequest = await req.json();

    console.log(`🔄 DEX Trade Request: ${tradeType} for graduated agent ${agentId}`);

    // Validate required parameters
    if (!agentId || !userId || !tradeType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: agentId, userId, tradeType' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const inputAmount = tradeType === 'buy' ? promptAmount : tokenAmount;
    if (!inputAmount || inputAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid trade amount' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get agent data with graduation info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*, agent_graduation_events!agents_graduation_event_id_fkey(*)')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ success: false, error: `Agent not found: ${agentError?.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Verify agent is graduated
    if (!agent.token_graduated || !agent.token_address) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Agent has not graduated yet - use bonding curve trading',
          graduated: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // MEV Protection: Check if user can trade
    const { data: canTradeResult, error: canTradeError } = await supabase.rpc(
      'can_trade_agent',
      { p_agent_id: agentId, p_user_id: userId }
    );

    if (canTradeError || !canTradeResult) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: canTradeError?.message || 'Trading is temporarily locked for this agent. Only the creator can trade during MEV protection period.',
          locked: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Get PROMPT token address
    const { data: promptContract } = await supabase
      .from('deployed_contracts')
      .select('contract_address')
      .eq('contract_type', 'PROMPT')
      .eq('is_active', true)
      .single();

    const PROMPT_TOKEN = promptContract?.contract_address;
    const AGENT_TOKEN = agent.token_address;

    if (!PROMPT_TOKEN || !AGENT_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token addresses not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Determine trade parameters
    const tokenIn = tradeType === 'buy' ? PROMPT_TOKEN : AGENT_TOKEN;
    const tokenOut = tradeType === 'buy' ? AGENT_TOKEN : PROMPT_TOKEN;
    const amountIn = parseEther(inputAmount.toString());

    // Get chain configuration
    const chainId = agent.chain_id || 84532;
    const chain = chainId === 8453 ? base : baseSepolia;
    const rpcUrl = chainId === 8453 
      ? 'https://mainnet.base.org' 
      : 'https://sepolia.base.org';

    // Get deployer key for server-side execution
    const deployerKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
    
    if (!deployerKey) {
      // If no deployer key, return transaction data for client-side signing
      console.log('📝 No deployer key - returning transaction data for client signing');
      
      const swapRouterAddress = UNISWAP_SWAP_ROUTER[chainId];
      if (!swapRouterAddress) {
        return new Response(
          JSON.stringify({ success: false, error: `Uniswap not supported on chain ${chainId}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Calculate minimum output with slippage
      const estimatedOutput = parseEther((inputAmount * 0.95).toString()); // Rough estimate
      const minOutput = minOutputAmount 
        ? BigInt(minOutputAmount)
        : BigInt(Math.floor(Number(estimatedOutput) * (1 - slippage / 100)));

      // Encode swap transaction
      const swapData = encodeFunctionData({
        abi: SWAP_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [{
          tokenIn: tokenIn as `0x${string}`,
          tokenOut: tokenOut as `0x${string}`,
          fee: poolFee,
          recipient: userId as `0x${string}`,
          amountIn,
          amountOutMinimum: minOutput,
          sqrtPriceLimitX96: BigInt(0),
        }],
      });

      // Encode approval transaction
      const approvalData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [swapRouterAddress as `0x${string}`, amountIn],
      });

      return new Response(
        JSON.stringify({
          success: true,
          requiresClientSigning: true,
          transactions: [
            {
              step: 'approve',
              to: tokenIn,
              data: approvalData,
              value: '0',
              description: `Approve ${inputAmount} ${tradeType === 'buy' ? 'PROMPT' : agent.symbol} for swap`,
            },
            {
              step: 'swap',
              to: swapRouterAddress,
              data: swapData,
              value: '0',
              description: `Swap ${inputAmount} ${tradeType === 'buy' ? 'PROMPT' : agent.symbol} for ${tradeType === 'buy' ? agent.symbol : 'PROMPT'}`,
            }
          ],
          quote: {
            amountIn: amountIn.toString(),
            minAmountOut: minOutput.toString(),
            slippage,
            poolFee,
            tokenIn,
            tokenOut,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Server-side execution with deployer key
    console.log('🔐 Executing server-side swap with deployer key');

    const account = privateKeyToAccount(deployerKey as `0x${string}`);
    
    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    const swapRouterAddress = UNISWAP_SWAP_ROUTER[chainId];
    if (!swapRouterAddress) {
      return new Response(
        JSON.stringify({ success: false, error: `Uniswap not supported on chain ${chainId}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 1: Check and set approval if needed
    console.log('🔍 Checking token allowance...');
    
    const currentAllowance = await publicClient.readContract({
      address: tokenIn as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account.address, swapRouterAddress as `0x${string}`],
    });

    let approvalTxHash: string | null = null;

    if (currentAllowance < amountIn) {
      console.log('📝 Approving tokens for swap...');
      
      const approvalHash = await walletClient.writeContract({
        address: tokenIn as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [swapRouterAddress as `0x${string}`, amountIn * BigInt(2)], // Approve 2x for future trades
      });

      console.log(`✅ Approval tx: ${approvalHash}`);
      approvalTxHash = approvalHash;

      // Wait for approval confirmation
      await publicClient.waitForTransactionReceipt({ hash: approvalHash });
    }

    // Step 2: Calculate minimum output
    const estimatedOutput = parseEther((inputAmount * (agent.current_price || 0.95)).toString());
    const minOutput = minOutputAmount 
      ? BigInt(minOutputAmount)
      : BigInt(Math.floor(Number(estimatedOutput) * (1 - slippage / 100)));

    // Step 3: Execute swap
    console.log('🔄 Executing swap...');
    
    const swapHash = await walletClient.writeContract({
      address: swapRouterAddress as `0x${string}`,
      abi: SWAP_ROUTER_ABI,
      functionName: 'exactInputSingle',
      args: [{
        tokenIn: tokenIn as `0x${string}`,
        tokenOut: tokenOut as `0x${string}`,
        fee: poolFee,
        recipient: userId as `0x${string}`, // Send to user's wallet
        amountIn,
        amountOutMinimum: minOutput,
        sqrtPriceLimitX96: BigInt(0),
      }],
    });

    console.log(`✅ Swap tx: ${swapHash}`);

    // Wait for swap confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: swapHash });

    // Parse output amount from logs (Transfer event)
    let actualOutput = minOutput; // Fallback
    try {
      // Find Transfer event to tokenOut recipient
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === tokenOut.toLowerCase()) {
          // Simple Transfer event parsing
          if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
            actualOutput = BigInt(log.data);
            break;
          }
        }
      }
    } catch (err) {
      console.warn('Could not parse output amount from logs:', err);
    }

    // Calculate executed price
    const outputAmountNum = parseFloat(formatUnits(actualOutput, 18));
    const executedPrice = tradeType === 'buy' 
      ? inputAmount / outputAmountNum 
      : outputAmountNum / inputAmount;

    // Log the DEX trade to database
    const { error: logError } = await supabase
      .from('dex_trades')
      .insert({
        agent_id: agentId,
        user_id: userId,
        trade_type: tradeType,
        src_token: tokenIn,
        dst_token: tokenOut,
        src_amount: amountIn.toString(),
        dst_amount: actualOutput.toString(),
        transaction_hash: swapHash,
        executed_price: executedPrice,
        slippage_percent: slippage,
        aggregator_used: false,
        block_number: Number(receipt.blockNumber),
        gas_used: receipt.gasUsed.toString(),
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
      });

    if (logError) {
      console.warn('Failed to log DEX trade:', logError);
    }

    // Update user balances in database
    await updateBalances(supabase, agentId, userId, tradeType, inputAmount, outputAmountNum);

    // Get block explorer URL
    const explorerUrl = chainId === 8453
      ? `https://basescan.org/tx/${swapHash}`
      : `https://sepolia.basescan.org/tx/${swapHash}`;

    console.log(`✅ DEX trade completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        transactionHash: swapHash,
        approvalTxHash,
        srcAmount: amountIn.toString(),
        srcAmountFormatted: inputAmount.toString(),
        dstAmount: actualOutput.toString(),
        dstAmountFormatted: formatUnits(actualOutput, 18),
        executedPrice,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: Number(receipt.blockNumber),
        explorerUrl,
        status: receipt.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ DEX trade execution failed:', error);
    
    // Check for common Uniswap errors
    let errorMessage = error.message;
    if (error.message?.includes('STF')) {
      errorMessage = 'Swap failed: Insufficient liquidity or slippage too low';
    } else if (error.message?.includes('TF')) {
      errorMessage = 'Transfer failed: Check token balance and approvals';
    } else if (error.message?.includes('SPL')) {
      errorMessage = 'Price limit exceeded: Try a smaller trade or higher slippage';
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper to update user balances after trade
async function updateBalances(
  supabase: any,
  agentId: string,
  userId: string,
  tradeType: 'buy' | 'sell',
  inputAmount: number,
  outputAmount: number
) {
  try {
    if (tradeType === 'buy') {
      // User spent PROMPT, received agent tokens
      // Update PROMPT balance
      const { data: balance } = await supabase
        .from('user_token_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (balance) {
        await supabase
          .from('user_token_balances')
          .update({ balance: Math.max(0, balance.balance - inputAmount) })
          .eq('user_id', userId);
      }

      // Update agent token holdings
      const { data: holding } = await supabase
        .from('agent_token_holders')
        .select('token_balance')
        .eq('agent_id', agentId)
        .eq('user_id', userId)
        .single();

      await supabase
        .from('agent_token_holders')
        .upsert({
          agent_id: agentId,
          user_id: userId,
          token_balance: (holding?.token_balance || 0) + outputAmount,
        });

    } else {
      // User spent agent tokens, received PROMPT
      // Update PROMPT balance
      const { data: balance } = await supabase
        .from('user_token_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (balance) {
        await supabase
          .from('user_token_balances')
          .update({ balance: balance.balance + outputAmount })
          .eq('user_id', userId);
      }

      // Update agent token holdings
      const { data: holding } = await supabase
        .from('agent_token_holders')
        .select('token_balance')
        .eq('agent_id', agentId)
        .eq('user_id', userId)
        .single();

      if (holding) {
        await supabase
          .from('agent_token_holders')
          .update({ token_balance: Math.max(0, holding.token_balance - inputAmount) })
          .eq('agent_id', agentId)
          .eq('user_id', userId);
      }
    }
  } catch (err) {
    console.warn('Failed to update balances:', err);
  }
}
