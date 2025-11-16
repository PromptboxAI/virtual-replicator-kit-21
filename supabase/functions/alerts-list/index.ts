import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');

    // Build query
    let query = supabase
      .from('price_alerts')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (statusFilter && ['active', 'triggered', 'cancelled'].includes(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    const { data: alerts, error: alertsError } = await query;

    if (alertsError) {
      console.error('Alerts fetch error:', alertsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch alerts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!alerts || alerts.length === 0) {
      console.log('No alerts for user:', user.id);
      return new Response(
        JSON.stringify({ alerts: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique agent IDs
    const agentIds = [...new Set(alerts.map(a => a.agent_id))];

    // Fetch current agent data
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, symbol, current_price, avatar_url')
      .in('id', agentIds);

    if (agentsError) {
      console.error('Agents fetch error:', agentsError);
      // Return alerts without agent data
      return new Response(
        JSON.stringify({ alerts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enrich alerts with agent data
    const enrichedAlerts = alerts.map(alert => {
      const agent = agents?.find(a => a.id === alert.agent_id);
      return {
        ...alert,
        agent_name: agent?.name,
        agent_symbol: agent?.symbol,
        current_price: agent?.current_price,
        avatar_url: agent?.avatar_url,
        // Calculate if alert should be triggered
        should_trigger: agent?.current_price 
          ? (alert.direction === 'above' && agent.current_price >= alert.threshold_price) ||
            (alert.direction === 'below' && agent.current_price <= alert.threshold_price)
          : false
      };
    });

    console.log(`Fetched ${enrichedAlerts.length} alerts for user ${user.id}`);

    return new Response(
      JSON.stringify({ alerts: enrichedAlerts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in alerts-list:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
