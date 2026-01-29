/**
 * Sync On-Chain Trades Edge Function
 * 
 * Phase 6: Trade Event Listener
 * Listens for BondingCurveV8 Trade events and syncs to database for OHLC generation.
 * 
 * Features:
 * - Handles RPC block range limits (max 100k blocks per query)
 * - Updates current_price and circulating_supply from on-chain state
 * - Calculates price from bonding curve formula if no trades
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  createPublicClient, 
  http, 
  parseAbiItem, 
  formatEther,
  type Address 
} from 'https://esm.sh/viem@2.31.7';
import { baseSepolia } from 'https://esm.sh/viem@2.31.7/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple RPC endpoints for redundancy - try primary first, then fallbacks
const RPC_ENDPOINTS = [
  Deno.env.get('BASE_SEPOLIA_RPC') || 'https://sepolia.base.org',
  'https://base-sepolia.blockpi.network/v1/rpc/public',
  'https://base-sepolia-rpc.publicnode.com',
];

// Helper to create client with fallback RPCs (for initial connection test)
async function createClientWithFallback(chain: typeof baseSepolia): Promise<ReturnType<typeof createPublicClient>> {
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    const rpcUrl = RPC_ENDPOINTS[i];
    try {
      const client = createPublicClient({
        chain,
        transport: http(rpcUrl, { timeout: 15000 }),
      });
      // Test the connection with a simple call
      await client.getBlockNumber();
      console.log(`[sync-trades] Connected to RPC: ${rpcUrl}`);
      return client;
    } catch (error) {
      console.warn(`[sync-trades] RPC ${rpcUrl} failed (${i + 1}/${RPC_ENDPOINTS.length}):`, error.message);
      if (i === RPC_ENDPOINTS.length - 1) {
        throw new Error(`All ${RPC_ENDPOINTS.length} RPC endpoints failed. Last error: ${error.message}`);
      }
    }
  }
  throw new Error('No RPC endpoints available');
}

// Helper for retrying RPC operations with fallback endpoints
async function withRpcRetry<T>(
  operation: (client: ReturnType<typeof createPublicClient>) => Promise<T>,
  chain: typeof baseSepolia
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    const rpcUrl = RPC_ENDPOINTS[i];
    try {
      const client = createPublicClient({
        chain,
        transport: http(rpcUrl, { timeout: 15000 }),
      });
      return await operation(client);
    } catch (error: any) {
      lastError = error;
      console.warn(`[sync-trades] RPC operation failed on ${rpcUrl} (${i + 1}/${RPC_ENDPOINTS.length}):`, error.message);
      if (i < RPC_ENDPOINTS.length - 1) {
        console.log(`[sync-trades] Retrying with next RPC endpoint...`);
      }
    }
  }
  
  throw lastError || new Error('All RPC endpoints exhausted');
}

// V8 Constants
const V8_CONFIG = {
  BONDING_CURVE: '0xc511a151b0E04D5Ba87968900eE90d310530D5fB',
  P0: 0.00004,   // Starting price
  P1: 0.0003,    // Graduation price
  TOTAL_SUPPLY: 1_000_000_000,
  GRADUATION_THRESHOLD: 42160,
  MAX_BLOCK_RANGE: 50000, // RPC limit is 100k, use 50k for safety
};

// Trade event from BondingCurveV8
const tradeEvent = parseAbiItem(
  'event Trade(bytes32 indexed agentId, address indexed trader, bool isBuy, uint256 promptAmountGross, uint256 promptAmountNet, uint256 tokenAmount, uint256 fee, uint256 price, uint256 supplyAfter, uint256 reserveAfter, uint256 timestamp)'
);

// getAgentState function ABI for reading on-chain state - CORRECT 7-output ABI
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

// Convert bytes32 back to UUID
function bytes32ToUuid(bytes32: string): string {
  const hex = bytes32.slice(2).replace(/^0+/, '');
  if (hex.length < 32) return hex;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// UUID to bytes32
function uuidToBytes32(uuid: string): `0x${string}` {
  const hex = uuid.replace(/-/g, '');
  return `0x${hex.padStart(64, '0')}` as `0x${string}`;
}

// Calculate price from bonding curve formula
// Price = P0 + (P1 - P0) * (supply / totalSupply)
function calculatePriceFromSupply(supply: number): number {
  const ratio = supply / V8_CONFIG.TOTAL_SUPPLY;
  return V8_CONFIG.P0 + (V8_CONFIG.P1 - V8_CONFIG.P0) * ratio;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const BONDING_CURVE_V8 = Deno.env.get('BONDING_CURVE_V8_ADDRESS') || V8_CONFIG.BONDING_CURVE;
    
    // Create client with automatic RPC fallback
    const publicClient = await createClientWithFallback(baseSepolia);

    // Parse request
    let fromBlock: bigint | undefined;
    let toBlock: bigint | 'latest' = 'latest';
    let agentIdFilter: string | undefined;
    let syncStateOnly = false; // New: just sync on-chain state without trade events

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        fromBlock = body.fromBlock ? BigInt(body.fromBlock) : undefined;
        toBlock = body.toBlock ? BigInt(body.toBlock) : 'latest';
        agentIdFilter = body.agentId;
        syncStateOnly = body.syncStateOnly === true;
      } catch {
        // Use defaults
      }
    }

    const currentBlock = await publicClient.getBlockNumber();

    // If syncStateOnly mode, just read on-chain state and update database
    if (syncStateOnly && agentIdFilter) {
      console.log(`[sync-state] Syncing on-chain state for agent ${agentIdFilter}`);
      
      const agentIdBytes32 = uuidToBytes32(agentIdFilter);
      
      try {
        // First get agent details to know the creator wallet and prototype token
        const { data: agentDetails } = await supabase
          .from('agents')
          .select('creator_wallet_address, prototype_token_address')
          .eq('id', agentIdFilter)
          .single();

        // CRITICAL: Index holder balances FIRST to ensure fresh data
        if (agentDetails?.prototype_token_address) {
          try {
            console.log(`[sync-state] Calling index-prototype-events for agent ${agentIdFilter}`);
            const indexResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/index-prototype-events`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  agentId: agentIdFilter,
                  prototypeTokenAddress: agentDetails.prototype_token_address,
                  maxBlocks: 10000,
                }),
              }
            );
            if (indexResponse.ok) {
              const indexResult = await indexResponse.json();
              console.log(`[sync-state] Indexer result:`, indexResult);
            } else {
              console.warn(`[sync-state] Indexer failed: ${indexResponse.status}`);
            }
          } catch (indexError) {
            console.warn(`[sync-state] Error calling indexer:`, indexError);
          }
        }

        const result = await withRpcRetry(
          (client) => client.readContract({
            address: BONDING_CURVE_V8 as Address,
            abi: getAgentStateAbi,
            functionName: 'getAgentState',
            args: [agentIdBytes32],
          }),
          baseSepolia
        );

        // Destructure 7 values: [prototypeToken, creator, tokensSold, promptReserve, currentPrice, graduationProgress, graduated]
        const [prototypeToken, creator, supply, reserve, currentPrice, graduationProgress, graduated] = result;
        
        const supplyNum = Number(formatEther(supply));
        const reserveNum = Number(formatEther(reserve));
        const priceNum = Number(formatEther(currentPrice));

        console.log(`[sync-state] On-chain state:`, { supply: supplyNum, reserve: reserveNum, price: priceNum, graduationProgress: formatEther(graduationProgress), graduated });

        // Fix 5: Count token_holders from indexed_holder_balances
        let tokenHoldersCount = 0;
        try {
          const { count } = await supabase
            .from('indexed_holder_balances')
            .select('*', { count: 'exact', head: true })
            .eq('agent_id', agentIdFilter)
            .gt('token_balance', 0);
          tokenHoldersCount = count || 0;
          console.log(`[sync-state] Token holders count: ${tokenHoldersCount}`);
        } catch (countError) {
          console.warn(`[sync-state] Error counting holders:`, countError);
        }

        // Fix 5: Calculate dev_ownership_pct from creator's balance
        let devOwnershipPct = 0;
        if (agentDetails?.creator_wallet_address && supplyNum > 0) {
          try {
            const { data: creatorBalance } = await supabase
              .from('indexed_holder_balances')
              .select('token_balance')
              .eq('agent_id', agentIdFilter)
              .eq('wallet_address', agentDetails.creator_wallet_address.toLowerCase())
              .single();
            
            if (creatorBalance?.token_balance) {
              devOwnershipPct = (creatorBalance.token_balance / supplyNum) * 100;
              console.log(`[sync-state] Dev ownership: ${devOwnershipPct.toFixed(4)}%`);
            }
          } catch (devError) {
            console.warn(`[sync-state] Error calculating dev ownership:`, devError);
          }
        }

        // Update agent with on-chain state + token_holders + dev_ownership_pct
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            on_chain_supply: supplyNum,
            on_chain_reserve: reserveNum,
            on_chain_price: priceNum,
            current_price: priceNum,
            circulating_supply: Math.floor(supplyNum),
            prompt_raised: reserveNum,
            bonding_curve_supply: supplyNum,
            shares_sold: supplyNum,
            token_holders: tokenHoldersCount,
            dev_ownership_pct: devOwnershipPct,
            updated_at: new Date().toISOString(),
          })
          .eq('id', agentIdFilter);

        if (updateError) {
          console.error(`[sync-state] Update error:`, updateError);
          throw updateError;
        }

        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              agentId: agentIdFilter,
              onChainState: { supply: supplyNum, reserve: reserveNum, price: priceNum, graduated },
              tokenHolders: tokenHoldersCount,
              devOwnershipPct: devOwnershipPct,
              currentBlock: currentBlock.toString(),
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (stateError: any) {
        console.error(`[sync-state] Error reading on-chain state:`, stateError);
        return new Response(
          JSON.stringify({ ok: false, error: stateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Standard trade sync mode
    // If no fromBlock specified, get last synced block
    if (!fromBlock) {
      const { data: lastTrade } = await supabase
        .from('on_chain_trades')
        .select('block_number')
        .order('block_number', { ascending: false })
        .limit(1)
        .single();

      fromBlock = lastTrade?.block_number 
        ? BigInt(lastTrade.block_number) + 1n 
        : currentBlock - BigInt(V8_CONFIG.MAX_BLOCK_RANGE); // Only look back MAX_BLOCK_RANGE blocks by default
    }

    // Resolve toBlock if 'latest'
    const resolvedToBlock = toBlock === 'latest' ? currentBlock : toBlock;

    // Ensure we don't exceed max block range
    let actualFromBlock = fromBlock;
    if (resolvedToBlock - actualFromBlock > BigInt(V8_CONFIG.MAX_BLOCK_RANGE)) {
      actualFromBlock = resolvedToBlock - BigInt(V8_CONFIG.MAX_BLOCK_RANGE);
      console.log(`[sync-trades] Block range limited to ${V8_CONFIG.MAX_BLOCK_RANGE} blocks`);
    }

    console.log(`[sync-trades] Syncing trades from block ${actualFromBlock} to ${resolvedToBlock}`);

    // Fetch Trade events with RPC retry
    const logs = await withRpcRetry(
      (client) => client.getLogs({
        address: BONDING_CURVE_V8 as Address,
        event: tradeEvent,
        fromBlock: actualFromBlock,
        toBlock: resolvedToBlock,
      }),
      baseSepolia
    );

    console.log(`[sync-trades] Found ${logs.length} trade events`);

    const tradesToInsert: any[] = [];
    const agentUpdates: Map<string, { supply: bigint; reserve: bigint; price: number }> = new Map();

    for (const log of logs) {
      const {
        agentId: agentIdBytes32,
        trader,
        isBuy,
        promptAmountGross,
        promptAmountNet,
        tokenAmount,
        fee,
        price,
        supplyAfter,
        reserveAfter,
      } = log.args;

      const agentIdRaw = agentIdBytes32 as string;
      
      // Try to find matching agent
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .or(`id.eq.${bytes32ToUuid(agentIdRaw)}`)
        .single();

      if (!agent) {
        console.log(`[sync-trades] No agent found for bytes32: ${agentIdRaw}`);
        continue;
      }

      if (agentIdFilter && agent.id !== agentIdFilter) {
        continue;
      }

      const supplyNum = Number(formatEther(supplyAfter as bigint));
      const calculatedPrice = calculatePriceFromSupply(supplyNum);

      tradesToInsert.push({
        agent_id: agent.id,
        transaction_hash: log.transactionHash,
        block_number: Number(log.blockNumber),
        trader_address: (trader as string).toLowerCase(),
        is_buy: isBuy,
        prompt_amount_gross: formatEther(promptAmountGross as bigint),
        prompt_amount_net: formatEther(promptAmountNet as bigint),
        token_amount: formatEther(tokenAmount as bigint),
        fee: formatEther(fee as bigint),
        price: formatEther(price as bigint),
        supply_after: formatEther(supplyAfter as bigint),
        reserve_after: formatEther(reserveAfter as bigint),
      });

      // Track latest state per agent
      agentUpdates.set(agent.id, {
        supply: supplyAfter as bigint,
        reserve: reserveAfter as bigint,
        price: calculatedPrice,
      });
    }

    // Insert trades (ignore duplicates)
    if (tradesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('on_chain_trades')
        .upsert(tradesToInsert, { 
          onConflict: 'transaction_hash',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error('[sync-trades] Error inserting trades:', insertError);
      }
    }

    // Update agent states with all relevant fields
    for (const [agentId, state] of agentUpdates) {
      const supply = Number(formatEther(state.supply));
      const reserve = Number(formatEther(state.reserve));
      
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          on_chain_supply: supply,
          on_chain_reserve: reserve,
          on_chain_price: state.price,
          current_price: state.price,
          circulating_supply: Math.floor(supply),
          prompt_raised: reserve,
          bonding_curve_supply: supply,
          shares_sold: supply,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentId);

      if (updateError) {
        console.error(`[sync-trades] Error updating agent ${agentId}:`, updateError);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          tradesProcessed: tradesToInsert.length,
          agentsUpdated: agentUpdates.size,
          fromBlock: actualFromBlock.toString(),
          toBlock: resolvedToBlock.toString(),
          currentBlock: currentBlock.toString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[sync-trades] Sync error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
