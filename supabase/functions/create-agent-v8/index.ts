import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from "https://esm.sh/viem@2.7.0";
import { privateKeyToAccount } from "https://esm.sh/viem@2.7.0/accounts";
import { baseSepolia } from "https://esm.sh/viem@2.7.0/chains";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// V8 CONSTANTS - SINGLE SOURCE OF TRUTH
// Based on original V7 economic model for LP ratios and market cap calculations
// ============================================================================
const V8_CONFIG = {
  // Contract Addresses (Base Sepolia)
  AGENT_FACTORY: '0xe8214F54e4a670A92B8A6Fc2Da1DB70b091A4a79',
  BONDING_CURVE: '0xc511a151b0E04D5Ba87968900eE90d310530D5fB',
  TRADING_ROUTER: '0xce81D37B4f2855Ce1081D172dF7013b8beAE79B0',
  GRADUATION_MANAGER: '0x3c6878857FB1d1a1155b016A4b904c479395B2D9',
  PROMPT_TOKEN: '0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673',

  // Pricing Constants - ORIGINAL V7 ECONOMIC MODEL
  // P0 = 0.00004 PROMPT per token (starting price)
  // P1 = 0.0003 PROMPT per token (graduation price)
  P0: '0.00004',           // Starting price (NOT 0.00001)
  P1: '0.0003',            // Graduation price (NOT 0.0000000001)

  // Graduation
  GRADUATION_THRESHOLD: 42160,  // PROMPT required to graduate

  // Fees
  TRADING_FEE_BPS: 50,     // 0.5%

  // Token Supply
  TOTAL_SUPPLY: 1000000000, // 1 billion tokens

  // Chain
  CHAIN_ID: 84532,         // Base Sepolia
  RPC_URL: 'https://sepolia.base.org',
} as const;

// ============================================================================
// ABIs
// ============================================================================
const AGENT_FACTORY_ABI = [
  {
    name: 'createAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'creator', type: 'address' }
    ],
    outputs: [{ name: 'prototypeToken', type: 'address' }]
  }
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

const BONDING_CURVE_ABI = [
  {
    name: 'buy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'promptAmount', type: 'uint256' },
      { name: 'minTokensOut', type: 'uint256' }
    ],
    outputs: [{ name: 'tokensBought', type: 'uint256' }]
  }
] as const;

// ============================================================================
// HELPERS
// ============================================================================

// UUID to bytes32 - MUST use padStart (not padEnd)
function uuidToBytes32(uuid: string): `0x${string}` {
  const hex = uuid.replace(/-/g, '');
  return `0x${hex.padStart(64, '0')}` as `0x${string}`;
}

// ============================================================================
// V8 AGENT DEPLOYMENT
// ============================================================================

interface DeploymentResult {
  txHash: string;
  prototypeTokenAddress: string;
  blockNumber: number;
  timestamp: string;
}

async function deployV8Agent(
  agentId: string,
  name: string,
  symbol: string,
  creatorWallet: string
): Promise<DeploymentResult> {
  const privateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
  if (!privateKey) throw new Error('DEPLOYER_PRIVATE_KEY not set');

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const rpcUrl = Deno.env.get('BASE_SEPOLIA_RPC') || V8_CONFIG.RPC_URL;

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const agentIdBytes32 = uuidToBytes32(agentId);

  console.log('[V8] Deploying agent:', { agentId, name, symbol, creatorWallet });

  // Deploy prototype token via AgentFactoryV8
  const txHash = await walletClient.writeContract({
    address: V8_CONFIG.AGENT_FACTORY as `0x${string}`,
    abi: AGENT_FACTORY_ABI,
    functionName: 'createAgent',
    args: [
      agentIdBytes32,
      name,
      symbol,
      creatorWallet as `0x${string}`,
    ],
  });

  console.log('[V8] Waiting for tx:', txHash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });

  // Extract prototype token address from event logs
  // AgentCreated event: topics[0]=eventSig, topics[1]=agentId, topics[2]=prototypeToken
  const factoryLowercase = V8_CONFIG.AGENT_FACTORY.toLowerCase();
  const agentCreatedLog = receipt.logs.find(log =>
    log.address.toLowerCase() === factoryLowercase && log.topics.length >= 3
  );

  if (!agentCreatedLog || !agentCreatedLog.topics[2]) {
    throw new Error('AgentCreated event not found in transaction receipt');
  }

  // Topics[2] is the indexed prototypeToken address (padded to 32 bytes)
  const prototypeTokenAddress = `0x${agentCreatedLog.topics[2].slice(-40)}`;

  console.log('[V8] Deployment successful:', {
    txHash,
    prototypeTokenAddress,
    blockNumber: Number(receipt.blockNumber)
  });

  return {
    txHash,
    prototypeTokenAddress,
    blockNumber: Number(receipt.blockNumber),
    timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
  };
}

