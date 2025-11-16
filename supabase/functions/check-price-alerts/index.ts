import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log('Checking price alerts...');

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select(`
        *,
        agents:agent_id (
          id,
          name,
          symbol,
          current_price
        )
      `)
      .eq('status', 'active');

    if (alertsError) {
      throw alertsError;
    }

    if (!alerts || alerts.length === 0) {
      console.log('No active alerts to check');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active alerts',
          triggered: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking ${alerts.length} active alerts`);

    const triggeredAlerts = [];
    const now = new Date().toISOString();

    for (const alert of alerts) {
      const agent = alert.agents;
      if (!agent) continue;

      const currentPrice = agent.current_price;
      const thresholdPrice = alert.threshold_price;
      let triggered = false;

      if (alert.direction === 'above' && currentPrice >= thresholdPrice) {
        triggered = true;
      } else if (alert.direction === 'below' && currentPrice <= thresholdPrice) {
        triggered = true;
      }

      if (triggered) {
        // Update alert status
        const { error: updateError } = await supabase
          .from('price_alerts')
          .update({
            status: 'triggered',
            triggered_at: now,
            triggered_price: currentPrice
          })
          .eq('id', alert.id);

        if (updateError) {
          console.error(`Error updating alert ${alert.id}:`, updateError);
        } else {
          console.log(`✅ Alert ${alert.id} triggered for ${agent.symbol}: ${currentPrice} ${alert.direction} ${thresholdPrice}`);
          triggeredAlerts.push({
            alertId: alert.id,
            agentId: agent.id,
            agentName: agent.name,
            agentSymbol: agent.symbol,
            direction: alert.direction,
            thresholdPrice: alert.threshold_price,
            currentPrice: currentPrice,
            ownerId: alert.owner_id
          });
        }
      }
    }

    console.log(`Triggered ${triggeredAlerts.length} alerts`);

    return new Response(
      JSON.stringify({ 
        success: true,
        checked: alerts.length,
        triggered: triggeredAlerts.length,
        alerts: triggeredAlerts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-price-alerts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
