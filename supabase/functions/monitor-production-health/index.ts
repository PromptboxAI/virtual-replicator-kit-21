import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthMetrics {
  totalGraduatedAgents: number;
  totalPlatformTokensValueUSD: number;
  avgLPValueUSD: number;
  lowLiquidityAgents: number;
  alerts: Alert[];
}

interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  agent_id?: string;
  metadata?: Record<string, any>;
  dedupe_key: string;
}

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 Starting production health monitoring...');

    // Get all graduated agents with their latest data
    const { data: graduatedAgents, error: agentsError } = await supabase
      .from('agents')
      .select(`
        id, name, symbol, prompt_raised, current_price, token_graduated,
        graduation_analytics(lp_value_usd, lp_unlock_date, platform_tokens_value_usd)
      `)
      .eq('token_graduated', true);

    if (agentsError) {
      console.error('❌ Error fetching graduated agents:', agentsError);
      throw agentsError;
    }

    console.log(`📊 Found ${graduatedAgents?.length || 0} graduated agents`);

    const alerts: Alert[] = [];
    let totalPlatformValue = 0;
    let totalLPValue = 0;
    let lowLiquidityCount = 0;

    // Check each graduated agent for issues
    for (const agent of graduatedAgents || []) {
      const analytics = agent.graduation_analytics?.[0];
      
      if (analytics) {
        totalPlatformValue += Number(analytics.platform_tokens_value_usd || 0);
        totalLPValue += Number(analytics.lp_value_usd || 0);

        // Check for LP unlock approaching (30 days)
        if (analytics.lp_unlock_date) {
          const unlockDate = new Date(analytics.lp_unlock_date);
          const daysUntilUnlock = Math.ceil((unlockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilUnlock <= 30 && daysUntilUnlock > 0) {
            alerts.push({
              type: 'lp_unlock_approaching',
              severity: daysUntilUnlock <= 7 ? 'critical' : 'warning',
              message: `LP tokens for ${agent.name} unlock in ${daysUntilUnlock} days`,
              agent_id: agent.id,
              metadata: { days_until_unlock: daysUntilUnlock },
              dedupe_key: `lp_unlock_${agent.id}_${daysUntilUnlock}`
            });
          }
        }

        // Check for low liquidity ($10k threshold)
        const lpValue = Number(analytics.lp_value_usd || 0);
        if (lpValue < 10000 && lpValue > 0) {
          lowLiquidityCount++;
          alerts.push({
            type: 'low_liquidity',
            severity: lpValue < 5000 ? 'critical' : 'warning',
            message: `Low liquidity for ${agent.name}: $${lpValue.toFixed(2)}`,
            agent_id: agent.id,
            metadata: { lp_value_usd: lpValue },
            dedupe_key: `low_liquidity_${agent.id}_${Math.floor(lpValue / 1000)}`
          });
        }
      }
    }

    // Check for graduation failures (agents with graduation events but not marked as graduated)
    const { data: failedGraduations, error: failedError } = await supabase
      .from('agent_graduation_events')
      .select(`
        id, agent_id, graduation_status, error_message,
        agents(name)
      `)
      .eq('graduation_status', 'failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (failedError) {
      console.error('❌ Error fetching failed graduations:', failedError);
    } else if (failedGraduations && failedGraduations.length > 0) {
      for (const failure of failedGraduations) {
        alerts.push({
          type: 'graduation_failed',
          severity: 'critical',
          message: `Graduation failed for ${failure.agents?.name || 'Unknown'}: ${failure.error_message}`,
          agent_id: failure.agent_id,
          metadata: { graduation_event_id: failure.id, error: failure.error_message },
          dedupe_key: `graduation_failed_${failure.id}`
        });
      }
    }

    // Calculate metrics
    const metrics: HealthMetrics = {
      totalGraduatedAgents: graduatedAgents?.length || 0,
      totalPlatformTokensValueUSD: totalPlatformValue,
      avgLPValueUSD: graduatedAgents?.length ? totalLPValue / graduatedAgents.length : 0,
      lowLiquidityAgents: lowLiquidityCount,
      alerts
    };

    // Store platform health snapshot
    const { error: snapshotError } = await supabase
      .from('platform_health_snapshots')
      .insert({
        total_platform_tokens_value_usd: metrics.totalPlatformTokensValueUSD,
        graduated_agents_count: metrics.totalGraduatedAgents,
        avg_lp_value_usd: metrics.avgLPValueUSD,
        low_liquidity_agents: metrics.lowLiquidityAgents
      });

    if (snapshotError) {
      console.error('❌ Error storing health snapshot:', snapshotError);
    }

    // Store new alerts (with deduplication)
    for (const alert of alerts) {
      const { error: alertError } = await supabase
        .from('system_alerts')
        .upsert({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          agent_id: alert.agent_id,
          metadata: alert.metadata || {},
          dedupe_key: alert.dedupe_key
        }, {
          onConflict: 'dedupe_key',
          ignoreDuplicates: true
        });

      if (alertError) {
        console.error('❌ Error storing alert:', alertError);
      }
    }

    console.log(`✅ Health monitoring complete. Generated ${alerts.length} alerts`);
    console.log(`💰 Total platform value: $${metrics.totalPlatformTokensValueUSD.toFixed(2)}`);

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error in monitor-production-health:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(serve_handler);