import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V8 Contract Addresses
const GRADUATION_MANAGER_V8 = Deno.env.get('GRADUATION_MANAGER_V8_ADDRESS') || '0x3c6878857FB1d1a1155b016A4b904c479395B2D9';
const BASE_SEPOLIA_RPC = Deno.env.get('BASE_SEPOLIA_RPC') || 'https://sepolia.base.org';
const BATCH_SIZE = 100;

// Graduation threshold for V8: 42,160 PROMPT
const GRADUATION_THRESHOLD = '42160';

// Convert UUID to bytes32
function uuidToBytes32(uuid: string): string {
  const cleanUuid = uuid.replace(/-/g, '');
  return '0x' + cleanUuid.padStart(64, '0');
}

// Parse ether string to wei bigint
function parseEther(value: string): bigint {
  const [whole, decimal = ''] = value.split('.');
  const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18);
  return BigInt(whole + paddedDecimal);
}

// Format wei to ether string
function formatEther(wei: bigint): string {
  const str = wei.toString().padStart(19, '0');
  const whole = str.slice(0, -18) || '0';
  const decimal = str.slice(-18).replace(/0+$/, '');
  return decimal ? `${whole}.${decimal}` : whole;
}

// Simple keccak256 implementation using Web Crypto API
async function keccak256(data: Uint8Array): Promise<string> {
  // Note: Web Crypto doesn't support keccak256 directly
  // In production, use a proper keccak256 library
  // For now, we'll use SHA-256 as a placeholder and note this needs updating
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Encode packed data for snapshot hash
function encodePackedAddressesAndAmounts(recipients: string[], amounts: bigint[]): Uint8Array {
  // Each address is 20 bytes, each uint256 is 32 bytes
  const totalLength = recipients.length * 20 + amounts.length * 32;
  const buffer = new Uint8Array(totalLength);
  let offset = 0;

  // Pack addresses (20 bytes each)
  for (const recipient of recipients) {
    const cleanAddress = recipient.replace('0x', '').toLowerCase();
    for (let i = 0; i < 20; i++) {
      buffer[offset + i] = parseInt(cleanAddress.substring(i * 2, i * 2 + 2), 16);
    }
    offset += 20;
  }

  // Pack amounts (32 bytes each, big-endian)
  for (const amount of amounts) {
    const amountHex = amount.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      buffer[offset + i] = parseInt(amountHex.substring(i * 2, i * 2 + 2), 16);
    }
    offset += 32;
  }

  return buffer;
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
  if (result.error) {
    throw new Error(result.error.message);
  }

  return BigInt(result.result);
}

interface SnapshotData {
  recipients: string[];
  amounts: string[];
  totalHolderTokens: string;
  holderCount: number;
  batchesRequired: number;
  snapshotBlockNumber: string;
  snapshotHash: string;
}