async function executeV8Prebuy(
  agentId: string,
  prebuyAmountWei: bigint
): Promise<string> {
  const privateKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
  if (!privateKey) throw new Error('DEPLOYER_PRIVATE_KEY not set');

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const rpcUrl = Deno.env.get('BASE_SEPOLIA_RPC') || V8_CONFIG.RPC_URL;

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const agentIdBytes32 = uuidToBytes32(agentId);

  console.log('[V8] Executing prebuy:', { agentId, amount: formatEther(prebuyAmountWei) });

  // 1. Approve PROMPT for BondingCurve
  const approveTx = await walletClient.writeContract({
    address: V8_CONFIG.PROMPT_TOKEN as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [V8_CONFIG.BONDING_CURVE as `0x${string}`, prebuyAmountWei],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveTx });

  // 2. Execute buy on BondingCurve
  const minTokensOut = 0n; // Accept any amount for prebuy
  const buyTx = await walletClient.writeContract({
    address: V8_CONFIG.BONDING_CURVE as `0x${string}`,
    abi: BONDING_CURVE_ABI,
    functionName: 'buy',
    args: [agentIdBytes32, prebuyAmountWei, minTokensOut],
  });

  await publicClient.waitForTransactionReceipt({ hash: buyTx });

  console.log('[V8] Prebuy successful:', buyTx);

  return buyTx;
}

