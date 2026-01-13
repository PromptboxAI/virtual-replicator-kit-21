import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { createPublicClient, http, keccak256, toHex } from 'https://esm.sh/viem@2.21.0';
import { baseSepolia } from 'https://esm.sh/viem@2.21.0/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V6 Factory address
const AGENT_FACTORY_V6_ADDRESS = '0x9852671994E4DD979438145fc0a26e123eCc22Dc';

// AgentCreated event signature
const AGENT_CREATED_SIGNATURE = keccak256(toHex('AgentCreated(address,address,string,string,uint256)'));

interface SyncRequest {
  agentId?: string;
  txHash?: string;
  tokenAddress?: string;
  syncAll?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: SyncRequest = await req.json().catch(() => ({}));
    const { agentId, txHash, tokenAddress, syncAll } = body;

    console.log('[sync-agent-deployment] Request:', { agentId, txHash, tokenAddress, syncAll });

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    });

    // Mode 1: Sync all stuck deployments
    if (syncAll) {
      return await syncAllStuckDeployments(supabase, publicClient);
    }

    // Mode 2: Sync by txHash
    if (txHash) {
      return await syncByTxHash(supabase, publicClient, agentId, txHash);
    }

    // Mode 3: Sync by tokenAddress
    if (tokenAddress && agentId) {
      return await syncByTokenAddress(supabase, publicClient, agentId, tokenAddress);
    }

    // Mode 4: Find deployment from factory events
    if (agentId) {
      return await syncByAgentId(supabase, publicClient, agentId);
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Must provide agentId, txHash, tokenAddress, or syncAll=true' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: any) {
    console.error('[sync-agent-deployment] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function syncAllStuckDeployments(supabase: any, publicClient: any) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: stuckAgents, error } = await supabase
    .from('agents')
    .select('id, name, symbol, deployment_tx_hash, created_at, creator_id')
    .eq('deployment_status', 'pending')
    .is('token_contract_address', null)
    .lt('created_at', tenMinutesAgo);

  if (error) throw new Error(`Failed to fetch stuck agents: ${error.message}`);

  if (!stuckAgents || stuckAgents.length === 0) {
    return new Response(
      JSON.stringify({ success: true, message: 'No stuck deployments found', synced: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[sync-agent-deployment] Found ${stuckAgents.length} stuck agents`);

  const results = [];
  for (const agent of stuckAgents) {
    try {
      if (agent.deployment_tx_hash) {
        const result = await verifyAndSyncFromTxHash(supabase, publicClient, agent.id, agent.deployment_tx_hash);
        results.push({ agentId: agent.id, ...result });
      } else {
        const result = await searchFactoryEventsForAgent(supabase, publicClient, agent);
        results.push({ agentId: agent.id, ...result });
      }
    } catch (err: any) {
      results.push({ agentId: agent.id, success: false, error: err.message });
    }
  }

  return new Response(
    JSON.stringify({ success: true, synced: results.filter(r => r.success).length, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncByTxHash(supabase: any, publicClient: any, agentId: string | undefined, txHash: string) {
  const result = await verifyAndSyncFromTxHash(supabase, publicClient, agentId, txHash);
  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: result.success ? 200 : 400 }
  );
}

async function verifyAndSyncFromTxHash(supabase: any, publicClient: any, agentId: string | undefined, txHash: string) {
  console.log(`[sync-agent-deployment] Verifying tx: ${txHash}`);
  
  let receipt;
  try {
    receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
  } catch (err) {
    return { success: false, error: 'Transaction not found or not confirmed yet' };
  }

  if (receipt.status !== 'success') {
    if (agentId) {
      await supabase.from('agents').update({
        deployment_status: 'failed',
        failure_reason: 'On-chain transaction reverted'
      }).eq('id', agentId);
    }
    return { success: false, error: 'Transaction reverted on-chain' };
  }

  let tokenAddress: string | undefined;
  for (const log of receipt.logs) {
    if (log.topics[0] === AGENT_CREATED_SIGNATURE) {
      tokenAddress = '0x' + log.topics[1].slice(-40);
      console.log(`[sync-agent-deployment] Found token address from event: ${tokenAddress}`);
      break;
    }
  }

  if (!tokenAddress) {
    return { success: false, error: 'Could not parse AgentCreated event from transaction' };
  }

  if (agentId) {
    const { error: updateError } = await supabase.from('agents').update({
      token_contract_address: tokenAddress,
      token_address: tokenAddress,
      deployment_tx_hash: txHash,
      deployment_status: 'deployed',
      status: 'ACTIVE',
      is_active: true,
      token_graduated: false,
    }).eq('id', agentId);

    if (updateError) {
      return { success: false, error: `Database update failed: ${updateError.message}` };
    }
    
    console.log(`[sync-agent-deployment] Successfully synced agent ${agentId} with token ${tokenAddress}`);
  }

  return { success: true, tokenAddress, txHash, message: 'Agent synced successfully from on-chain data' };
}

async function syncByTokenAddress(supabase: any, publicClient: any, agentId: string, tokenAddress: string) {
  console.log(`[sync-agent-deployment] Syncing by token address: ${tokenAddress}`);
  
  const bytecode = await publicClient.getBytecode({ address: tokenAddress as `0x${string}` });

  if (!bytecode || bytecode === '0x') {
    return new Response(
      JSON.stringify({ success: false, error: 'No contract found at this address' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  const { error: updateError } = await supabase.from('agents').update({
    token_contract_address: tokenAddress,
    token_address: tokenAddress,
    deployment_status: 'deployed',
    status: 'ACTIVE',
    is_active: true,
    token_graduated: false,
  }).eq('id', agentId);

  if (updateError) {
    return new Response(
      JSON.stringify({ success: false, error: `Database update failed: ${updateError.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  console.log(`[sync-agent-deployment] Successfully synced agent ${agentId} with token ${tokenAddress}`);

  return new Response(
    JSON.stringify({ success: true, tokenAddress, message: 'Agent synced successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncByAgentId(supabase: any, publicClient: any, agentId: string) {
  console.log(`[sync-agent-deployment] Syncing by agent ID: ${agentId}`);
  
  const { data: agent, error } = await supabase
    .from('agents')
    .select('name, symbol, creator_id, deployment_tx_hash, created_at')
    .eq('id', agentId)
    .single();

  if (error || !agent) {
    return new Response(
      JSON.stringify({ success: false, error: 'Agent not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  }

  if (agent.deployment_tx_hash) {
    const result = await verifyAndSyncFromTxHash(supabase, publicClient, agentId, agent.deployment_tx_hash);
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: result.success ? 200 : 400 }
    );
  }

  const result = await searchFactoryEventsForAgent(supabase, publicClient, { ...agent, id: agentId });
  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: result.success ? 200 : 400 }
  );
}

async function searchFactoryEventsForAgent(supabase: any, publicClient: any, agent: any) {
  console.log(`[sync-agent-deployment] Searching factory events for agent: ${agent.symbol}`);
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet_address')
    .eq('id', agent.creator_id)
    .single();

  if (!profile?.wallet_address) {
    return { success: false, error: 'Could not find creator wallet address' };
  }

  const creatorAddress = profile.wallet_address.toLowerCase();
  const currentBlock = await publicClient.getBlockNumber();
  const fromBlock = currentBlock - 1000n; // Look back 1000 blocks

  console.log(`[sync-agent-deployment] Searching blocks ${fromBlock} to ${currentBlock} for creator ${creatorAddress}`);

  const logs = await publicClient.getLogs({
    address: AGENT_FACTORY_V6_ADDRESS as `0x${string}`,
    event: {
      type: 'event',
      name: 'AgentCreated',
      inputs: [
        { type: 'address', name: 'agentToken', indexed: true },
        { type: 'address', name: 'creator', indexed: true },
        { type: 'string', name: 'name' },
        { type: 'string', name: 'symbol' },
        { type: 'uint256', name: 'timestamp' },
      ],
    },
    fromBlock,
    toBlock: currentBlock,
  });

  console.log(`[sync-agent-deployment] Found ${logs.length} AgentCreated events`);

  for (const log of logs) {
    const eventCreator = log.args.creator?.toLowerCase();
    const eventSymbol = log.args.symbol;

    if (eventCreator === creatorAddress && eventSymbol === agent.symbol) {
      const tokenAddress = log.args.agentToken;
      const txHash = log.transactionHash;

      console.log(`[sync-agent-deployment] Found matching event! Token: ${tokenAddress}, Tx: ${txHash}`);

      const { error: updateError } = await supabase.from('agents').update({
        token_contract_address: tokenAddress,
        token_address: tokenAddress,
        deployment_tx_hash: txHash,
        deployment_status: 'deployed',
        status: 'ACTIVE',
        is_active: true,
        token_graduated: false,
      }).eq('id', agent.id);

      if (updateError) {
        return { success: false, error: `Database update failed: ${updateError.message}` };
      }

      return { success: true, tokenAddress, txHash, message: 'Found and synced from factory events' };
    }
  }

  return { success: false, error: 'No matching deployment found in recent factory events' };
}
