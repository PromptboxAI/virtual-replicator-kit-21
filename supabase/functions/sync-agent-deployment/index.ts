import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { createPublicClient, http, keccak256, toHex } from 'https://esm.sh/viem@2.21.0';
import { baseSepolia } from 'https://esm.sh/viem@2.21.0/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V6 Factory address and event signature
const AGENT_FACTORY_V6_ADDRESS = '0x9852671994E4DD979438145fc0a26e123eCc22Dc';
const AGENT_CREATED_V6_SIGNATURE = keccak256(toHex('AgentCreated(address,address,string,string,uint256)'));

// V8 Factory address and event signature (includes uint256 timestamp)
const AGENT_FACTORY_V8_ADDRESS = '0xe8214F54e4a670A92B8A6Fc2Da1DB70b091A4a79';
const AGENT_CREATED_V8_SIGNATURE = keccak256(toHex('AgentCreated(bytes32,address,address,string,string,uint256)'));

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
    .select('id, name, symbol, deployment_tx_hash, created_at, creator_id, is_v8')
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

  // Parse AgentCreated event from logs - check both V6 and V8 signatures
  let tokenAddress: string | undefined;
  let isV8Event = false;

  for (const log of receipt.logs) {
    // Check V6 event signature: AgentCreated(address,address,string,string,uint256)
    // V6: topics[1] = agentToken (indexed address)
    if (log.topics[0] === AGENT_CREATED_V6_SIGNATURE) {
      tokenAddress = '0x' + log.topics[1].slice(-40);
      isV8Event = false;
      console.log(`[sync-agent-deployment] Found V6 AgentCreated event, token: ${tokenAddress}`);
      break;
    }
    
    // Check V8 event signature: AgentCreated(bytes32,address,address,string,string)
    // V8: topics[1] = agentId (bytes32 indexed), topics[2] = prototypeToken (indexed address)
    if (log.topics[0] === AGENT_CREATED_V8_SIGNATURE) {
      tokenAddress = '0x' + log.topics[2].slice(-40);
      isV8Event = true;
      console.log(`[sync-agent-deployment] Found V8 AgentCreated event, prototypeToken: ${tokenAddress}`);
      break;
    }
  }

  if (!tokenAddress) {
    return { success: false, error: 'Could not parse AgentCreated event from transaction' };
  }

  if (agentId) {
    // Fetch agent to get created_p0 for correct V8 starting price
    const { data: agent } = await supabase
      .from('agents')
      .select('created_p0')
      .eq('id', agentId)
      .single();

    const updateData: any = {
      token_contract_address: tokenAddress,
      token_address: tokenAddress,
      deployment_tx_hash: txHash,
      deployment_status: 'deployed',
      status: 'ACTIVE',
      is_active: true,
      token_graduated: false,
    };

    // For V8 agents, also set prototype_token_address and correct starting price
    if (isV8Event) {
      updateData.prototype_token_address = tokenAddress;
      // V8 agents should use created_p0 as starting price, not the legacy 0.03
      if (agent?.created_p0) {
        updateData.current_price = parseFloat(agent.created_p0);
        updateData.on_chain_price = parseFloat(agent.created_p0);
        console.log(`[sync-agent-deployment] Setting V8 price to created_p0: ${agent.created_p0}`);
      }
    }

    const { error: updateError } = await supabase.from('agents').update(updateData).eq('id', agentId);

    if (updateError) {
      return { success: false, error: `Database update failed: ${updateError.message}` };
    }
    
    console.log(`[sync-agent-deployment] Successfully synced agent ${agentId} with token ${tokenAddress} (V8: ${isV8Event})`);
  }

  return { success: true, tokenAddress, txHash, isV8: isV8Event, message: 'Agent synced successfully from on-chain data' };
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

  // Get agent to check if it's V8 and get created_p0 for correct price
  const { data: agent } = await supabase
    .from('agents')
    .select('is_v8, created_p0')
    .eq('id', agentId)
    .single();

  const updateData: any = {
    token_contract_address: tokenAddress,
    token_address: tokenAddress,
    deployment_status: 'deployed',
    status: 'ACTIVE',
    is_active: true,
    token_graduated: false,
  };

  // For V8 agents, also set prototype_token_address and correct starting price
  if (agent?.is_v8) {
    updateData.prototype_token_address = tokenAddress;
    // V8 agents should use created_p0 as starting price, not the legacy 0.03
    if (agent.created_p0) {
      updateData.current_price = parseFloat(agent.created_p0);
      updateData.on_chain_price = parseFloat(agent.created_p0);
      console.log(`[sync-agent-deployment] Setting V8 price to created_p0: ${agent.created_p0}`);
    }
  }

  const { error: updateError } = await supabase.from('agents').update(updateData).eq('id', agentId);

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
    .select('name, symbol, creator_id, deployment_tx_hash, created_at, is_v8')
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
  console.log(`[sync-agent-deployment] Searching factory events for agent: ${agent.symbol}, is_v8: ${agent.is_v8}`);
  
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

  // Determine which factory to search based on is_v8 flag
  const factoryAddress = agent.is_v8 ? AGENT_FACTORY_V8_ADDRESS : AGENT_FACTORY_V6_ADDRESS;

  console.log(`[sync-agent-deployment] Searching ${agent.is_v8 ? 'V8' : 'V6'} factory ${factoryAddress}, blocks ${fromBlock} to ${currentBlock} for creator ${creatorAddress}`);

  // Define event structure based on version (V8 includes timestamp)
  const eventAbi = agent.is_v8
    ? {
        type: 'event',
        name: 'AgentCreated',
        inputs: [
          { type: 'bytes32', name: 'agentId', indexed: true },
          { type: 'address', name: 'prototypeToken', indexed: true },
          { type: 'address', name: 'creator', indexed: true },
          { type: 'string', name: 'name' },
          { type: 'string', name: 'symbol' },
          { type: 'uint256', name: 'timestamp' },
        ],
      }
    : {
        type: 'event',
        name: 'AgentCreated',
        inputs: [
          { type: 'address', name: 'agentToken', indexed: true },
          { type: 'address', name: 'creator', indexed: true },
          { type: 'string', name: 'name' },
          { type: 'string', name: 'symbol' },
          { type: 'uint256', name: 'timestamp' },
        ],
      };

  const logs = await publicClient.getLogs({
    address: factoryAddress as `0x${string}`,
    event: eventAbi,
    fromBlock,
    toBlock: currentBlock,
  });

  console.log(`[sync-agent-deployment] Found ${logs.length} AgentCreated events`);

  for (const log of logs) {
    const eventCreator = log.args.creator?.toLowerCase();
    const eventSymbol = log.args.symbol;

    if (eventCreator === creatorAddress && eventSymbol === agent.symbol) {
      // For V8: use prototypeToken, for V6: use agentToken
      const tokenAddress = agent.is_v8 ? log.args.prototypeToken : log.args.agentToken;
      const txHash = log.transactionHash;

      console.log(`[sync-agent-deployment] Found matching event! Token: ${tokenAddress}, Tx: ${txHash}`);

      const updateData: any = {
        token_contract_address: tokenAddress,
        token_address: tokenAddress,
        deployment_tx_hash: txHash,
        deployment_status: 'deployed',
        status: 'ACTIVE',
        is_active: true,
        token_graduated: false,
      };

      // For V8 agents, also set prototype_token_address
      if (agent.is_v8) {
        updateData.prototype_token_address = tokenAddress;
      }

      const { error: updateError } = await supabase.from('agents').update(updateData).eq('id', agent.id);

      if (updateError) {
        return { success: false, error: `Database update failed: ${updateError.message}` };
      }

      return { success: true, tokenAddress, txHash, isV8: agent.is_v8, message: 'Found and synced from factory events' };
    }
  }

  return { success: false, error: 'No matching deployment found in recent factory events' };
}
