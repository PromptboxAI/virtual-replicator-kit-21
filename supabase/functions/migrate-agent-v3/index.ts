import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

interface MigrateAgentRequest {
  agentId?: string;
  dryRun?: boolean;
  batchSize?: number;
  migrateAll?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { agentId, dryRun = false, batchSize = 10, migrateAll = false }: MigrateAgentRequest = await req.json();

    console.log(`🔄 Starting migration to V3 - DryRun: ${dryRun}, BatchSize: ${batchSize}`);

    let agentsToMigrate = [];

    if (migrateAll) {
      // Get all agents that need migration
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .or('pricing_model.is.null,pricing_model.eq.legacy_amm')
        .eq('is_active', true)
        .limit(batchSize);

      if (agentsError) {
        throw new Error(`Failed to fetch agents: ${agentsError.message}`);
      }

      agentsToMigrate = agents || [];
    } else if (agentId) {
      // Get specific agent
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError) {
        throw new Error(`Agent not found: ${agentError.message}`);
      }

      agentsToMigrate = [agent];
    } else {
      throw new Error('Either agentId or migrateAll must be specified');
    }

    console.log(`📊 Found ${agentsToMigrate.length} agents to migrate`);

    const results = [];

    // Process each agent
    for (const agent of agentsToMigrate) {
      console.log(`\n🔄 Processing agent: ${agent.name} (${agent.id})`);

      try {
        // Run dry-run validation first
        const { data: dryRunResult, error: dryRunError } = await supabase.rpc(
          'dry_run_agent_migration',
          { p_agent_id: agent.id }
        );

        if (dryRunError) {
          throw new Error(`Dry run failed: ${dryRunError.message}`);
        }

        const migrationData = dryRunResult[0];
        
        if (!migrationData.validation_passed) {
          console.log(`❌ Validation failed for ${agent.name}:`, migrationData.validation_errors);
          results.push({
            agentId: agent.id,
            agentName: agent.name,
            success: false,
            error: `Validation failed: ${migrationData.validation_errors.join(', ')}`,
            migrationData
          });
          continue;
        }

        console.log(`✅ Validation passed for ${agent.name}`);
        console.log(`  Current Price: ${migrationData.current_price}`);
        console.log(`  New Price: ${migrationData.new_price}`);
        console.log(`  Price Change: ${migrationData.price_change_percent.toFixed(2)}%`);

        if (dryRun) {
          // Just return the dry run results
          results.push({
            agentId: agent.id,
            agentName: agent.name,
            success: true,
            dryRun: true,
            migrationData
          });
          continue;
        }

        // Perform actual migration
        console.log(`🚀 Migrating ${agent.name} to V3...`);

        // Store rollback data
        const rollbackData = {
          pricing_model: agent.pricing_model || 'legacy_amm',
          current_price: agent.current_price,
          bonding_curve_supply: agent.bonding_curve_supply,
          migration_validated: agent.migration_validated
        };

        // Create migration state record
        const { data: migrationState, error: stateError } = await supabase
          .from('agent_migration_state')
          .insert({
            agent_id: agent.id,
            migration_phase: 'in_progress',
            old_price: migrationData.current_price,
            new_price: migrationData.new_price,
            old_supply: migrationData.current_supply,
            new_supply: migrationData.new_supply,
            validation_passed: true,
            rollback_data: rollbackData
          })
          .select()
          .single();

        if (stateError) {
          throw new Error(`Failed to create migration state: ${stateError.message}`);
        }

        // Update agent with V3 parameters
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            pricing_model: 'linear_v3',
            current_price: migrationData.new_price,
            bonding_curve_supply: migrationData.new_supply,
            migration_validated: true,
            migration_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', agent.id);

        if (updateError) {
          throw new Error(`Failed to update agent: ${updateError.message}`);
        }

        // Update migration state to completed
        await supabase
          .from('agent_migration_state')
          .update({
            migration_phase: 'completed',
            migration_completed_at: new Date().toISOString()
          })
          .eq('id', migrationState.id);

        // Create price snapshot to maintain chart continuity
        await supabase
          .from('agent_price_snapshots')
          .insert({
            agent_id: agent.id,
            price: migrationData.new_price,
            market_cap: migrationData.new_price * migrationData.new_supply,
            circulating_supply: migrationData.new_supply,
            prompt_raised: agent.prompt_raised,
            holders_count: agent.token_holders || 0,
            timestamp: new Date().toISOString()
          });

        console.log(`✅ Successfully migrated ${agent.name} to V3`);

        results.push({
          agentId: agent.id,
          agentName: agent.name,
          success: true,
          migrationData,
          migrationStateId: migrationState.id
        });

      } catch (agentError) {
        console.error(`❌ Failed to migrate ${agent.name}:`, agentError);
        results.push({
          agentId: agent.id,
          agentName: agent.name,
          success: false,
          error: agentError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`\n📊 Migration Summary:`);
    console.log(`  Total Processed: ${results.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${failureCount}`);
    console.log(`  Dry Run: ${dryRun}`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        totalProcessed: results.length,
        successCount,
        failureCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Migration process failed:', error);
    
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