// Get snapshot from indexed_holder_balances
async function getSnapshot(supabase: ReturnType<typeof createClient>, agentId: string): Promise<SnapshotData> {
  // Get current block number for snapshot provenance
  const currentBlock = await getCurrentBlockNumber();

  // Query indexed holder balances (SOURCE OF TRUTH)
  const { data: holders, error } = await supabase
    .from('indexed_holder_balances')
    .select('wallet_address, token_balance')
    .eq('agent_id', agentId)
    .eq('token_type', 'prototype')
    .gt('token_balance', 0)
    .order('token_balance', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch holders: ${error.message}`);
  }

  if (!holders || holders.length === 0) {
    throw new Error('No holders found for this agent');
  }

  // Prepare arrays for hash computation
  const recipients = holders.map(h => h.wallet_address as string);
  const amountsWei = holders.map(h => parseEther(h.token_balance.toString()));

  // Compute snapshot hash for on-chain verification
  // keccak256(abi.encodePacked(recipients, amounts))
  const packedData = encodePackedAddressesAndAmounts(recipients, amountsWei);
  const snapshotHash = await keccak256(packedData);

  const totalHolderTokens = holders.reduce(
    (sum, h) => sum + parseFloat(h.token_balance), 0
  );

  return {
    recipients,
    amounts: holders.map(h => h.token_balance.toString()),
    totalHolderTokens: totalHolderTokens.toString(),
    holderCount: holders.length,
    batchesRequired: Math.ceil(holders.length / BATCH_SIZE),
    snapshotBlockNumber: currentBlock.toString(),
    snapshotHash
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, agentId, batchIndex, snapshot: providedSnapshot } = await req.json();

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get agent data
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let responseData: Record<string, unknown>;

    switch (action) {
      case 'getSnapshot': {
        // Get snapshot from indexed_holder_balances with provenance
        const snapshot = await getSnapshot(supabase, agentId);

        responseData = {
          action: 'getSnapshot',
          agentId,
          ...snapshot,
          graduationThreshold: GRADUATION_THRESHOLD,
          isEligible: parseFloat(agent.prompt_raised || '0') >= parseFloat(GRADUATION_THRESHOLD)
        };
        break;
      }

      case 'initializeGraduation': {
        // Verify graduation eligibility
        const promptRaised = parseFloat(agent.prompt_raised || '0');
        if (promptRaised < parseFloat(GRADUATION_THRESHOLD)) {
          return new Response(
            JSON.stringify({ 
              error: `Graduation threshold not met. Current: ${promptRaised}, Required: ${GRADUATION_THRESHOLD}` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (agent.graduation_phase !== 'not_started') {
          return new Response(
            JSON.stringify({ 
              error: `Graduation already in progress. Current phase: ${agent.graduation_phase}` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get fresh snapshot if not provided
        const snapshot = providedSnapshot || await getSnapshot(supabase, agentId);

        // In production, this would call the contract:
        // GraduationManagerV8.initializeGraduation(
        //   agentIdBytes32,
        //   parseEther(snapshot.totalHolderTokens),
        //   parseEther(totalRewardTokens),
        //   BigInt(snapshot.snapshotBlockNumber),
        //   snapshot.snapshotHash,
        //   agent.name,
        //   agent.symbol
        // )

        const agentIdBytes32 = uuidToBytes32(agentId);
        
        // Calculate reward tokens (platform allocation - typically 10% for ecosystem rewards)
        const totalRewardTokens = (parseFloat(snapshot.totalHolderTokens) * 0.1).toString();

        // Update agent graduation phase and store provenance
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            graduation_phase: 'initialized',
            snapshot_block_number: snapshot.snapshotBlockNumber,
            snapshot_hash: snapshot.snapshotHash
          })
          .eq('id', agentId);

        if (updateError) {
          throw new Error(`Failed to update agent: ${updateError.message}`);
        }

        responseData = {
          action: 'initializeGraduation',
          agentId,
          agentIdBytes32,
          graduationPhase: 'initialized',
          totalHolderTokens: snapshot.totalHolderTokens,
          totalRewardTokens,
          snapshotBlockNumber: snapshot.snapshotBlockNumber,
          snapshotHash: snapshot.snapshotHash,
          batchesRequired: snapshot.batchesRequired,
          message: 'Graduation initialized. Ready for airdrop batches.',
          // Transaction would be included here in production
          // txHash: '0x...'
        };
        break;
      }

      case 'airdropBatch': {
        if (batchIndex === undefined) {
          return new Response(
            JSON.stringify({ error: 'batchIndex is required for airdropBatch' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (agent.graduation_phase !== 'initialized' && agent.graduation_phase !== 'airdropping') {
          return new Response(
            JSON.stringify({ 
              error: `Invalid graduation phase for airdrop. Current: ${agent.graduation_phase}` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get snapshot to determine batch recipients
        const snapshot = await getSnapshot(supabase, agentId);
        
        const startIdx = batchIndex * BATCH_SIZE;
        const endIdx = Math.min(startIdx + BATCH_SIZE, snapshot.holderCount);
        
        if (startIdx >= snapshot.holderCount) {
          return new Response(
            JSON.stringify({ error: 'Batch index out of range' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const batchRecipients = snapshot.recipients.slice(startIdx, endIdx);
        const batchAmounts = snapshot.amounts.slice(startIdx, endIdx);
        const tokensDistributed = batchAmounts.reduce((sum, a) => sum + parseFloat(a), 0);

        // In production, this would call the contract:
        // GraduationManagerV8.airdropBatch(agentIdBytes32, batchRecipients, batchAmounts)

        // Record batch in database
        const { error: batchError } = await supabase
          .from('graduation_batches')
          .insert({
            agent_id: agentId,
            batch_index: batchIndex,
            transaction_hash: `0x_pending_batch_${batchIndex}`, // Would be real tx hash
            holders_count: batchRecipients.length,
            tokens_distributed: tokensDistributed
          });

        if (batchError) {
          console.error('Failed to record batch:', batchError);
        }

        // Update agent batch counter
        const isLastBatch = endIdx >= snapshot.holderCount;
        const newPhase = isLastBatch ? 'completed' : 'airdropping';

        const { error: updateError } = await supabase
          .from('agents')
          .update({
            graduation_phase: newPhase,
            airdrop_batches_completed: batchIndex + 1,
            token_graduated: isLastBatch
          })
          .eq('id', agentId);

        if (updateError) {
          throw new Error(`Failed to update agent: ${updateError.message}`);
        }

        responseData = {
          action: 'airdropBatch',
          agentId,
          batchIndex,
          recipientsCount: batchRecipients.length,
          tokensDistributed: tokensDistributed.toString(),
          isLastBatch,
          graduationPhase: newPhase,
          tradingEnabled: isLastBatch, // Trading auto-enables when all batches complete
          message: isLastBatch 
            ? 'All airdrops complete! Trading is now enabled on DEX.'
            : `Batch ${batchIndex + 1}/${snapshot.batchesRequired} complete.`
        };
        break;
      }

      case 'getStatus': {
        // Get graduation status
        const { data: batches } = await supabase
          .from('graduation_batches')
          .select('*')
          .eq('agent_id', agentId)
          .order('batch_index', { ascending: true });

        responseData = {
          action: 'getStatus',
          agentId,
          graduationPhase: agent.graduation_phase,
          airdropBatchesCompleted: agent.airdrop_batches_completed,
          snapshotBlockNumber: agent.snapshot_block_number,
          snapshotHash: agent.snapshot_hash,
          tokenGraduated: agent.token_graduated,
          prototypeTokenAddress: agent.prototype_token_address,
          finalTokenAddress: agent.final_token_address,
          batches: batches || []
        };
        break;
      }

      default: {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action. Valid actions: getSnapshot, initializeGraduation, airdropBatch, getStatus' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in graduation-orchestrator-v8:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
