import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V8 Contract Addresses
const BONDING_CURVE_V8 = Deno.env.get('BONDING_CURVE_V8_ADDRESS') || '0xc511a151b0E04D5Ba87968900eE90d310530D5fB';
const AGENT_FACTORY_V8 = Deno.env.get('AGENT_FACTORY_V8_ADDRESS') || '0xe8214F54e4a670A92B8A6Fc2Da1DB70b091A4a79';
const BASE_SEPOLIA_RPC = Deno.env.get('BASE_SEPOLIA_RPC') || 'https://sepolia.base.org';

// Event signatures (keccak256 of event signature)
const EVENT_SIGNATURES = {
  // AgentCreated(bytes32 indexed agentId, address indexed prototypeToken, address indexed creator, string name, string symbol, uint256 timestamp)
  AGENT_CREATED: '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0',
  // Trade(bytes32 indexed agentId, address indexed trader, bool isBuy, uint256 promptAmountGross, uint256 promptAmountNet, uint256 tokenAmount, uint256 fee, uint256 price, uint256 supplyAfter, uint256 reserveAfter, uint256 timestamp)
  TRADE: '0x2c76e7a47fd53e2854856ac3f0a5f3ee40d15cfaa82266357ea9779c486ab9c3',
  // GraduationTriggered(bytes32 indexed agentId, uint256 finalSupply, uint256 finalReserve, uint256 timestamp)
  GRADUATION_TRIGGERED: '0x7c0c3c84c67c85fcac635147348bfe374c24a1a93d0366d1cfe9c5c86bb12c42',
  // Transfer(address indexed from, address indexed to, uint256 value)
  TRANSFER: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
};

// Convert bytes32 to UUID
function bytes32ToUuid(bytes32: string): string {
  const hex = bytes32.slice(2, 34); // Remove 0x and take first 32 chars
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
}

// Format wei to ether
function formatEther(wei: bigint): string {
  const str = wei.toString().padStart(19, '0');
  const whole = str.slice(0, -18) || '0';
  const decimal = str.slice(-18).replace(/0+$/, '');
  return decimal ? `${whole}.${decimal}` : whole;
}

// Get current block number
async function getCurrentBlockNumber(): Promise<bigint> {
  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_blockNumber',
      params: []
    })
  });
  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  return BigInt(result.result);
}

// Get block timestamp
async function getBlockTimestamp(blockNumber: bigint): Promise<string> {
  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBlockByNumber',
      params: [`0x${blockNumber.toString(16)}`, false]
    })
  });
  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  const timestamp = parseInt(result.result.timestamp, 16);
  return new Date(timestamp * 1000).toISOString();
}

// Fetch logs from RPC
async function getLogs(address: string, topics: (string | null)[], fromBlock: bigint, toBlock: bigint) {
  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getLogs',
      params: [{
        address,
        topics,
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: `0x${toBlock.toString(16)}`
      }]
    })
  });
  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  return result.result || [];
}

// Decode Trade event data
function decodeTradeEvent(log: { topics: string[], data: string }) {
  const agentId = log.topics[1];
  const trader = '0x' + log.topics[2].slice(26);
  
  // Decode non-indexed parameters from data
  const data = log.data.slice(2); // Remove 0x
  const isBuy = BigInt('0x' + data.slice(0, 64)) === 1n;
  const promptAmountGross = BigInt('0x' + data.slice(64, 128));
  const promptAmountNet = BigInt('0x' + data.slice(128, 192));
  const tokenAmount = BigInt('0x' + data.slice(192, 256));
  const fee = BigInt('0x' + data.slice(256, 320));
  const price = BigInt('0x' + data.slice(320, 384));
  const supplyAfter = BigInt('0x' + data.slice(384, 448));
  const reserveAfter = BigInt('0x' + data.slice(448, 512));
  const timestamp = BigInt('0x' + data.slice(512, 576));
  
  return {
    agentId,
    trader,
    isBuy,
    promptAmountGross,
    promptAmountNet,
    tokenAmount,
    fee,
    price,
    supplyAfter,
    reserveAfter,
    timestamp
  };
}

// Decode GraduationTriggered event data
function decodeGraduationTriggeredEvent(log: { topics: string[], data: string }) {
  const agentId = log.topics[1];
  const data = log.data.slice(2);
  const finalSupply = BigInt('0x' + data.slice(0, 64));
  const finalReserve = BigInt('0x' + data.slice(64, 128));
  const timestamp = BigInt('0x' + data.slice(128, 192));
  
  return { agentId, finalSupply, finalReserve, timestamp };
}

// Decode AgentCreated event data
function decodeAgentCreatedEvent(log: { topics: string[], data: string }) {
  const agentId = log.topics[1];
  const prototypeToken = '0x' + log.topics[2].slice(26);
  const creator = '0x' + log.topics[3].slice(26);
  
  // Data contains name, symbol, timestamp - simplified for now
  return { agentId, prototypeToken, creator };
}

