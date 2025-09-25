import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const ONE_INCH_API_KEY = Deno.env.get('ONE_INCH_API_KEY');

interface TradeRequest {
  agentId: string;
  userId: string;
  tradeType: 'buy' | 'sell';
  promptAmount?: number;
  tokenAmount?: number;
  expectedPrice?: number;
  slippage?: number;
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
    const { 
      agentId, 
      userId, 
      tradeType, 
      promptAmount = 0, 
      tokenAmount = 0, 
      expectedPrice = 30.0, 
      slippage = 0.5,
      automated = false,  // Add automated flag
      userApproved = false  // Add user approval flag
    }: TradeRequest & { automated?: boolean; userApproved?: boolean } = await req.json();

    console.log(`📈 V4 Trade Request: ${tradeType} for agent ${agentId}`, {
      automated,
      userApproved,
      promptAmount,
      tokenAmount
    });

    // 🛡️ CRITICAL SECURITY CHECK: Block automated trades without explicit consent
    if (automated && !userApproved) {
      // Check if agent allows automated trading
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('allow_automated_trading, creator_id, name')
        .eq('id', agentId)
        .single();

      if (agentError || !agent?.allow_automated_trading) {
        console.log(`🚫 BLOCKED: Automated trade attempt for agent ${agent?.name || agentId} without user consent`);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Automated trading not authorized by agent owner',
            blocked: true,
            reason: 'User has not granted permission for automated trading',
            requiresApproval: true
          }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    console.log(`📈 V3 Trade Request: ${tradeType} for agent ${agentId}`);

    // Validate required parameters
    if (!agentId || !userId || !tradeType) {
      throw new Error('Missing required parameters: agentId, userId, and tradeType are required');
    }

    // Validate trade-specific parameters
    if (tradeType === 'buy' && (!promptAmount || promptAmount <= 0)) {
      throw new Error('promptAmount is required and must be positive for buy trades');
    }
    
    if (tradeType === 'sell' && (!tokenAmount || tokenAmount <= 0)) {
      throw new Error('tokenAmount is required and must be positive for sell trades');
    }

    // 🛡️ MEV PROTECTION: Check if user can trade this agent
    const { data: canTradeResult, error: canTradeError } = await supabase.rpc(
      'can_trade_agent',
      {
        p_agent_id: agentId,
        p_user_id: userId
      }
    );

    if (canTradeError) {
      throw new Error(`Lock status check failed: ${canTradeError.message}`);
    }

    if (!canTradeResult) {
      throw new Error('Trading is temporarily locked for this agent. Only the creator can trade during the MEV protection period.');
    }

    // Get agent data
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentError?.message}`);
    }

    // 🔀 ROUTE TO DEX IF GRADUATED
    if (agent.token_graduated) {
      console.log(`🔄 Agent ${agent.name} has graduated - routing to DEX trade`);
      
      // Route to DEX trading
      const aggregatorEnabled = Boolean(ONE_INCH_API_KEY);
      if (!aggregatorEnabled) {
        console.warn('⚠️ ONE_INCH_API_KEY missing. DEX trade will skip aggregator and use direct route.');
      }
      const { data: dexResult, error: dexError } = await supabase.functions.invoke(
        'execute-dex-trade',
        {
          body: {
            agentId,
            userId,
            tradeType,
            promptAmount,
            tokenAmount,
            slippage,
            useAggregator: aggregatorEnabled
          }
        }
      );

      if (dexError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'DEX trade failed',
            details: dexError.message
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          ...dexResult,
          tradedOnDEX: true,
          tokenAddress: agent.token_address
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Check if agent uses V3 pricing (if not, migrate first)
    if (agent.pricing_model !== 'linear_v3') {
      console.log(`🔄 Agent ${agent.name} not yet migrated to V3, migrating now...`);
      
      const { data: migrationData, error: migrationError } = await supabase.functions.invoke(
        'migrate-agent-v3',
        {
          body: {
            agentId: agentId,
            dryRun: false
          }
        }
      );

      if (migrationError) {
        throw new Error(`Failed to migrate agent to V3: ${migrationError.message}`);
      }

      console.log(`✅ Agent ${agent.name} successfully migrated to V3`);
    }

    // Run safety validation
    const { data: safetyResult, error: safetyError } = await supabase.rpc(
      'validate_trade_safety',
      {
        p_agent_id: agentId,
        p_user_id: userId,
        p_prompt_amount: promptAmount || tokenAmount,
        p_trade_type: tradeType
      }
    );

    if (safetyError) {
      throw new Error(`Safety validation failed: ${safetyError.message}`);
    }

    const safetyCheck = safetyResult[0];
    if (!safetyCheck.is_valid) {
      // Log rejection
      await supabase
        .from('trade_rejections_log')
        .insert({
          agent_id: agentId,
          user_id: userId,
          trade_type: tradeType,
          trade_amount: promptAmount || tokenAmount,
          rejection_reason: safetyCheck.rejection_reason,
          metadata: {
            expected_price: expectedPrice,
            slippage: slippage
          }
        });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Trade rejected for safety',
          reason: safetyCheck.rejection_reason
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Store pre-trade PROMPT raised for graduation check
    const preTradePromptRaised = agent.prompt_raised || 0;

    // Execute the trade using V3 bonding curve
    const { data: tradeResult, error: tradeError } = await supabase.rpc(
      'execute_bonding_curve_trade',
      {
        p_agent_id: agentId,
        p_user_id: userId,
        p_prompt_amount: promptAmount,
        p_trade_type: tradeType,
        p_token_amount: tokenAmount,
        p_expected_price: expectedPrice,
        p_slippage: slippage
      }
    );

    if (tradeError) {
      throw new Error(`Trade execution failed: ${tradeError.message}`);
    }

    if (!tradeResult.success) {
      return new Response(
        JSON.stringify(tradeResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log(`✅ Trade executed successfully`);

    // 🎓 GRADUATION CHECK - Auto-trigger if threshold reached
    if (tradeResult.graduated && tradeResult.graduation_event_id) {
      console.log(`🎉 Agent ${agent.name} has reached graduation! Triggering auto-graduation...`);

      // Background task to trigger graduation (don't wait for it)
      supabase.functions.invoke('trigger-agent-graduation', {
        body: {
          agentId: agentId,
          graduationEventId: tradeResult.graduation_event_id,
          force: false
        }
      }).then((result) => {
        if (result.error) {
          console.error('❌ Auto-graduation failed:', result.error);
        } else {
          console.log('🎓 Auto-graduation triggered successfully');
        }
      }).catch((error) => {
        console.error('❌ Auto-graduation error:', error);
      });

      // Return trade success with graduation notification
      return new Response(
        JSON.stringify({
          ...tradeResult,
          graduationTriggered: true,
          message: 'Trade successful and graduation process initiated!'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Regular successful trade response
    return new Response(
      JSON.stringify(tradeResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ V3 Trade execution failed:', error);
    
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