import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TradeRequest {
  agentId: string;
  action: 'buy' | 'sell';
  amount: string;
  slippage?: string;
  appMode?: 'test' | 'production';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { agentId, action, amount, slippage = "2", appMode } = await req.json() as TradeRequest;

    console.log(`Trade request: ${action} ${amount} for agent ${agentId}, mode: ${appMode}`);

    // 🔐 PRODUCTION SAFETY: Fetch agent data first
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, symbol, test_mode, token_address, token_graduated')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent lookup failed:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 🚨 HARD BLOCK: Prevent real contract trading in test mode
    const isTestEnvironment = appMode === 'test' || agent.test_mode;
    const hasRealContract = agent.token_graduated && agent.token_address;

    if (isTestEnvironment && hasRealContract) {
      console.warn(`🚨 BLOCKED: Attempted real contract trading in test mode for agent ${agent.name} (${agent.symbol})`);
      return new Response(
        JSON.stringify({ 
          error: "Trading disabled in test mode",
          details: "Real contract interactions are blocked when app is in test mode or agent has test_mode=true",
          agent: { name: agent.name, symbol: agent.symbol, test_mode: agent.test_mode },
          appMode
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 🔐 PRODUCTION SAFETY: Log all trading attempts
    await supabase
      .from('agent_activities')
      .insert({
        agent_id: agentId,
        activity_type: 'trade_attempt',
        title: `${action.toUpperCase()} Trade Attempt`,
        description: `User attempted to ${action} ${amount} tokens`,
        metadata: {
          action,
          amount,
          slippage,
          appMode,
          isTestEnvironment,
          hasRealContract,
          timestamp: new Date().toISOString()
        },
        status: isTestEnvironment && hasRealContract ? 'blocked' : 'pending'
      });

    // If we reach here, either:
    // 1. It's a bonding curve trade (no real contract) - always allowed
    // 2. It's a real contract trade in production mode - allowed
    // 3. It's a test mode trade on bonding curve - allowed

    if (!hasRealContract) {
      // Bonding curve trading - simulate in database
      console.log(`Executing bonding curve ${action} for ${agent.symbol}`);
      
      // This would call your existing bonding curve logic
      return new Response(
        JSON.stringify({ 
          success: true,
          type: 'bonding_curve',
          message: `Bonding curve ${action} executed`,
          agent: agent.symbol
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      // Real contract trading in production mode
      console.log(`Executing real contract ${action} for ${agent.symbol} at ${agent.token_address}`);
      
      // This would call your smart contract trading logic
      return new Response(
        JSON.stringify({ 
          success: true,
          type: 'smart_contract',
          message: `Smart contract ${action} executed`,
          agent: agent.symbol,
          tokenAddress: agent.token_address
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Trade execution error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});