// Decode Transfer event
function decodeTransferEvent(log: { topics: string[], data: string }) {
  const from = '0x' + log.topics[1].slice(26);
  const to = '0x' + log.topics[2].slice(26);
  const value = BigInt('0x' + log.data.slice(2));
  
  return { from, to, value };
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

    const currentBlock = await getCurrentBlockNumber();
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

      const factoryFromBlock = factoryState?.last_block_indexed
        ? BigInt(factoryState.last_block_indexed) + 1n
        : currentBlock - 10000n; // Start from ~10000 blocks ago if no state

      const agentCreatedLogs = await getLogs(
        AGENT_FACTORY_V8,
        [EVENT_SIGNATURES.AGENT_CREATED, null, null, null],
        factoryFromBlock > 0n ? factoryFromBlock : 0n,
        currentBlock
      );

      for (const log of agentCreatedLogs) {
        try {
          const { agentId, prototypeToken, creator } = decodeAgentCreatedEvent(log);
          const agentUuid = bytes32ToUuid(agentId);

          await supabase.from('agents').update({
            prototype_token_address: prototypeToken.toLowerCase(),
            is_v8: true,
            creator_wallet_address: creator.toLowerCase()
          }).eq('id', agentUuid);

          results.agentCreatedEvents++;
        } catch (e) {
          results.errors.push(`AgentCreated decode error: ${e.message}`);
        }
      }

      // Update indexer state
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

      const curveFromBlock = curveState?.last_block_indexed
        ? BigInt(curveState.last_block_indexed) + 1n
        : currentBlock - 10000n;

      const tradeLogs = await getLogs(
        BONDING_CURVE_V8,
        [EVENT_SIGNATURES.TRADE, null, null],
        curveFromBlock > 0n ? curveFromBlock : 0n,
        currentBlock
      );

      for (const log of tradeLogs) {
        try {
          const trade = decodeTradeEvent(log);
          const agentUuid = bytes32ToUuid(trade.agentId);
          const blockNumber = BigInt(log.blockNumber);
          const blockTimestamp = await getBlockTimestamp(blockNumber);

          // Insert trade record
          await supabase.from('on_chain_trades').upsert({
            agent_id: agentUuid,
            transaction_hash: log.transactionHash,
            block_number: Number(blockNumber),
            block_timestamp: blockTimestamp,
            trader_address: trade.trader.toLowerCase(),
            is_buy: trade.isBuy,
            prompt_amount_gross: formatEther(trade.promptAmountGross),
            prompt_amount_net: formatEther(trade.promptAmountNet),
            token_amount: formatEther(trade.tokenAmount),
            fee: formatEther(trade.fee),
            price: formatEther(trade.price),
            supply_after: formatEther(trade.supplyAfter),
            reserve_after: formatEther(trade.reserveAfter)
          }, { onConflict: 'transaction_hash' });

          // Update agent's on-chain state
          await supabase.from('agents').update({
            on_chain_supply: formatEther(trade.supplyAfter),
            on_chain_reserve: formatEther(trade.reserveAfter),
            on_chain_price: formatEther(trade.price)
          }).eq('id', agentUuid);

          results.tradeEvents++;
        } catch (e) {
          results.errors.push(`Trade decode error: ${e.message}`);
        }
      }

      // Update indexer state
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
        : currentBlock - 10000n;

      const graduationLogs = await getLogs(
        BONDING_CURVE_V8,
        [EVENT_SIGNATURES.GRADUATION_TRIGGERED, null],
        gradFromBlock > 0n ? gradFromBlock : 0n,
        currentBlock
      );

      for (const log of graduationLogs) {
        try {
          const { agentId, finalSupply, finalReserve } = decodeGraduationTriggeredEvent(log);
          const agentUuid = bytes32ToUuid(agentId);

          await supabase.from('agents').update({
            graduation_phase: 'triggered',
            on_chain_supply: formatEther(finalSupply),
            on_chain_reserve: formatEther(finalReserve)
          }).eq('id', agentUuid);

          results.graduationEvents++;
        } catch (e) {
          results.errors.push(`GraduationTriggered decode error: ${e.message}`);
        }
      }

      // Update indexer state
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
        .select('id, prototype_token_address')
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

          const tokenFromBlock = tokenState?.last_block_indexed
            ? BigInt(tokenState.last_block_indexed) + 1n
            : currentBlock - 10000n;

          const transferLogs = await getLogs(
            agent.prototype_token_address,
            [EVENT_SIGNATURES.TRANSFER, null, null],
            tokenFromBlock > 0n ? tokenFromBlock : 0n,
            currentBlock
          );

          for (const log of transferLogs) {
            try {
              const { from, to, value } = decodeTransferEvent(log);
              const blockNumber = Number(BigInt(log.blockNumber));

              // Decrement sender (if not mint from zero address)
              if (from !== '0x0000000000000000000000000000000000000000') {
                await supabase.rpc('update_indexed_balance', {
                  p_agent_id: agent.id,
                  p_wallet: from.toLowerCase(),
                  p_delta: -Number(formatEther(value)),
                  p_block: blockNumber,
                  p_token_type: 'prototype'
                });
              }

              // Increment receiver (if not burn to zero address)
              if (to !== '0x0000000000000000000000000000000000000000') {
                await supabase.rpc('update_indexed_balance', {
                  p_agent_id: agent.id,
                  p_wallet: to.toLowerCase(),
                  p_delta: Number(formatEther(value)),
                  p_block: blockNumber,
                  p_token_type: 'prototype'
                });
              }

              results.transfersProcessed++;
            } catch (e) {
              results.errors.push(`Transfer decode error for ${agent.id}: ${e.message}`);
            }
          }

          // Update indexer state for this token
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
