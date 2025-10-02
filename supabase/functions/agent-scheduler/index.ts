import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

// 🚨 CRITICAL WARNING: This scheduler is currently DISABLED in config.toml
// to prevent ghost trades. To re-enable, uncomment the [functions.agent-scheduler]
// section in supabase/config.toml and ensure allow_automated_trading is properly
// configured for each agent.

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Agent scheduler triggered at:', new Date().toISOString());

    // Get all active agents that should run automatically
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, creator_id')
      .eq('is_active', true)
      .eq('status', 'AVAILABLE');

    if (agentsError) {
      throw new Error(`Failed to fetch agents: ${agentsError.message}`);
    }

    console.log(`Found ${agents?.length || 0} active agents to process`);

    if (!agents || agents.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active agents to process',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processedCount = 0;
    let errors: string[] = [];

    // Process each agent
    for (const agent of agents) {
      try {
        // Check if agent has been executed recently (last 15 minutes)
        const { data: recentActivity } = await supabase
          .from('agent_activities')
          .select('created_at')
          .eq('agent_id', agent.id)
          .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
          .limit(1);

        // Skip if recently executed
        if (recentActivity && recentActivity.length > 0) {
          console.log(`Skipping agent ${agent.name} - executed recently`);
          continue;
        }

        // Trigger agent execution
        console.log(`Executing autonomous cycle for agent: ${agent.name}`);
        
        const { data: executeResult, error: executeError } = await supabase.functions.invoke('agent-runtime', {
          body: { 
            action: 'execute_cycle', 
            agentId: agent.id,
            automated: true // Flag to indicate this is automated execution
          }
        });

        if (executeError) {
          errors.push(`${agent.name}: ${executeError.message}`);
          console.error(`Failed to execute agent ${agent.name}:`, executeError);
        } else {
          processedCount++;
          console.log(`Successfully executed agent: ${agent.name}`);
        }

        // Add small delay between executions to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errors.push(`${agent.name}: ${error.message}`);
        console.error(`Error processing agent ${agent.name}:`, error);
      }
    }

    const result = {
      success: true,
      message: `Processed ${processedCount} agents`,
      processed: processedCount,
      total: agents.length,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Scheduler completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scheduler error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});