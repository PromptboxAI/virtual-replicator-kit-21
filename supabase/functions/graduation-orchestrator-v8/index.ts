import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  encodeFunctionData,
} from "https://esm.sh/viem@2.7.0";
import { baseSepolia } from "https://esm.sh/viem@2.7.0/chains";
import { privateKeyToAccount } from "https://esm.sh/viem@2.7.0/accounts";

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
function uuidToBytes32(uuid: string): `0x${string}` {
  const cleanUuid = uuid.replace(/-/g, '');
  return `0x${cleanUuid.padStart(64, '0')}` as `0x${string}`;
}

// GraduationManagerV8 ABI
const GRADUATION_ABI = [
  {
    name: 'initializeGraduation',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'totalHolderTokens', type: 'uint256' },
      { name: 'totalRewardTokens', type: 'uint256' },
      { name: 'snapshotBlockNumber', type: 'uint256' },
      { name: 'snapshotHash', type: 'bytes32' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'airdropBatch',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'bytes32' },
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    outputs: []
  },
  {
    name: 'getAirdropProgress',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'bytes32' }],
    outputs: [
      { name: 'expectedTotal', type: 'uint256' },
      { name: 'mintedTotal', type: 'uint256' },
      { name: 'remaining', type: 'uint256' },
      { name: 'isComplete', type: 'bool' }
    ]
  }
] as const;

interface SnapshotData {
  recipients: `0x${string}`[];
  amounts: bigint[];
  amountsFormatted: string[];
  totalHolderTokens: bigint;
  totalHolderTokensFormatted: string;
  holderCount: number;
  batchesRequired: number;
  snapshotBlockNumber: bigint;
  snapshotHash: `0x${string}`;
}

