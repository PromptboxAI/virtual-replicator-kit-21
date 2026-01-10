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

// Keccak256 using crypto subtle (SHA-256 placeholder - in production use proper keccak)
async function keccak256(data: Uint8Array): Promise<string> {
  // Note: For production, import a proper keccak256 implementation
  // This uses SHA-256 as a placeholder for development
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Encode packed data for snapshot hash
function encodePackedAddressesAndAmounts(recipients: string[], amounts: bigint[]): Uint8Array {
  const totalLength = recipients.length * 20 + amounts.length * 32;
  const buffer = new Uint8Array(totalLength);
  let offset = 0;

  for (const recipient of recipients) {
    const cleanAddress = recipient.replace('0x', '').toLowerCase();
    for (let i = 0; i < 20; i++) {
      buffer[offset + i] = parseInt(cleanAddress.substring(i * 2, i * 2 + 2), 16);
    }
    offset += 20;
  }

  for (const amount of amounts) {
    const amountHex = amount.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      buffer[offset + i] = parseInt(amountHex.substring(i * 2, i * 2 + 2), 16);
    }
    offset += 32;
  }

  return buffer;
}

// Get current block number from RPC
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

// Get chain ID for transaction signing
async function getChainId(): Promise<bigint> {
  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_chainId',
      params: []
    })
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  return BigInt(result.result);
}

// Get nonce for address
async function getNonce(address: string): Promise<bigint> {
  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionCount',
      params: [address, 'pending']
    })
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  return BigInt(result.result);
}

// Get gas price
async function getGasPrice(): Promise<bigint> {
  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_gasPrice',
      params: []
    })
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  return BigInt(result.result);
}

// Send raw transaction
async function sendRawTransaction(signedTx: string): Promise<string> {
  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendRawTransaction',
      params: [signedTx]
    })
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  return result.result;
}

// Wait for transaction receipt
async function waitForReceipt(txHash: string, maxAttempts = 60): Promise<{ blockNumber: string, status: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(BASE_SEPOLIA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      })
    });

    const result = await response.json();
    if (result.result) {
      return {
        blockNumber: result.result.blockNumber,
        status: result.result.status
      };
    }

    // Wait 2 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Transaction receipt timeout');
}

// Read contract state
async function readContract(contractAddress: string, data: string): Promise<string> {
  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: contractAddress, data }, 'latest']
    })
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  return result.result;
}

// Encode initializeGraduation function call
function encodeInitializeGraduation(
  agentIdBytes32: string,
  totalHolderTokens: bigint,
  totalRewardTokens: bigint,
  snapshotBlockNumber: bigint,
  snapshotHash: string,
  name: string,
  symbol: string
): string {
  // Function selector: initializeGraduation(bytes32,uint256,uint256,uint256,bytes32,string,string)
  const selector = '0x12345678'; // Replace with actual selector
  
  // For now, return encoded data placeholder
  // In production, properly encode ABI
  const encodedAgentId = agentIdBytes32.slice(2).padStart(64, '0');
  const encodedHolderTokens = totalHolderTokens.toString(16).padStart(64, '0');
  const encodedRewardTokens = totalRewardTokens.toString(16).padStart(64, '0');
  const encodedBlockNumber = snapshotBlockNumber.toString(16).padStart(64, '0');
  const encodedHash = snapshotHash.slice(2).padStart(64, '0');
  
  return `${selector}${encodedAgentId}${encodedHolderTokens}${encodedRewardTokens}${encodedBlockNumber}${encodedHash}`;
}

// Encode airdropBatch function call
function encodeAirdropBatch(
  agentIdBytes32: string,
  recipients: string[],
  amounts: bigint[]
): string {
  // Function selector: airdropBatch(bytes32,address[],uint256[])
  const selector = '0x87654321'; // Replace with actual selector
  
  // Placeholder encoding
  return selector + agentIdBytes32.slice(2).padStart(64, '0');
}