// ============================================================================
// V8 AGENT VALIDATION
// ============================================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateV8AgentInput(input: any): ValidationResult {
  const errors: string[] = [];

  if (!input.name || input.name.trim() === '') {
    errors.push('name is required');
  }
  if (!input.symbol || input.symbol.trim() === '') {
    errors.push('symbol is required');
  }
  if (!input.creator_wallet_address) {
    errors.push('creator_wallet_address is required');
  }

  // Validate no debug text in description/pitch
  const debugPatterns = ['console.log', 'TODO', 'FIXME', 'undefined'];
  for (const pattern of debugPatterns) {
    if (input.description?.includes(pattern)) {
      errors.push(`description contains debug text: '${pattern}'`);
    }
    if (input.project_pitch?.includes(pattern)) {
      errors.push(`project_pitch contains debug text: '${pattern}'`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const {
      name,
      symbol,
      description,
      category,
      framework = 'PROMPT',
      avatar_url,
      website_url,
      twitter_url,
      project_pitch,
      creator_id,
      creator_wallet_address,
      prebuy_amount,
      test_mode = true,
    } = body;

    // Validate input
    const validation = validateV8AgentInput({
      name,
      symbol,
      creator_wallet_address,
      description,
      project_pitch
    });

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: `Validation failed: ${validation.errors.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check symbol uniqueness
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (existingAgent) {
      return new Response(
        JSON.stringify({ error: 'Symbol already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get PROMPT/USD FX rate
    const { data: fxData } = await supabase
      .from('prompt_fx')
      .select('fx_rate_usd')
      .order('asof', { ascending: false })
      .limit(1)
      .single();

    const currentPromptUsdRate = fxData?.fx_rate_usd || '0.10';

    // Generate agent ID
    const agentId = crypto.randomUUID();

    console.log('[V8] Creating agent:', { agentId, name, symbol });

    // Deploy on-chain first
    let deploymentResult: DeploymentResult;
    try {
      deploymentResult = await deployV8Agent(
        agentId,
        name,
        symbol.toUpperCase(),
        creator_wallet_address
      );
    } catch (deployError: any) {
      console.error('[V8] Deployment failed:', deployError);
      return new Response(
        JSON.stringify({ error: `On-chain deployment failed: ${deployError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create V8 agent record with ALL correct fields
    const v8Agent = {
      // Basic Info
      id: agentId,
      name: name,
      symbol: symbol.toUpperCase(),
      description: description || null,
      category: category || null,
      avatar_url: avatar_url || null,
      website_url: website_url || null,
      twitter_url: twitter_url || null,
      project_pitch: project_pitch || null,

      // Creator Info
      creator_id: creator_id || null,
      creator_wallet_address: creator_wallet_address,
      creator_prebuy_amount: prebuy_amount || '0',

      // ========================================
      // V8 FLAGS - ALL REQUIRED
      // ========================================
      is_v8: true,                                          // MUST be true
      creation_mode: 'smart_contract',                      // MUST be smart_contract
      graduation_threshold: V8_CONFIG.GRADUATION_THRESHOLD, // 42160
      pricing_model: 'bonding_curve_v8',                    // NOT linear_v7
      graduation_mode: 'smart_contract',                     // on-chain V8 mode

      // V8 Pricing Constants - ORIGINAL V7 ECONOMIC MODEL
      created_p0: V8_CONFIG.P0,                             // '0.00004'
      created_p1: V8_CONFIG.P1,                             // '0.0003'
      prompt_usd_rate: currentPromptUsdRate,
      created_prompt_usd_rate: currentPromptUsdRate,

      // On-Chain Deployment Data
      prototype_token_address: deploymentResult.prototypeTokenAddress.toLowerCase(),
      token_address: deploymentResult.prototypeTokenAddress.toLowerCase(),
      token_contract_address: deploymentResult.prototypeTokenAddress.toLowerCase(),
      deployment_tx_hash: deploymentResult.txHash,
      deployment_status: 'deployed',
      deployment_method: 'factory',
      deployment_verified: false,
      deployed_at: deploymentResult.timestamp,
      block_number: deploymentResult.blockNumber,

      // Chain Info
      chain_id: V8_CONFIG.CHAIN_ID,
      network_environment: 'testnet',

      // Initial On-Chain State (Zero until trades)
      on_chain_supply: '0',
      on_chain_reserve: '0',
      on_chain_price: V8_CONFIG.P0,

      // Database Trading Fields - Zero for V8
      bonding_curve_supply: '0',
      circulating_supply: 0,
      shares_sold: '0',
      prompt_raised: '0',
      current_price: V8_CONFIG.P0,
      market_cap: '0',
      market_cap_usd: '0',
      token_holders: 0,
      volume_24h: '0',
      price_change_24h: '0',

      // Graduation State
      token_graduated: false,
      graduation_phase: 'not_started',
      graduated_at: null,
      graduation_event_id: null,
      airdrop_batches_completed: 0,
      airdrop_batches_total: 0,
      snapshot_block_number: null,
      snapshot_hash: null,
      final_token_address: null,
      lp_pair_address: null,

      // Token Supply
      total_supply: V8_CONFIG.TOTAL_SUPPLY,

      // Status
      status: 'ACTIVE',
      is_active: true,
      bonding_curve_phase: 'active',

      // Other
      framework: framework,
      test_mode: test_mode,
      creation_cost: '100',
      dev_ownership_pct: '0',
    };

    // Insert agent
    const { data: insertedAgent, error: insertError } = await supabase
      .from('agents')
      .insert(v8Agent)
      .select()
      .single();

    if (insertError) {
      console.error('[V8] Database insert failed:', insertError);
      return new Response(
        JSON.stringify({ error: `Database insert failed: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute prebuy if specified
    let prebuyTxHash: string | null = null;
    if (prebuy_amount && parseFloat(prebuy_amount) > 0) {
      try {
        const prebuyWei = parseEther(prebuy_amount.toString());
        prebuyTxHash = await executeV8Prebuy(agentId, prebuyWei);

        console.log('[V8] Prebuy executed, syncing on-chain state...');

        // Read on-chain state after prebuy
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(Deno.env.get('BASE_SEPOLIA_RPC') || V8_CONFIG.RPC_URL),
        });

        const agentIdBytes32 = uuidToBytes32(agentId);
        
        // Read getAgentState from BondingCurve - CORRECT 7-output ABI
        const getAgentStateAbi = [{
          name: 'getAgentState',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'agentId', type: 'bytes32' }],
          outputs: [
            { name: 'prototypeToken', type: 'address' },
            { name: 'creator', type: 'address' },           // V8 contract returns 7 values
            { name: 'tokensSold', type: 'uint256' },
            { name: 'promptReserve', type: 'uint256' },
            { name: 'currentPrice', type: 'uint256' },
            { name: 'graduationProgress', type: 'uint256' },
            { name: 'graduated', type: 'bool' }
          ]
        }] as const;

        const result = await publicClient.readContract({
          address: V8_CONFIG.BONDING_CURVE as `0x${string}`,
          abi: getAgentStateAbi,
          functionName: 'getAgentState',
          args: [agentIdBytes32],
        });

        // Destructure 7 values: [prototypeToken, creator, tokensSold, promptReserve, currentPrice, graduationProgress, graduated]
        const [, , supplyWei, reserveWei, currentPriceWei] = result;
        const supply = Number(formatEther(supplyWei));
        const reserve = Number(formatEther(reserveWei));
        const price = Number(formatEther(currentPriceWei));

        console.log('[V8] Post-prebuy state:', { supply, reserve, price });

        // Update agent with prebuy info AND on-chain state
        await supabase
          .from('agents')
          .update({ 
            creator_prebuy_amount: prebuy_amount.toString(),
            on_chain_supply: supply,
            on_chain_reserve: reserve,
            on_chain_price: price,
            current_price: price,
            circulating_supply: Math.floor(supply),
            prompt_raised: reserve,
            bonding_curve_supply: supply,
            shares_sold: supply,
            token_holders: 1, // Creator is first holder
          })
          .eq('id', agentId);
      } catch (prebuyError: any) {
        console.error('[V8] Prebuy failed:', prebuyError);
        // Continue - agent was created successfully
      }
    }

    // CRITICAL: Sync on-chain state to database after deployment/prebuy
    // This ensures trades and metrics are captured immediately, not waiting for the cron indexer
    try {
      console.log('[V8] Triggering sync-on-chain-trades for new agent...');
      const syncResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-on-chain-trades`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId: agentId,
            syncStateOnly: true, // Read on-chain state and update DB
          }),
        }
      );
      
      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        console.log('[V8] Sync completed:', syncResult);
      } else {
        console.warn('[V8] Sync failed with status:', syncResponse.status);
      }
    } catch (syncError) {
      console.warn('[V8] Sync-on-chain-trades error (non-blocking):', syncError);
      // Non-blocking - agent creation still succeeded
    }

    // Initialize runtime status
    await supabase
      .from('agent_runtime_status')
      .insert({
        agent_id: agentId,
        is_active: false,
        current_goal: `Awaiting AI configuration for ${name}`,
        performance_metrics: {},
        revenue_generated: 0,
        tasks_completed: 0
      });

    console.log('[V8] Agent created successfully:', agentId);

    return new Response(
      JSON.stringify({
        success: true,
        agent: insertedAgent,
        deployment: {
          txHash: deploymentResult.txHash,
          prototypeTokenAddress: deploymentResult.prototypeTokenAddress,
          blockNumber: deploymentResult.blockNumber,
        },
        prebuyTxHash,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[V8] Error in create-agent-v8:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
