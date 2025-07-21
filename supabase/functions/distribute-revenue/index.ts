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

// Helper function to log revenue failures
async function logRevenueFailure(
  agentId: string,
  distributionId: string | null,
  recipientType: 'creator' | 'platform',
  intendedRecipient: string,
  amount: number,
  failureReason: string
) {
  const { error } = await supabase
    .from('revenue_failures')
    .insert({
      agent_id: agentId,
      distribution_id: distributionId,
      recipient_type: recipientType,
      intended_recipient: intendedRecipient,
      amount,
      failure_reason: failureReason
    })

  if (error) {
    console.error('Failed to log revenue failure:', error)
  } else {
    console.log(`Logged revenue failure: ${recipientType} ${intendedRecipient} - ${failureReason}`)
  }
}

// Helper function to simulate wallet transfer (replace with real payment logic)
async function transferToWallet(walletAddress: string, amount: number, currency: string = 'USD'): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  
  // Simulate failure scenarios for testing
  if (Math.random() < 0.1) { // 10% failure rate
    const failures = [
      'Network timeout',
      'Insufficient gas',
      'Wallet temporarily unavailable',
      'Transaction limit exceeded',
      'Invalid wallet address'
    ]
    throw new Error(failures[Math.floor(Math.random() * failures.length)])
  }

  console.log(`✅ Successfully transferred ${amount} ${currency} to ${walletAddress}`)
}

