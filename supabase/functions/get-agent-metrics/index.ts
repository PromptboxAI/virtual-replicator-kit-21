import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId } = await req.json();
    const url = new URL(req.url);
    const includeRanking = url.searchParams.get('includeRanking') === 'true';

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Phase B2: Read only from agent_metrics_normalized view
    const { data: m, error: metricsError } = await supabase
      .from("agent_metrics_normalized")
      .select("*")
      .eq("agent_id", agentId)
      .single();

    if (metricsError || !m) {
      return new Response(
        JSON.stringify({ error: metricsError?.message ?? "Agent not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get graduation evaluation
    const { data: gradEval } = await supabase.rpc("evaluate_graduation", {
      p_agent_id: agentId
    });

    // Get current graduation status (may not exist yet)
    const { data: gradStatus } = await supabase
      .from("agent_graduation")
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle();

    // Evaluate policy logic (ANY)
    let shouldGraduate = false;
    if (gradEval && gradEval.length > 0) {
      const { met, thresholds } = gradEval[0];
      const rules = thresholds?.rules || [];
      const logic = thresholds?.logic || "ANY";

      if (logic === "ANY") {
        shouldGraduate = rules.some((rule: any) => {
          const metricValue = met[rule.metric];
          if (rule.op === ">=") return metricValue >= rule.value;
          if (rule.op === "<=") return metricValue <= rule.value;
          if (rule.op === ">") return metricValue > rule.value;
          if (rule.op === "<") return metricValue < rule.value;
          if (rule.op === "==") return metricValue === rule.value;
          return false;
        });
      } else if (logic === "ALL") {
        shouldGraduate = rules.every((rule: any) => {
          const metricValue = met[rule.metric];
          if (rule.op === ">=") return metricValue >= rule.value;
          if (rule.op === "<=") return metricValue <= rule.value;
          if (rule.op === ">") return metricValue > rule.value;
          if (rule.op === "<") return metricValue < rule.value;
          if (rule.op === "==") return metricValue === rule.value;
          return false;
        });
      }
    }

    // Persist graduation flip atomically
    if ((gradStatus?.status ?? 'pre_grad') === 'pre_grad' && shouldGraduate) {
      const snapshot = {
        met: gradEval[0].met,
        thresholds: gradEval[0].thresholds
      };
      
      await supabase.from('agent_graduation').upsert({
        agent_id: agentId,
        status: 'graduated',
        policy_id: gradEval[0].policy_id,
        triggered_at: new Date().toISOString(),
        reason: 'policy_met',
        snapshot
      }, { onConflict: 'agent_id' });
    }

    // Optionally get ranking from agent_prices_latest
    let ranking = null;
    if (includeRanking) {
      const { data: rankData } = await supabase
        .from('agent_prices_latest')
        .select('agent_id, market_cap')
        .eq('is_active', true)
        .order('market_cap', { ascending: false });
      
      if (rankData) {
        const rank = rankData.findIndex(a => a.agent_id === agentId);
        if (rank !== -1) {
          ranking = {
            rank: rank + 1,
            totalAgents: rankData.length
          };
        }
      }
    }

    // Phase B2: Stringify all numerics, map fx from view
    const payload = {
      agentId,
      price: {
        prompt: String(m.price_prompt),
        usd: m.price_usd == null ? null : String(m.price_usd),
        fx: String(m.fx),  // ✅ Map from view's fx field
        fx_staleness_seconds: Number(m.fx_staleness_seconds ?? 0)
      },
      supply: {
        total: String(m.total_supply),
        circulating: String(m.circulating_supply ?? 0),
        policy: m.supply_policy as 'FDV' | 'CIRCULATING'  // ✅ Use view's policy
      },
      fdv: {
        prompt: String(m.fdv_prompt),
        usd: m.fdv_usd == null ? null : String(m.fdv_usd)
      },
      marketCap: {
        prompt: String(m.mcirc_prompt ?? 0),
        usd: m.mcirc_usd == null ? null : String(m.mcirc_usd)
      },
      graduation: {
        status: gradStatus?.status ?? 'pre_grad',
        policy: gradEval[0]?.policy_name ?? 'DEFAULT_USD_RAISED_80K',
        met: gradEval[0]?.met ?? {},
        thresholds: gradEval[0]?.thresholds ?? {}
      },
      ranking: ranking, // Include ranking if requested
      updatedAt: m.updated_at
    };

    return new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "max-age=5"
      }
    });

  } catch (error: any) {
    console.error("Error in get-agent-metrics:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
