import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createPublicClient, http, formatEther, parseAbiItem } from "https://esm.sh/viem@2.7.0";
import { baseSepolia } from "https://esm.sh/viem@2.7.0/chains";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V8 Contract Addresses
const BONDING_CURVE_V8 = Deno.env.get('BONDING_CURVE_V8_ADDRESS') || '0xc511a151b0E04D5Ba87968900eE90d310530D5fB';
const AGENT_FACTORY_V8 = Deno.env.get('AGENT_FACTORY_V8_ADDRESS') || '0xe8214F54e4a670A92B8A6Fc2Da1DB70b091A4a79';
const BASE_SEPOLIA_RPC = Deno.env.get('BASE_SEPOLIA_RPC') || 'https://sepolia.base.org';

// Max block range per RPC call to avoid timeouts
const MAX_BLOCK_RANGE = 50000n;

// Event ABIs using viem's parseAbiItem
const AGENT_CREATED_EVENT = parseAbiItem(
  'event AgentCreated(bytes32 indexed agentId, address indexed prototypeToken, address indexed creator, string name, string symbol, uint256 timestamp)'
);

const TRADE_EVENT = parseAbiItem(
  'event Trade(bytes32 indexed agentId, address indexed trader, bool isBuy, uint256 promptAmountGross, uint256 promptAmountNet, uint256 tokenAmount, uint256 fee, uint256 price, uint256 supplyAfter, uint256 reserveAfter, uint256 timestamp)'
);

const GRADUATION_TRIGGERED_EVENT = parseAbiItem(
  'event GraduationTriggered(bytes32 indexed agentId, uint256 finalSupply, uint256 finalReserve, uint256 timestamp)'
);

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
);

// Convert bytes32 to UUID
function bytes32ToUuid(bytes32: string): string {
  const hex = bytes32.slice(2, 34); // Remove 0x and take first 32 chars
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
}