// Get snapshot from indexed_holder_balances
async function getSnapshot(supabase: ReturnType<typeof createClient>, agentId: string, publicClient: ReturnType<typeof createPublicClient>): Promise<SnapshotData> {
  const currentBlock = await publicClient.getBlockNumber();

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

  const recipients = holders.map(h => h.wallet_address.toLowerCase() as `0x${string}`);
  const amounts = holders.map(h => parseEther(h.token_balance.toString()));

  // Compute snapshot hash: keccak256(abi.encode(address[], uint256[]))
  const snapshotHash = keccak256(
    encodeAbiParameters(
      parseAbiParameters('address[], uint256[]'),
      [recipients, amounts]
    )
  );

  const totalHolderTokens = amounts.reduce((sum, a) => sum + a, 0n);

  return {
    recipients,
    amounts,
    amountsFormatted: holders.map(h => h.token_balance.toString()),
    totalHolderTokens,
    totalHolderTokensFormatted: formatEther(totalHolderTokens),
    holderCount: holders.length,
    batchesRequired: Math.ceil(holders.length / BATCH_SIZE),
    snapshotBlockNumber: currentBlock,
    snapshotHash
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, agentId, batchIndex } = body;

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create viem clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(BASE_SEPOLIA_RPC)
    });

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
      // =========================================================================
      // ACTION: getSnapshot
      // =========================================================================
      case 'getSnapshot': {
        const snapshot = await getSnapshot(supabase, agentId, publicClient);

        responseData = {
          action: 'getSnapshot',
          agentId,
          recipients: snapshot.recipients,
          amounts: snapshot.amountsFormatted,
          totalHolderTokens: snapshot.totalHolderTokensFormatted,
          holderCount: snapshot.holderCount,
          batchesRequired: snapshot.batchesRequired,
          snapshotBlockNumber: snapshot.snapshotBlockNumber.toString(),
          snapshotHash: snapshot.snapshotHash,
          graduationThreshold: GRADUATION_THRESHOLD,
          isEligible: parseFloat(agent.prompt_raised || '0') >= parseFloat(GRADUATION_THRESHOLD)
        };
        break;
      }

      // =========================================================================
      // ACTION: initializeGraduation
      // Execute REAL on-chain transaction to GraduationManagerV8
      // =========================================================================
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

        if (agent.graduation_phase !== 'not_started' && agent.graduation_phase !== null) {
          return new Response(
            JSON.stringify({ 
              error: `Graduation already in progress. Current phase: ${agent.graduation_phase}` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get deployer private key
        const deployerKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
        if (!deployerKey) {
          return new Response(
            JSON.stringify({ error: 'DEPLOYER_PRIVATE_KEY not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get fresh snapshot
        const snapshot = await getSnapshot(supabase, agentId, publicClient);
        const totalRewardTokens = snapshot.totalHolderTokens * 10n / 100n; // 10% rewards

        // Create wallet client
        const account = privateKeyToAccount(deployerKey as `0x${string}`);
        const walletClient = createWalletClient({
          account,
          chain: baseSepolia,
          transport: http(BASE_SEPOLIA_RPC)
        });

        console.log('Executing initializeGraduation transaction...', {
          agentIdBytes32,
          totalHolderTokens: snapshot.totalHolderTokensFormatted,
          totalRewardTokens: formatEther(totalRewardTokens),
          snapshotBlockNumber: snapshot.snapshotBlockNumber.toString(),
          snapshotHash: snapshot.snapshotHash,
          name: agent.name,
          symbol: agent.symbol
        });

        // Execute the on-chain transaction
        const txHash = await walletClient.writeContract({
          address: GRADUATION_MANAGER_V8 as `0x${string}`,
          abi: GRADUATION_ABI,
          functionName: 'initializeGraduation',
          args: [
            agentIdBytes32,
            snapshot.totalHolderTokens,
            totalRewardTokens,
            snapshot.snapshotBlockNumber,
            snapshot.snapshotHash,
            agent.name,
            agent.symbol
          ]
        });

        console.log('Transaction submitted:', txHash);

        // Wait for receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // Update database with provenance
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            graduation_phase: 'initialized',
            snapshot_block_number: snapshot.snapshotBlockNumber.toString(),
            snapshot_hash: snapshot.snapshotHash,
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
          txHash,
          blockNumber: receipt.blockNumber.toString(),
          graduationPhase: 'initialized',
          totalHolderTokens: snapshot.totalHolderTokensFormatted,
          totalRewardTokens: formatEther(totalRewardTokens),
          snapshotBlockNumber: snapshot.snapshotBlockNumber.toString(),
          snapshotHash: snapshot.snapshotHash,
          batchesRequired: snapshot.batchesRequired,
          message: 'Graduation initialized on-chain. Ready for airdrop batches.'
        };
        break;
      }

      // =========================================================================
      // ACTION: airdropBatch
      // Execute REAL on-chain airdrop batch
      // =========================================================================
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

        const deployerKey = Deno.env.get('DEPLOYER_PRIVATE_KEY');
        if (!deployerKey) {
          return new Response(
            JSON.stringify({ error: 'DEPLOYER_PRIVATE_KEY not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get snapshot
        const snapshot = await getSnapshot(supabase, agentId, publicClient);
        
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

        // Create wallet client
        const account = privateKeyToAccount(deployerKey as `0x${string}`);
        const walletClient = createWalletClient({
          account,
          chain: baseSepolia,
          transport: http(BASE_SEPOLIA_RPC)
        });

        console.log(`Executing airdropBatch ${batchIndex}...`, {
          recipientsCount: batchRecipients.length,
          batchIndex
        });

        // Execute the on-chain transaction
        const txHash = await walletClient.writeContract({
          address: GRADUATION_MANAGER_V8 as `0x${string}`,
          abi: GRADUATION_ABI,
          functionName: 'airdropBatch',
          args: [agentIdBytes32, batchRecipients, batchAmounts]
        });

        console.log('Airdrop batch transaction submitted:', txHash);

        // Wait for receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log('Airdrop batch confirmed in block:', receipt.blockNumber);

        // Check if graduation is complete
        const [expectedTotal, mintedTotal, remaining, isComplete] = await publicClient.readContract({
          address: GRADUATION_MANAGER_V8 as `0x${string}`,
          abi: GRADUATION_ABI,
          functionName: 'getAirdropProgress',
          args: [agentIdBytes32]
        });

        // Record batch in database
        const tokensDistributed = batchAmounts.reduce((sum, a) => sum + a, 0n);
        await supabase.from('graduation_batches').insert({
          agent_id: agentId,
          batch_index: batchIndex,
          transaction_hash: txHash,
          holders_count: batchRecipients.length,
          tokens_distributed: Number(formatEther(tokensDistributed))
        });

        // Update agent status
        const newPhase = isComplete ? 'completed' : 'airdropping';
        await supabase.from('agents').update({
          graduation_phase: newPhase,
          airdrop_batches_completed: batchIndex + 1,
          token_graduated: isComplete
        }).eq('id', agentId);

        responseData = {
          action: 'airdropBatch',
          agentId,
          batchIndex,
          txHash,
          blockNumber: receipt.blockNumber.toString(),
          recipientsCount: batchRecipients.length,
          tokensDistributed: formatEther(tokensDistributed),
          isLastBatch: isComplete,
          graduationPhase: newPhase,
          tradingEnabled: isComplete,
          progress: {
            expectedTotal: formatEther(expectedTotal),
            mintedTotal: formatEther(mintedTotal),
            remaining: formatEther(remaining),
            isComplete
          },
          message: isComplete 
            ? 'All airdrops complete! Trading is now enabled on DEX.'
            : `Batch ${batchIndex + 1}/${snapshot.batchesRequired} complete.`
        };
        break;
      }

      // =========================================================================
      // ACTION: getProgress
      // =========================================================================
      case 'getProgress': {
        try {
          const [expectedTotal, mintedTotal, remaining, isComplete] = await publicClient.readContract({
            address: GRADUATION_MANAGER_V8 as `0x${string}`,
            abi: GRADUATION_ABI,
            functionName: 'getAirdropProgress',
            args: [agentIdBytes32]
          });
          
          responseData = {
            action: 'getProgress',
            agentId,
            expectedTotal: formatEther(expectedTotal),
            mintedTotal: formatEther(mintedTotal),
            remaining: formatEther(remaining),
            isComplete
          };
        } catch (e) {
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

      // =========================================================================
      // ACTION: getStatus
      // =========================================================================
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
