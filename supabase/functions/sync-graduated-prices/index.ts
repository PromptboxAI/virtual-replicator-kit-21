import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { createPublicClient, http, formatUnits } from 'https://esm.sh/viem@2.7.0';
import { baseSepolia } from 'https://esm.sh/viem@2.7.0/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uniswap V3 Pool ABI for price queries
const UNISWAP_V3_POOL_ABI = [
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      {"internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"},
      {"internalType": "int24", "name": "tick", "type": "int24"},
      {"internalType": "uint16", "name": "observationIndex", "type": "uint16"},
      {"internalType": "uint16", "name": "observationCardinality", "type": "uint16"},
      {"internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16"},
      {"internalType": "uint8", "name": "feeProtocol", "type": "uint8"},
      {"internalType": "bool", "name": "unlocked", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

interface GraduatedAgent {
  id: string;
  name: string;
  symbol: string;
  token_address: string;
  graduation_event_id: string;
  prompt_raised: number;
  current_price: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Handle cron job calls
  const requestBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const isScheduledRun = requestBody.scheduled === true;
  const jobName = 'sync-graduated-prices';
  
  let cronLogId: string | null = null;

  try {
    console.log(`🔄 Starting graduated agent price sync... ${isScheduledRun ? '(Scheduled)' : '(Manual)'}`);
    
    // Log cron job start if scheduled
    if (isScheduledRun) {
      const { data: cronLog, error: cronLogError } = await supabase
        .from('cron_job_logs')
        .insert({
          job_name: jobName,
          status: 'running',
          metadata: { request_timestamp: requestBody.timestamp }
        })
        .select('id')
        .single();
        
      if (cronLogError) {
        console.error('❌ Error creating cron log:', cronLogError);
      } else {
        cronLogId = cronLog?.id;
      }
    }

    // Get all graduated agents that need price updates
    const { data: graduatedAgents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, symbol, token_address, graduation_event_id, prompt_raised, current_price')
      .eq('token_graduated', true)
      .not('token_address', 'is', null);

    if (agentsError) {
      throw new Error(`Failed to fetch graduated agents: ${agentsError.message}`);
    }

    if (!graduatedAgents || graduatedAgents.length === 0) {
      console.log('📊 No graduated agents found for price sync');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No graduated agents to sync',
          synced: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log(`📊 Found ${graduatedAgents.length} graduated agents to sync`);

    // Get PROMPT token address
    const { data: promptContract } = await supabase
      .from('deployed_contracts')
      .select('contract_address')
      .eq('contract_type', 'PROMPT')
      .eq('is_active', true)
      .single();

    if (!promptContract?.contract_address) {
      throw new Error('PROMPT token contract not found');
    }

    const PROMPT_TOKEN = promptContract.contract_address;
    console.log('💰 Using PROMPT token:', PROMPT_TOKEN);

    // Create blockchain client
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(Deno.env.get('PRIMARY_RPC_URL'))
    });

    const priceUpdates = [];
    const analytics = [];
    let successCount = 0;

    for (const agent of graduatedAgents) {
      try {
        console.log(`🔍 Syncing price for ${agent.name} (${agent.symbol})`);

        // Get graduation event details for LP pool address
        const { data: graduationEvent } = await supabase
          .from('agent_graduation_events')
          .select('liquidity_pool_address, liquidity_tx_hash, prompt_raised_at_graduation')
          .eq('id', agent.graduation_event_id)
          .single();

        if (!graduationEvent?.liquidity_pool_address) {
          console.warn(`⚠️ No LP pool address found for ${agent.name}`);
          continue;
        }

        // Query DEX price from Uniswap V3 pool
        let dexPrice = 0;
        let volume24h = 0;
        let marketCap = 0;

        try {
          // Get current price from pool slot0
          const slot0 = await publicClient.readContract({
            address: graduationEvent.liquidity_pool_address as `0x${string}`,
            abi: UNISWAP_V3_POOL_ABI,
            functionName: 'slot0'
          });

          if (slot0 && slot0[0]) {
            // Calculate price from sqrtPriceX96
            const sqrtPriceX96 = slot0[0] as bigint;
            const price = Number(sqrtPriceX96) / (2 ** 96);
            dexPrice = price * price; // sqrtPrice^2 = price

            console.log(`💱 DEX price for ${agent.symbol}: ${dexPrice}`);
          }
        } catch (priceError) {
          console.error(`❌ Failed to get DEX price for ${agent.name}:`, priceError);
          // Use last known price as fallback
          dexPrice = agent.current_price;
        }

        // Calculate 24h volume from recent trades (simplified - would need events in production)
        const { data: recentTrades } = await supabase
          .from('dex_trades')
          .select('src_amount, dst_amount, executed_price')
          .eq('agent_id', agent.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (recentTrades) {
          volume24h = recentTrades.reduce((sum, trade) => {
            const tradeVolume = parseFloat(trade.src_amount) || 0;
            return sum + tradeVolume;
          }, 0);
        }

        // Calculate market cap (simplified)
        const circulatingSupply = 1000000000; // 1B total supply
        marketCap = dexPrice * circulatingSupply;

        // Update agent's current price
        await supabase
          .from('agents')
          .update({
            current_price: dexPrice,
            market_cap: marketCap,
            volume_24h: volume24h,
            updated_at: new Date().toISOString()
          })
          .eq('id', agent.id);

        // Insert price snapshot
        await supabase
          .from('agent_price_snapshots')
          .insert({
            agent_id: agent.id,
            price: dexPrice,
            market_cap: marketCap,
            volume_24h: volume24h,
            circulating_supply: circulatingSupply,
            prompt_raised: graduationEvent.prompt_raised_at_graduation || agent.prompt_raised
          });

        // Update or create graduation analytics
        const lpPromptAmount = (graduationEvent.prompt_raised_at_graduation || agent.prompt_raised) * 0.7;
        const platformTokensValue = 4000000 * dexPrice; // 4M platform tokens

        await supabase
          .from('graduation_analytics')
          .upsert({
            agent_id: agent.id,
            final_prompt_raised: graduationEvent.prompt_raised_at_graduation || agent.prompt_raised,
            final_price: dexPrice,
            dex_price: dexPrice,
            dex_volume_24h: volume24h,
            lp_value_usd: lpPromptAmount + (196000000 * dexPrice), // PROMPT + tokens value
            platform_tokens_value_usd: platformTokensValue,
            lp_prompt_amount: lpPromptAmount,
            lp_pool_address: graduationEvent.liquidity_pool_address,
            lp_lock_tx_hash: graduationEvent.liquidity_tx_hash,
            lp_unlock_date: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
            liquidity_depth_score: volume24h > 1000 ? 8 : volume24h > 100 ? 5 : 2,
            trading_activity_score: volume24h > 5000 ? 9 : volume24h > 1000 ? 6 : 3,
            updated_at: new Date().toISOString()
          });

        priceUpdates.push({
          agent_id: agent.id,
          name: agent.name,
          old_price: agent.current_price,
          new_price: dexPrice,
          volume_24h: volume24h,
          market_cap: marketCap
        });

        successCount++;
        console.log(`✅ Updated ${agent.name}: $${dexPrice.toFixed(6)} (24h vol: ${volume24h})`);

      } catch (agentError) {
        console.error(`❌ Failed to sync ${agent.name}:`, agentError);
      }
    }

    console.log(`🎉 Successfully synced ${successCount}/${graduatedAgents.length} graduated agents`);

    // Update cron job log on success
    if (cronLogId) {
      await supabase
        .from('cron_job_logs')
        .update({
          status: 'success',
          execution_end: new Date().toISOString(),
          metadata: {
            ...requestBody,
            synced_count: successCount,
            total_agents: graduatedAgents.length,
            updates: priceUpdates.length
          }
        })
        .eq('id', cronLogId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${successCount} graduated agent prices`,
        synced: successCount,
        total: graduatedAgents.length,
        updates: priceUpdates
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Price sync failed:', error);
    
    // Update cron job log on failure
    if (cronLogId) {
      await supabase
        .from('cron_job_logs')
        .update({
          status: 'failed',
          execution_end: new Date().toISOString(),
          error_message: error.message,
          retry_count: 0, // Could implement retry logic here
          metadata: {
            ...requestBody,
            error_details: error.stack
          }
        })
        .eq('id', cronLogId);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});