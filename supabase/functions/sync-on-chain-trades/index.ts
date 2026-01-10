/**
 * Sync On-Chain Trades Edge Function
 * 
 * Phase 6: Trade Event Listener
 * Listens for BondingCurveV8 Trade events and syncs to database for OHLC generation.
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

// Trade event from BondingCurveV8
const tradeEvent = parseAbiItem(
  'event Trade(bytes32 indexed agentId, address indexed trader, bool isBuy, uint256 promptAmountGross, uint256 promptAmountNet, uint256 tokenAmount, uint256 fee, uint256 price, uint256 supplyAfter, uint256 reserveAfter, uint256 timestamp)'
);

// Convert bytes32 back to UUID
function bytes32ToUuid(bytes32: string): string {
  // Remove 0x prefix and padding
  const hex = bytes32.slice(2).replace(/^0+/, '');
  // Reconstruct UUID format
  if (hex.length < 32) {
    // It might be a shortened hex, try to interpret it
    return hex;
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
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

    const BONDING_CURVE_V8 = Deno.env.get('BONDING_CURVE_V8_ADDRESS') || '0xc511a151b0E04D5Ba87968900eE90d310530D5fB';
    const RPC_URL = Deno.env.get('BASE_SEPOLIA_RPC') || 'https://sepolia.base.org';

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    // Parse request
    let fromBlock: bigint | undefined;
    let toBlock: bigint | 'latest' = 'latest';
    let agentIdFilter: string | undefined;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        fromBlock = body.fromBlock ? BigInt(body.fromBlock) : undefined;
        toBlock = body.toBlock ? BigInt(body.toBlock) : 'latest';
        agentIdFilter = body.agentId;
      } catch {
        // Use defaults
      }
    }

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
        : 0n;
    }

    console.log(`Syncing trades from block ${fromBlock} to ${toBlock}`);

    // Fetch Trade events
    const logs = await publicClient.getLogs({
      address: BONDING_CURVE_V8 as Address,
      event: tradeEvent,
      fromBlock,
      toBlock,
    });

    console.log(`Found ${logs.length} trade events`);

    const tradesToInsert: any[] = [];
    const agentUpdates: Map<string, { supply: bigint; reserve: bigint }> = new Map();

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

      // Skip if filtering by agentId and doesn't match
      const agentIdRaw = agentIdBytes32 as string;
      
      // Try to find matching agent
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .or(`id.eq.${bytes32ToUuid(agentIdRaw)}`)
        .single();

      if (!agent) {
        console.log(`No agent found for bytes32: ${agentIdRaw}`);
        continue;
      }

      if (agentIdFilter && agent.id !== agentIdFilter) {
        continue;
      }

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
        console.error('Error inserting trades:', insertError);
      }
    }

    // Update agent states
    for (const [agentId, state] of agentUpdates) {
      const { error: updateError } = await supabase
        .from('agents')
        .update({
          on_chain_supply: Number(formatEther(state.supply)),
          on_chain_reserve: Number(formatEther(state.reserve)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentId);

      if (updateError) {
        console.error(`Error updating agent ${agentId}:`, updateError);
      }
    }

    const currentBlock = await publicClient.getBlockNumber();

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          tradesProcessed: tradesToInsert.length,
          agentsUpdated: agentUpdates.size,
          fromBlock: fromBlock.toString(),
          toBlock: toBlock === 'latest' ? currentBlock.toString() : toBlock.toString(),
          currentBlock: currentBlock.toString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
