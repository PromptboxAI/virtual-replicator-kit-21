import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Simulate wallet transfer (same as in distribute-revenue)
async function transferToWallet(walletAddress: string, amount: number, currency: string = 'USD'): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  
  // Reduced failure rate for retries (5% instead of 10%)
  if (Math.random() < 0.05) {
    const failures = [
      'Network timeout',
      'Insufficient gas', 
      'Wallet temporarily unavailable',
      'Transaction limit exceeded'
    ]
    throw new Error(failures[Math.floor(Math.random() * failures.length)])
  }

  console.log(`✅ Retry successful: ${amount} ${currency} to ${walletAddress}`)
}

// Retry a single failed payout
async function retryFailedPayout(failureId: string) {
  try {
    // Get the failure record
    const { data: failure, error: fetchError } = await supabase
      .from('revenue_failures')
      .select('*')
      .eq('id', failureId)
      .single()

    if (fetchError || !failure) {
      throw new Error('Failed to fetch failure record')
    }

    // Check if already resolved or exceeded max retries
    if (failure.status === 'resolved') {
      return { success: true, message: 'Already resolved', skipped: true }
    }

    if (failure.status === 'abandoned') {
      return { success: false, message: 'Payout abandoned (max retries exceeded)', skipped: true }
    }

    if (failure.retry_count >= failure.max_retries) {
      // Mark as abandoned
      await supabase
        .from('revenue_failures')
        .update({
          status: 'abandoned',
          updated_at: new Date().toISOString()
        })
        .eq('id', failureId)

      return { success: false, message: 'Max retries exceeded, marked as abandoned', skipped: true }
    }

    console.log(`🔄 Retrying payout: ${failure.recipient_type} ${failure.intended_recipient} - $${failure.amount}`)

    // Update status to retrying
    await supabase
      .from('revenue_failures')
      .update({
        status: 'retrying',
        retry_count: failure.retry_count + 1,
        last_retry_at: new Date().toISOString()
      })
      .eq('id', failureId)

    // Attempt the payout
    await transferToWallet(failure.intended_recipient, failure.amount)

    // Mark as resolved
    await supabase
      .from('revenue_failures')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', failureId)

    console.log(`✅ Retry successful for ${failure.recipient_type}: $${failure.amount}`)

    return {
      success: true,
      message: `Successfully retried ${failure.recipient_type} payout of $${failure.amount}`,
      failureId,
      retryCount: failure.retry_count + 1
    }

  } catch (error) {
    console.error(`❌ Retry failed for ${failureId}:`, error.message)

    // Update failure record with new error
    await supabase
      .from('revenue_failures')
      .update({
        status: 'pending',
        failure_reason: `${failure?.failure_reason || 'Unknown'} | Retry ${failure?.retry_count + 1 || 1}: ${error.message}`
      })
      .eq('id', failureId)

    return {
      success: false,
      message: `Retry failed: ${error.message}`,
      failureId
    }
  }
}

// Retry all pending failures for an agent
async function retryAgentFailures(agentId: string) {
  const { data: failures, error } = await supabase
    .from('revenue_failures')
    .select('*')
    .eq('agent_id', agentId)
    .in('status', ['pending', 'retrying'])
    .lt('retry_count', supabase.raw('max_retries'))

  if (error) {
    throw new Error(`Failed to fetch failures: ${error.message}`)
  }

  if (!failures || failures.length === 0) {
    return { success: true, message: 'No pending failures to retry', results: [] }
  }

  console.log(`🔄 Retrying ${failures.length} failed payouts for agent ${agentId}`)

  const results = []
  for (const failure of failures) {
    const result = await retryFailedPayout(failure.id)
    results.push({
      failureId: failure.id,
      recipientType: failure.recipient_type,
      amount: failure.amount,
      ...result
    })
  }

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success && !r.skipped).length
  const skipped = results.filter(r => r.skipped).length

  return {
    success: true,
    message: `Retry complete: ${successful} successful, ${failed} failed, ${skipped} skipped`,
    results,
    summary: { successful, failed, skipped, total: results.length }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, failureId, agentId } = await req.json();

    console.log(`[RETRY-PAYOUTS] Action: ${action}, FailureID: ${failureId}, AgentID: ${agentId}`)

    let result;

    switch (action) {
      case 'retry_single':
        if (!failureId) {
          throw new Error('failureId is required for retry_single action')
        }
        result = await retryFailedPayout(failureId)
        break;

      case 'retry_agent':
        if (!agentId) {
          throw new Error('agentId is required for retry_agent action')
        }
        result = await retryAgentFailures(agentId)
        break;

      case 'retry_all_pending':
        // Get all pending failures across all agents
        const { data: allFailures, error } = await supabase
          .from('revenue_failures')
          .select('agent_id')
          .in('status', ['pending', 'retrying'])
          .lt('retry_count', supabase.raw('max_retries'))

        if (error) {
          throw new Error(`Failed to fetch pending failures: ${error.message}`)
        }

        const uniqueAgents = [...new Set(allFailures?.map(f => f.agent_id) || [])]
        console.log(`🔄 Retrying failures for ${uniqueAgents.length} agents`)

        const agentResults = []
        for (const agentId of uniqueAgents) {
          const agentResult = await retryAgentFailures(agentId)
          agentResults.push({ agentId, ...agentResult })
        }

        result = {
          success: true,
          message: `Processed ${uniqueAgents.length} agents`,
          agentResults
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[RETRY-PAYOUTS] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});