// Helper function to distribute revenue with comprehensive error handling
async function distributeRevenueWithRetry(agentId: string, transactionHash: string, totalRevenue: number) {
  let distributionId: string | null = null
  let hasFailures = false
  const results = {
    creatorPayout: { success: false, amount: 0, wallet: '', error: '' },
    platformPayout: { success: false, amount: 0, wallet: '', error: '' }
  }

  try {
    console.log(`🚀 Starting revenue distribution for agent ${agentId}, total: $${totalRevenue}`)

    // Get revenue configuration with defaults
    let revenueConfig = null
    const { data: configData } = await supabase
      .from('revenue_config')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (!configData) {
      // Create default config if none exists
      const { data: newConfig, error: configError } = await supabase
        .from('revenue_config')
        .insert({
          agent_id: agentId,
          fee_percent: 0.01,
          creator_split: 0.7,
          platform_split: 0.3
        })
        .select()
        .single()

      if (configError) {
        throw new Error(`Failed to create default revenue config: ${configError.message}`)
      }
      revenueConfig = newConfig
      console.log('Created default revenue configuration (1% fee, 70/30 split)')
    } else {
      revenueConfig = configData
    }

    // Calculate amounts
    const feeAmount = totalRevenue * revenueConfig.fee_percent
    const creatorAmount = feeAmount * revenueConfig.creator_split
    const platformAmount = feeAmount * revenueConfig.platform_split

    console.log(`💰 Fee calculation: ${(revenueConfig.fee_percent * 100).toFixed(1)}% fee = $${feeAmount.toFixed(4)}`)
    console.log(`👤 Creator share: ${(revenueConfig.creator_split * 100)}% = $${creatorAmount.toFixed(4)}`)
    console.log(`🏢 Platform share: ${(revenueConfig.platform_split * 100)}% = $${platformAmount.toFixed(4)}`)

    // Get agent and creator information
    const { data: agent } = await supabase
      .from('agents')
      .select('creator_id, creator_wallet_address, creator_ens_name, name')
      .eq('id', agentId)
      .single()

    if (!agent) {
      throw new Error('Agent not found')
    }

    // Determine wallet addresses
    const creatorWallet = revenueConfig.creator_wallet_address || agent.creator_wallet_address
    const platformWallet = revenueConfig.platform_wallet_address

    // Create distribution record
    const { data: distribution, error: distributionError } = await supabase
      .from('revenue_distributions')
      .insert({
        agent_id: agentId,
        transaction_hash: transactionHash,
        total_revenue: totalRevenue,
        fee_amount: feeAmount,
        creator_amount: creatorAmount,
        platform_amount: platformAmount,
        creator_wallet: creatorWallet,
        platform_wallet: platformWallet,
        status: 'pending',
        processed_by: 'distribute-revenue-v2'
      })
      .select()
      .single()

    if (distributionError) {
      throw new Error(`Failed to create distribution record: ${distributionError.message}`)
    }

    distributionId = distribution.id
    console.log(`📊 Created distribution record: ${distributionId}`)

    // Attempt creator payout
    if (!creatorWallet) {
      const failureReason = 'No wallet address configured for creator'
      await logRevenueFailure(agentId, distributionId, 'creator', agent.creator_id || 'unknown', creatorAmount, failureReason)
      results.creatorPayout = { success: false, amount: creatorAmount, wallet: '', error: failureReason }
      hasFailures = true
    } else {
      try {
        await transferToWallet(creatorWallet, creatorAmount)
        results.creatorPayout = { success: true, amount: creatorAmount, wallet: creatorWallet, error: '' }
        console.log(`✅ Creator payout successful: $${creatorAmount} to ${creatorWallet}`)
      } catch (error) {
        const failureReason = `Creator payout failed: ${error.message}`
        await logRevenueFailure(agentId, distributionId, 'creator', creatorWallet, creatorAmount, failureReason)
        results.creatorPayout = { success: false, amount: creatorAmount, wallet: creatorWallet, error: failureReason }
        hasFailures = true
        console.error(`❌ Creator payout failed: ${error.message}`)
      }
    }

    // Attempt platform payout
    if (!platformWallet) {
      const failureReason = 'No platform wallet address configured'
      await logRevenueFailure(agentId, distributionId, 'platform', 'platform_treasury', platformAmount, failureReason)
      results.platformPayout = { success: false, amount: platformAmount, wallet: '', error: failureReason }
      hasFailures = true
    } else {
      try {
        await transferToWallet(platformWallet, platformAmount)
        results.platformPayout = { success: true, amount: platformAmount, wallet: platformWallet, error: '' }
        console.log(`✅ Platform payout successful: $${platformAmount} to ${platformWallet}`)
      } catch (error) {
        const failureReason = `Platform payout failed: ${error.message}`
        await logRevenueFailure(agentId, distributionId, 'platform', platformWallet, platformAmount, failureReason)
        results.platformPayout = { success: false, amount: platformAmount, wallet: platformWallet, error: failureReason }
        hasFailures = true
        console.error(`❌ Platform payout failed: ${error.message}`)
      }
    }

    // Update distribution status
    const finalStatus = hasFailures ? 'completed' : 'completed' // Mark as completed even with partial failures
    await supabase
      .from('revenue_distributions')
      .update({
        status: finalStatus,
        has_failures: hasFailures,
        processed_by: 'distribute-revenue-v2'
      })
      .eq('id', distributionId)

    // Log activity
    await supabase
      .from('agent_activities')
      .insert({
        agent_id: agentId,
        activity_type: 'revenue_distribution',
        title: 'Revenue Distribution (70/30 Split)',
        description: `Distributed $${feeAmount.toFixed(4)} in trading fees (${hasFailures ? 'with failures' : 'successfully'})`,
        status: hasFailures ? 'completed_with_errors' : 'completed',
        result: {
          total_revenue: totalRevenue,
          fee_amount: feeAmount,
          creator_payout: results.creatorPayout,
          platform_payout: results.platformPayout,
          has_failures: hasFailures,
          distribution_id: distributionId
        }
      })

    return {
      success: true,
      distributionId,
      hasFailures,
      results,
      totalFee: feeAmount
    }

  } catch (error) {
    console.error('❌ Revenue distribution error:', error)
    
    // Update distribution as failed if we have an ID
    if (distributionId) {
      await supabase
        .from('revenue_distributions')
        .update({
          status: 'failed',
          error_reason: error.message,
          processed_by: 'distribute-revenue-v2'
        })
        .eq('id', distributionId)
    }

    throw error
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, transactionHash, totalRevenue } = await req.json();
    
    if (!agentId || !totalRevenue || totalRevenue <= 0) {
      throw new Error('Invalid agentId or totalRevenue');
    }

    console.log(`[REVENUE-DISTRIBUTION-V2] Processing revenue split for agent ${agentId}: $${totalRevenue}`)

    const result = await distributeRevenueWithRetry(agentId, transactionHash || `auto-${Date.now()}`, totalRevenue)

    return new Response(JSON.stringify({
      success: true,
      message: result.hasFailures 
        ? `Revenue distribution completed with some failures. Check admin panel for retry options.`
        : `Revenue successfully distributed using 70/30 creator/platform split`,
      distribution_id: result.distributionId,
      total_fee: result.totalFee,
      has_failures: result.hasFailures,
      payouts: result.results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[REVENUE-DISTRIBUTION-V2] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});