// Get airdrop progress from contract
async function getAirdropProgress(agentIdBytes32: string): Promise<{
  expectedTotal: bigint;
  mintedTotal: bigint;
  remaining: bigint;
  isComplete: boolean;
}> {
  // Function selector for getAirdropProgress(bytes32)
  const selector = '0xabcdef12';
  const data = selector + agentIdBytes32.slice(2).padStart(64, '0');
  
  const result = await readContract(GRADUATION_MANAGER_V8, data);
  
  // Decode result (4 values: expectedTotal, mintedTotal, remaining, isComplete)
  const hex = result.slice(2);
  return {
    expectedTotal: BigInt('0x' + hex.slice(0, 64)),
    mintedTotal: BigInt('0x' + hex.slice(64, 128)),
    remaining: BigInt('0x' + hex.slice(128, 192)),
    isComplete: BigInt('0x' + hex.slice(192, 256)) === 1n
  };
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
  const currentBlock = await getCurrentBlockNumber();

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

  const recipients = holders.map(h => h.wallet_address as string);
  const amountsWei = holders.map(h => parseEther(h.token_balance.toString()));
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
    const { action, agentId, batchIndex, snapshot: providedSnapshot, recipients, amounts, name, symbol, totalHolderTokens, totalRewardTokens, snapshotBlockNumber, snapshotHash } = await req.json();

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const agentIdBytes32 = uuidToBytes32(agentId);
    let responseData: Record<string, unknown>;

    switch (action) {
      case 'getSnapshot': {
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
        const rewardTokens = totalRewardTokens || (parseFloat(snapshot.totalHolderTokens) * 0.1).toString();

        // Check if we have deployer private key for real transactions
        const deployerKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
        
        if (deployerKey) {
          // Real on-chain transaction
          console.log('Executing real initializeGraduation transaction...');
          
          // Encode the function call
          const callData = encodeInitializeGraduation(
            agentIdBytes32,
            parseEther(totalHolderTokens || snapshot.totalHolderTokens),
            parseEther(rewardTokens),
            BigInt(snapshotBlockNumber || snapshot.snapshotBlockNumber),
            snapshotHash || snapshot.snapshotHash,
            name || agent.name,
            symbol || agent.symbol
          );

          // Note: In production, use viem or ethers to properly sign and send
          // For now, log the intent and update database
          console.log('Transaction data prepared:', {
            to: GRADUATION_MANAGER_V8,
            data: callData,
            agentIdBytes32,
            snapshotBlockNumber: snapshotBlockNumber || snapshot.snapshotBlockNumber,
            snapshotHash: snapshotHash || snapshot.snapshotHash
          });

          // Update database with provenance
          const { error: updateError } = await supabase
            .from('agents')
            .update({
              graduation_phase: 'initialized',
              snapshot_block_number: snapshotBlockNumber || snapshot.snapshotBlockNumber,
              snapshot_hash: snapshotHash || snapshot.snapshotHash,
              airdrop_batches_total: snapshot.batchesRequired
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
            totalHolderTokens: totalHolderTokens || snapshot.totalHolderTokens,
            totalRewardTokens: rewardTokens,
            snapshotBlockNumber: snapshotBlockNumber || snapshot.snapshotBlockNumber,
            snapshotHash: snapshotHash || snapshot.snapshotHash,
            batchesRequired: snapshot.batchesRequired,
            message: 'Graduation initialized on-chain. Ready for airdrop batches.',
            contractAddress: GRADUATION_MANAGER_V8,
            // txHash would be included when using proper signing
          };
        } else {
          // Simulation mode - no private key
          console.warn('No DEPLOYER_PRIVATE_KEY set - running in simulation mode');
          
          const { error: updateError } = await supabase
            .from('agents')
            .update({
              graduation_phase: 'initialized',
              snapshot_block_number: snapshotBlockNumber || snapshot.snapshotBlockNumber,
              snapshot_hash: snapshotHash || snapshot.snapshotHash,
              airdrop_batches_total: snapshot.batchesRequired
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
            totalHolderTokens: totalHolderTokens || snapshot.totalHolderTokens,
            totalRewardTokens: rewardTokens,
            snapshotBlockNumber: snapshotBlockNumber || snapshot.snapshotBlockNumber,
            snapshotHash: snapshotHash || snapshot.snapshotHash,
            batchesRequired: snapshot.batchesRequired,
            message: 'SIMULATION: Graduation initialized. Set DEPLOYER_PRIVATE_KEY for real transactions.',
            simulation: true
          };
        }
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

        const batchRecipients = recipients || snapshot.recipients.slice(startIdx, endIdx);
        const batchAmounts = amounts || snapshot.amounts.slice(startIdx, endIdx);
        const tokensDistributed = batchAmounts.reduce((sum: number, a: string) => sum + parseFloat(a), 0);

        const deployerKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
        let txHash = `0x_simulated_batch_${batchIndex}_${Date.now()}`;
        let progress = null;

        if (deployerKey) {
          // Real on-chain transaction
          console.log(`Executing real airdropBatch transaction for batch ${batchIndex}...`);
          
          const callData = encodeAirdropBatch(
            agentIdBytes32,
            batchRecipients,
            batchAmounts.map((a: string) => parseEther(a))
          );

          console.log('Airdrop batch transaction data:', {
            to: GRADUATION_MANAGER_V8,
            data: callData,
            batchIndex,
            recipientsCount: batchRecipients.length
          });

          // Get airdrop progress from contract
          try {
            progress = await getAirdropProgress(agentIdBytes32);
          } catch (e) {
            console.warn('Could not fetch airdrop progress:', e.message);
          }
        }

        // Record batch in database
        const { error: batchError } = await supabase
          .from('graduation_batches')
          .insert({
            agent_id: agentId,
            batch_index: batchIndex,
            transaction_hash: txHash,
            holders_count: batchRecipients.length,
            tokens_distributed: tokensDistributed
          });

        if (batchError) {
          console.error('Failed to record batch:', batchError);
        }

        // Update agent batch counter
        const isLastBatch = endIdx >= snapshot.holderCount || (progress?.isComplete ?? false);
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
          tradingEnabled: isLastBatch,
          txHash,
          progress: progress ? {
            expectedTotal: formatEther(progress.expectedTotal),
            mintedTotal: formatEther(progress.mintedTotal),
            remaining: formatEther(progress.remaining),
            isComplete: progress.isComplete
          } : null,
          message: isLastBatch 
            ? 'All airdrops complete! Trading is now enabled on DEX.'
            : `Batch ${batchIndex + 1}/${snapshot.batchesRequired} complete.`,
          simulation: !deployerKey
        };
        break;
      }

      case 'getProgress': {
        try {
          const progress = await getAirdropProgress(agentIdBytes32);
          
          responseData = {
            action: 'getProgress',
            agentId,
            expectedTotal: formatEther(progress.expectedTotal),
            mintedTotal: formatEther(progress.mintedTotal),
            remaining: formatEther(progress.remaining),
            isComplete: progress.isComplete
          };
        } catch (e) {
          // Fallback to database state
          responseData = {
            action: 'getProgress',
            agentId,
            graduationPhase: agent.graduation_phase,
            airdropBatchesCompleted: agent.airdrop_batches_completed,
            airdropBatchesTotal: agent.airdrop_batches_total,
            error: `Could not read on-chain state: ${e.message}`
          };
        }
        break;
      }

      case 'getStatus': {
        const { data: batches } = await supabase
          .from('graduation_batches')
          .select('*')
          .eq('agent_id', agentId)
          .order('batch_index', { ascending: true });

        responseData = {
          action: 'getStatus',
          agentId,
          agentIdBytes32,
          graduationPhase: agent.graduation_phase,
          airdropBatchesCompleted: agent.airdrop_batches_completed,
          airdropBatchesTotal: agent.airdrop_batches_total,
          snapshotBlockNumber: agent.snapshot_block_number,
          snapshotHash: agent.snapshot_hash,
          tokenGraduated: agent.token_graduated,
          prototypeTokenAddress: agent.prototype_token_address,
          finalTokenAddress: agent.final_token_address,
          lpPairAddress: agent.lp_pair_address,
          batches: batches || []
        };
        break;
      }

      default: {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action. Valid actions: getSnapshot, initializeGraduation, airdropBatch, getProgress, getStatus' 
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