// Helper to fetch logs in chunks to avoid RPC limits
async function getLogsInChunks<T>(
  publicClient: ReturnType<typeof createPublicClient>,
  params: {
    address: `0x${string}`;
    event: any;
    fromBlock: bigint;
    toBlock: bigint;
  }
): Promise<T[]> {
  const allLogs: T[] = [];
  let currentFrom = params.fromBlock;
  
  while (currentFrom <= params.toBlock) {
    const currentTo = currentFrom + MAX_BLOCK_RANGE > params.toBlock 
      ? params.toBlock 
      : currentFrom + MAX_BLOCK_RANGE;
    
    try {
      const logs = await publicClient.getLogs({
        address: params.address,
        event: params.event,
        fromBlock: currentFrom,
        toBlock: currentTo,
      });
      allLogs.push(...(logs as T[]));
    } catch (e) {
      console.warn(`[v8-indexer] Chunk ${currentFrom}-${currentTo} failed:`, e.message);
      // Continue with next chunk on error
    }
    
    currentFrom = currentTo + 1n;
  }
  
  return allLogs;
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

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(BASE_SEPOLIA_RPC)
    });

    const currentBlock = await publicClient.getBlockNumber();
    const results = {
      currentBlock: Number(currentBlock),
      agentCreatedEvents: 0,
      tradeEvents: 0,
      graduationEvents: 0,
      transfersProcessed: 0,
      errors: [] as string[]
    };

    // =========================================================================
    // INDEX AgentCreated EVENTS from AgentFactoryV8
    // =========================================================================
    try {
      const { data: factoryState } = await supabase
        .from('event_indexer_state')
        .select('last_block_indexed')
        .eq('contract_address', AGENT_FACTORY_V8.toLowerCase())
        .eq('event_type', 'AgentCreated')
        .single();

      // Use earliest agent block or 50k lookback for safety
      let factoryFromBlock: bigint;
      if (factoryState?.last_block_indexed) {
        factoryFromBlock = BigInt(factoryState.last_block_indexed) + 1n;
      } else {
        const { data: earliestAgent } = await supabase
          .from('agents')
          .select('block_number')
          .eq('is_v8', true)
          .not('block_number', 'is', null)
          .order('block_number', { ascending: true })
          .limit(1)
          .single();
        
        factoryFromBlock = earliestAgent?.block_number 
          ? BigInt(earliestAgent.block_number)
          : currentBlock - MAX_BLOCK_RANGE;
      }

      const agentCreatedLogs = await getLogsInChunks(publicClient, {
        address: AGENT_FACTORY_V8 as `0x${string}`,
        event: AGENT_CREATED_EVENT,
        fromBlock: factoryFromBlock > 0n ? factoryFromBlock : 0n,
        toBlock: currentBlock
      });

      for (const log of agentCreatedLogs) {
        try {
          const agentId = bytes32ToUuid((log as any).args.agentId!);

          await supabase.from('agents').update({
            prototype_token_address: (log as any).args.prototypeToken?.toLowerCase(),
            creator_wallet_address: (log as any).args.creator?.toLowerCase(),
            is_v8: true,
            block_number: Number((log as any).blockNumber),
          }).eq('id', agentId);

          results.agentCreatedEvents++;
        } catch (e) {
          results.errors.push(`AgentCreated decode error: ${e.message}`);
        }
      }

      await supabase.from('event_indexer_state').upsert({
        contract_address: AGENT_FACTORY_V8.toLowerCase(),
        event_type: 'AgentCreated',
        last_block_indexed: Number(currentBlock),
        updated_at: new Date().toISOString()
      }, { onConflict: 'contract_address,event_type' });
    } catch (e) {
      results.errors.push(`AgentCreated indexing error: ${e.message}`);
    }

    // =========================================================================
    // INDEX Trade EVENTS from BondingCurveV8
    // =========================================================================
    try {
      const { data: curveState } = await supabase
        .from('event_indexer_state')
        .select('last_block_indexed')
        .eq('contract_address', BONDING_CURVE_V8.toLowerCase())
        .eq('event_type', 'Trade')
        .single();

      // Use earliest agent deployment block as fallback
      let curveFromBlock: bigint;
      if (curveState?.last_block_indexed) {
        curveFromBlock = BigInt(curveState.last_block_indexed) + 1n;
      } else {
        const { data: earliestAgent } = await supabase
          .from('agents')
          .select('block_number')
          .eq('is_v8', true)
          .not('block_number', 'is', null)
          .order('block_number', { ascending: true })
          .limit(1)
          .single();
        
        curveFromBlock = earliestAgent?.block_number 
          ? BigInt(earliestAgent.block_number)
          : currentBlock - MAX_BLOCK_RANGE;
      }

      const tradeLogs = await getLogsInChunks(publicClient, {
        address: BONDING_CURVE_V8 as `0x${string}`,
        event: TRADE_EVENT,
        fromBlock: curveFromBlock > 0n ? curveFromBlock : 0n,
        toBlock: currentBlock
      });

      for (const log of tradeLogs) {
        try {
          const agentId = bytes32ToUuid((log as any).args.agentId!);
          const block = await publicClient.getBlock({ blockNumber: (log as any).blockNumber });

          await supabase.from('on_chain_trades').upsert({
            agent_id: agentId,
            transaction_hash: (log as any).transactionHash,
            block_number: Number((log as any).blockNumber),
            block_timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
            trader_address: (log as any).args.trader!.toLowerCase(),
            is_buy: (log as any).args.isBuy,
            prompt_amount_gross: formatEther((log as any).args.promptAmountGross!),
            prompt_amount_net: formatEther((log as any).args.promptAmountNet!),
            token_amount: formatEther((log as any).args.tokenAmount!),
            fee: formatEther((log as any).args.fee!),
            price: formatEther((log as any).args.price!),
            supply_after: formatEther((log as any).args.supplyAfter!),
            reserve_after: formatEther((log as any).args.reserveAfter!)
          }, { onConflict: 'transaction_hash' });

          // Update agent on-chain state
          await supabase.from('agents').update({
            on_chain_supply: formatEther((log as any).args.supplyAfter!),
            on_chain_reserve: formatEther((log as any).args.reserveAfter!),
            on_chain_price: formatEther((log as any).args.price!)
          }).eq('id', agentId);

          results.tradeEvents++;
        } catch (e) {
          results.errors.push(`Trade decode error: ${e.message}`);
        }
      }

      await supabase.from('event_indexer_state').upsert({
        contract_address: BONDING_CURVE_V8.toLowerCase(),
        event_type: 'Trade',
        last_block_indexed: Number(currentBlock),
        updated_at: new Date().toISOString()
      }, { onConflict: 'contract_address,event_type' });
    } catch (e) {
      results.errors.push(`Trade indexing error: ${e.message}`);
    }

    // =========================================================================
    // INDEX GraduationTriggered EVENTS from BondingCurveV8
    // =========================================================================
    try {
      const { data: gradState } = await supabase
        .from('event_indexer_state')
        .select('last_block_indexed')
        .eq('contract_address', BONDING_CURVE_V8.toLowerCase())
        .eq('event_type', 'GraduationTriggered')
        .single();

      const gradFromBlock = gradState?.last_block_indexed
        ? BigInt(gradState.last_block_indexed) + 1n
        : currentBlock - MAX_BLOCK_RANGE;

      const graduationLogs = await getLogsInChunks(publicClient, {
        address: BONDING_CURVE_V8 as `0x${string}`,
        event: GRADUATION_TRIGGERED_EVENT,
        fromBlock: gradFromBlock > 0n ? gradFromBlock : 0n,
        toBlock: currentBlock
      });

      for (const log of graduationLogs) {
        try {
          const agentId = bytes32ToUuid((log as any).args.agentId!);

          await supabase.from('agents').update({
            graduation_phase: 'triggered',
            on_chain_supply: formatEther((log as any).args.finalSupply!),
            on_chain_reserve: formatEther((log as any).args.finalReserve!)
          }).eq('id', agentId);

          results.graduationEvents++;
        } catch (e) {
          results.errors.push(`GraduationTriggered decode error: ${e.message}`);
        }
      }

      await supabase.from('event_indexer_state').upsert({
        contract_address: BONDING_CURVE_V8.toLowerCase(),
        event_type: 'GraduationTriggered',
        last_block_indexed: Number(currentBlock),
        updated_at: new Date().toISOString()
      }, { onConflict: 'contract_address,event_type' });
    } catch (e) {
      results.errors.push(`GraduationTriggered indexing error: ${e.message}`);
    }

    // =========================================================================
    // INDEX Transfer EVENTS for all V8 prototype tokens
    // =========================================================================
    try {
      const { data: v8Agents } = await supabase
        .from('agents')
        .select('id, prototype_token_address, block_number')
        .eq('is_v8', true)
        .not('prototype_token_address', 'is', null);

      for (const agent of v8Agents || []) {
        try {
          const tokenAddress = agent.prototype_token_address.toLowerCase();
          
          const { data: tokenState } = await supabase
            .from('event_indexer_state')
            .select('last_block_indexed')
            .eq('contract_address', tokenAddress)
            .eq('event_type', 'Transfer')
            .single();

          // Use agent's deployment block if no state exists
          const tokenFromBlock = tokenState?.last_block_indexed
            ? BigInt(tokenState.last_block_indexed) + 1n
            : agent.block_number 
              ? BigInt(agent.block_number)
              : currentBlock - MAX_BLOCK_RANGE;

          const transferLogs = await getLogsInChunks(publicClient, {
            address: agent.prototype_token_address as `0x${string}`,
            event: TRANSFER_EVENT,
            fromBlock: tokenFromBlock > 0n ? tokenFromBlock : 0n,
            toBlock: currentBlock
          });

          for (const log of transferLogs) {
            try {
              const from = (log as any).args.from!;
              const to = (log as any).args.to!;
              const value = (log as any).args.value!;

              // Decrement sender (if not mint)
              if (from !== '0x0000000000000000000000000000000000000000') {
                await supabase.rpc('update_indexed_balance', {
                  p_agent_id: agent.id,
                  p_wallet: from.toLowerCase(),
                  p_delta: -Number(formatEther(value)),
                  p_block: Number((log as any).blockNumber)
                });
              }

              // Increment receiver (if not burn)
              if (to !== '0x0000000000000000000000000000000000000000') {
                await supabase.rpc('update_indexed_balance', {
                  p_agent_id: agent.id,
                  p_wallet: to.toLowerCase(),
                  p_delta: Number(formatEther(value)),
                  p_block: Number((log as any).blockNumber)
                });
              }

              results.transfersProcessed++;
            } catch (e) {
              results.errors.push(`Transfer decode error: ${e.message}`);
            }
          }

          await supabase.from('event_indexer_state').upsert({
            contract_address: tokenAddress,
            event_type: 'Transfer',
            last_block_indexed: Number(currentBlock),
            updated_at: new Date().toISOString()
          }, { onConflict: 'contract_address,event_type' });
        } catch (e) {
          results.errors.push(`Token ${agent.id} indexing error: ${e.message}`);
        }
      }
    } catch (e) {
      results.errors.push(`Transfer indexing error: ${e.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in v8-event-indexer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
