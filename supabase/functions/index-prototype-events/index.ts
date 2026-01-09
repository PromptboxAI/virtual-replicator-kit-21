import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_SEPOLIA_RPC = Deno.env.get('BASE_SEPOLIA_RPC') || 'https://sepolia.base.org';

// ERC20 Transfer event signature
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Zero address
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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
  if (result.error) {
    throw new Error(result.error.message);
  }

  return BigInt(result.result);
}

// Get Transfer logs for a token address
async function getTransferLogs(
  tokenAddress: string,
  fromBlock: bigint,
  toBlock: bigint
): Promise<Array<{
  from: string;
  to: string;
  value: bigint;
  blockNumber: bigint;
  transactionHash: string;
}>> {
  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getLogs',
      params: [{
        address: tokenAddress,
        topics: [TRANSFER_EVENT_TOPIC],
        fromBlock: '0x' + fromBlock.toString(16),
        toBlock: '0x' + toBlock.toString(16)
      }]
    })
  });

  const result = await response.json();
  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.result || []).map((log: {
    topics: string[];
    data: string;
    blockNumber: string;
    transactionHash: string;
  }) => ({
    // Topics[1] = from address (indexed, padded to 32 bytes)
    from: '0x' + log.topics[1].slice(26).toLowerCase(),
    // Topics[2] = to address (indexed, padded to 32 bytes)
    to: '0x' + log.topics[2].slice(26).toLowerCase(),
    // Data = value (uint256)
    value: BigInt(log.data),
    blockNumber: BigInt(log.blockNumber),
    transactionHash: log.transactionHash
  }));
}

// Format wei to decimal string
function formatWei(wei: bigint): string {
  const str = wei.toString().padStart(19, '0');
  const whole = str.slice(0, -18) || '0';
  const decimal = str.slice(-18);
  const trimmedDecimal = decimal.replace(/0+$/, '');
  return trimmedDecimal ? `${whole}.${trimmedDecimal}` : whole;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, prototypeTokenAddress, maxBlocks = 1000 } = await req.json();

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let agentsToIndex: Array<{ id: string; prototype_token_address: string }>;

    if (agentId && prototypeTokenAddress) {
      // Index specific agent
      agentsToIndex = [{ id: agentId, prototype_token_address: prototypeTokenAddress }];
    } else {
      // Get all agents with prototype token addresses that need indexing
      const { data: agents, error } = await supabase
        .from('agents')
        .select('id, prototype_token_address')
        .not('prototype_token_address', 'is', null)
        .eq('token_graduated', false);

      if (error) {
        throw new Error(`Failed to fetch agents: ${error.message}`);
      }

      agentsToIndex = agents || [];
    }

    if (agentsToIndex.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No agents to index', agentsProcessed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBlock = await getCurrentBlockNumber();
    const results: Array<{
      agentId: string;
      eventsProcessed: number;
      balancesUpdated: number;
      lastBlock: string;
    }> = [];

    for (const agent of agentsToIndex) {
      if (!agent.prototype_token_address) continue;

      // Get last indexed block for this agent
      const { data: lastIndexed } = await supabase
        .from('indexed_holder_balances')
        .select('last_block_indexed')
        .eq('agent_id', agent.id)
        .eq('token_type', 'prototype')
        .order('last_block_indexed', { ascending: false })
        .limit(1)
        .maybeSingle();

      const fromBlock = lastIndexed?.last_block_indexed 
        ? BigInt(lastIndexed.last_block_indexed) + 1n 
        : 0n;

      // Limit block range to prevent timeout
      const toBlock = fromBlock + BigInt(maxBlocks) < currentBlock 
        ? fromBlock + BigInt(maxBlocks) 
        : currentBlock;

      if (fromBlock > currentBlock) {
        results.push({
          agentId: agent.id,
          eventsProcessed: 0,
          balancesUpdated: 0,
          lastBlock: currentBlock.toString()
        });
        continue;
      }

      // Fetch Transfer events
      const logs = await getTransferLogs(
        agent.prototype_token_address,
        fromBlock,
        toBlock
      );

      // Track balance changes
      const balanceChanges: Map<string, bigint> = new Map();

      for (const log of logs) {
        // Decrement sender balance (if not zero address / mint)
        if (log.from !== ZERO_ADDRESS) {
          const currentFrom = balanceChanges.get(log.from) || 0n;
          balanceChanges.set(log.from, currentFrom - log.value);
        }

        // Increment receiver balance
        const currentTo = balanceChanges.get(log.to) || 0n;
        balanceChanges.set(log.to, currentTo + log.value);
      }

      // Update balances in database
      let balancesUpdated = 0;
      for (const [wallet, delta] of balanceChanges) {
        if (delta === 0n) continue;

        // Use RPC function for atomic update
        const { error: rpcError } = await supabase.rpc('update_indexed_balance', {
          p_agent_id: agent.id,
          p_wallet: wallet.toLowerCase(),
          p_delta: parseFloat(formatWei(delta)),
          p_block: Number(toBlock)
        });

        if (rpcError) {
          console.error(`Failed to update balance for ${wallet}:`, rpcError);
        } else {
          balancesUpdated++;
        }
      }

      results.push({
        agentId: agent.id,
        eventsProcessed: logs.length,
        balancesUpdated,
        lastBlock: toBlock.toString()
      });
    }

    return new Response(
      JSON.stringify({
        message: 'Indexing complete',
        currentBlock: currentBlock.toString(),
        agentsProcessed: results.length,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in index-prototype-events:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
