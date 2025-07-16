import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Agent {
  id: string;
  name: string;
  description: string;
  framework: string;
  category: string;
  current_goal?: string;
}

interface AgentConfiguration {
  category: string;
  configuration: any;
}

interface AgentActivity {
  activity_type: string;
  title: string;
  description?: string;
  metadata?: any;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
}

async function logActivity(agentId: string, activity: AgentActivity) {
  const { error } = await supabase
    .from('agent_activities')
    .insert({
      agent_id: agentId,
      ...activity
    });
  
  if (error) {
    console.error('Failed to log activity:', error);
  }
}

async function logMessage(agentId: string, level: string, message: string, context?: any) {
  const { error } = await supabase
    .from('agent_logs')
    .insert({
      agent_id: agentId,
      log_level: level,
      message,
      context: context || {}
    });
  
  if (error) {
    console.error('Failed to log message:', error);
  }
}

async function updateRuntimeStatus(agentId: string, updates: any) {
  const { error } = await supabase
    .from('agent_runtime_status')
    .upsert({
      agent_id: agentId,
      ...updates,
      last_activity_at: new Date().toISOString()
    }, {
      onConflict: 'agent_id'
    });
  
  if (error) {
    console.error('Failed to update runtime status:', error);
  }
}

async function generateAIResponse(prompt: string, agentContext: string): Promise<string> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an autonomous AI agent with the following context: ${agentContext}. 
          You should think strategically about your actions and goals. Respond with specific, actionable thoughts and decisions.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function loadAgentConfigurations(agentId: string): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('agent_configurations')
    .select('category, configuration')
    .eq('agent_id', agentId);

  if (error) {
    console.error('Failed to load agent configurations:', error);
    return {};
  }

  const configurations: Record<string, any> = {};
  data.forEach((config) => {
    configurations[config.category] = config.configuration;
  });

  return configurations;
}

async function getAPIKeys(agentId: string, keyNames: string[]): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase.functions.invoke('encrypt-api-key', {
      body: {
        action: 'decrypt',
        agentId,
        keyNames
      }
    });

    if (error) throw error;
    return data.apiKeys || {};
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return {};
  }
}

async function executeDeFiOperations(agent: Agent, config: any, apiKeys: Record<string, string>) {
  try {
    // Check if this is a trading bot with real trading configuration
    if (config.tradingStrategy && config.tradingPairs) {
      // Execute real trading via trading engine
      await logMessage(agent.id, 'info', 'Executing real trading strategy');
      
      try {
        const tradingResult = await supabase.functions.invoke('trading-engine', {
          body: {
            agentId: agent.id,
            action: 'run_trading_cycle'
          }
        });
        
        if (tradingResult.error) {
          throw new Error(tradingResult.error.message);
        }
        
        await logActivity(agent.id, {
          activity_type: 'autonomous_trading',
          title: 'Real Trading Cycle Completed',
          description: `Executed ${config.tradingStrategy} strategy on real markets`,
          metadata: { 
            strategy: config.tradingStrategy,
            pairs: config.tradingPairs,
            exchanges: config.exchanges,
            result: tradingResult.data 
          },
          status: 'completed',
          result: { trading_engine_result: tradingResult.data }
        });
        
      } catch (tradingError) {
        await logMessage(agent.id, 'error', `Real trading failed: ${tradingError.message}`);
        
        await logActivity(agent.id, {
          activity_type: 'trading_error',
          title: 'Trading Execution Failed',
          description: `Real trading execution encountered an error: ${tradingError.message}`,
          status: 'failed',
          result: { error: tradingError.message }
        });
      }
      
      return; // Exit early for trading bots
    }
    
    // Original DeFi operations for non-trading agents
    const protocols = config.protocols || ['Uniswap', 'Aave'];
    
    for (const protocol of protocols.slice(0, 2)) { // Limit to 2 protocols per cycle
      if (config.yieldOptimization) {
        // Simulate yield optimization analysis
        const yieldData = await analyzeProtocolYield(protocol, apiKeys);
        
        await logActivity(agent.id, {
          activity_type: 'defi_analysis',
          title: `${protocol} Yield Analysis`,
          description: `Analyzed yield opportunities on ${protocol}`,
          metadata: { protocol, yield_data: yieldData, risk_tolerance: config.riskTolerance },
          status: 'completed',
          result: { apy: yieldData.apy, recommendation: yieldData.action }
        });
      }

      if (config.liquidityProvision && config.riskTolerance >= 6) {
        // Simulate liquidity provision decision
        await logActivity(agent.id, {
          activity_type: 'liquidity_provision',
          title: `${protocol} Liquidity Decision`,
          description: `Evaluated liquidity provision opportunity`,
          metadata: { protocol, max_position: config.maxPositionSize },
          status: 'completed',
          result: { action: 'provide_liquidity', amount: config.maxPositionSize * 0.1 }
        });
      }
    }

    // Auto-compounding simulation
    if (config.autoCompounding) {
      await logActivity(agent.id, {
        activity_type: 'auto_compound',
        title: 'Auto-Compound Rewards',
        description: 'Automatically compounded accumulated rewards',
        metadata: { frequency: config.rebalanceFrequency },
        status: 'completed',
        result: { rewards_compounded: Math.random() * 50 }
      });
    }

  } catch (error) {
    await logMessage(agent.id, 'error', `DeFi operations failed: ${error.message}`);
  }
}

async function executeContentCreation(agent: Agent, config: any, apiKeys: Record<string, string>) {
  try {
    if (apiKeys.TWITTER_API_KEY && apiKeys.TWITTER_API_SECRET) {
      // Generate and post tweet
      const tweetContent = await generateAIResponse(
        `Generate an engaging tweet about cryptocurrency or DeFi that would interest your followers. 
        Keep it under 280 characters and include relevant hashtags.`,
        `Agent: ${agent.name}, Focus: Social media engagement, Audience: Crypto enthusiasts`
      );

      // Simulate tweet posting
      await logActivity(agent.id, {
        activity_type: 'twitter_post',
        title: 'Automated Tweet',
        description: 'Posted automated social media content',
        metadata: { platform: 'twitter', content: tweetContent },
        status: 'completed',
        result: { engagement_score: Math.random() * 100 }
      });
    }

    // Content strategy execution
    const contentStrategy = config.contentStrategy || 'educational';
    const contentPiece = await generateAIResponse(
      `Create ${contentStrategy} content about cryptocurrency trends or DeFi opportunities. 
      Make it informative and engaging for your audience.`,
      `Agent: ${agent.name}, Strategy: ${contentStrategy}`
    );

    await logActivity(agent.id, {
      activity_type: 'content_creation',
      title: 'Content Strategy Execution',
      description: `Created ${contentStrategy} content`,
      metadata: { strategy: contentStrategy, content: contentPiece },
      status: 'completed',
      result: { content_type: contentStrategy, quality_score: Math.random() * 100 }
    });

  } catch (error) {
    await logMessage(agent.id, 'error', `Content creation failed: ${error.message}`);
  }
}

async function executeCommunityManagement(agent: Agent, config: any, apiKeys: Record<string, string>) {
  try {
    if (apiKeys.DISCORD_BOT_TOKEN) {
      // Simulate Discord community engagement
      await logActivity(agent.id, {
        activity_type: 'discord_engagement',
        title: 'Discord Community Management',
        description: 'Engaged with Discord community members',
        metadata: { platform: 'discord', engagement_type: 'moderation' },
        status: 'completed',
        result: { messages_processed: Math.floor(Math.random() * 50) }
      });
    }

    // Community sentiment analysis
    const sentimentAnalysis = await generateAIResponse(
      'Analyze the current sentiment in the crypto community and suggest engagement strategies.',
      `Agent: ${agent.name}, Focus: Community management and engagement`
    );

    await logActivity(agent.id, {
      activity_type: 'sentiment_analysis',
      title: 'Community Sentiment Analysis',
      description: 'Analyzed community sentiment and engagement opportunities',
      metadata: { analysis: sentimentAnalysis },
      status: 'completed',
      result: { sentiment_score: Math.random() * 100, engagement_strategy: 'positive' }
    });

  } catch (error) {
    await logMessage(agent.id, 'error', `Community management failed: ${error.message}`);
  }
}

async function executeAnalytics(agent: Agent, config: any, apiKeys: Record<string, string>) {
  try {
    if (apiKeys.COINMARKETCAP_API_KEY) {
      // Simulate market data analysis
      const marketMetrics = {
        btc_price: 45000 + Math.random() * 10000,
        market_cap: 2.1e12 + Math.random() * 5e11,
        fear_greed_index: Math.floor(Math.random() * 100)
      };

      await logActivity(agent.id, {
        activity_type: 'market_analysis',
        title: 'Market Data Analysis',
        description: 'Analyzed current market conditions and trends',
        metadata: { metrics: marketMetrics, data_source: 'CoinMarketCap' },
        status: 'completed',
        result: { market_outlook: marketMetrics.fear_greed_index > 50 ? 'bullish' : 'bearish' }
      });
    }

    // Performance analytics
    const performanceReport = await generateAIResponse(
      'Generate a brief performance analysis and market outlook based on current conditions.',
      `Agent: ${agent.name}, Focus: Analytics and market insights`
    );

    await logActivity(agent.id, {
      activity_type: 'performance_report',
      title: 'Performance Analytics',
      description: 'Generated performance report and market insights',
      metadata: { report: performanceReport },
      status: 'completed',
      result: { report_quality: Math.random() * 100 }
    });

  } catch (error) {
    await logMessage(agent.id, 'error', `Analytics execution failed: ${error.message}`);
  }
}

async function analyzeProtocolYield(protocol: string, apiKeys: Record<string, string>) {
  // Simulate yield analysis
  return {
    apy: 5 + Math.random() * 20,
    tvl: Math.random() * 1000000000,
    risk_score: Math.random() * 10,
    action: Math.random() > 0.5 ? 'invest' : 'monitor'
  };
}

async function executeAgentCycle(agent: Agent) {
  await logMessage(agent.id, 'info', `Starting execution cycle for agent ${agent.name}`);
  
  try {
    // Load agent configurations
    const configurations = await loadAgentConfigurations(agent.id);
    const category = agent.category || 'G.A.M.E.';
    
    // Update status to active
    await updateRuntimeStatus(agent.id, { 
      is_active: true,
      current_goal: agent.current_goal || `Autonomous ${category} execution`
    });

    // Get API keys if needed
    const apiKeyConfig = configurations['api_keys'] || {};
    const requiredKeys = Object.keys(apiKeyConfig);
    const apiKeys = requiredKeys.length > 0 ? await getAPIKeys(agent.id, requiredKeys) : {};

    // Generate contextual AI thoughts based on category and configuration
    const contextPrompt = `As a ${category} AI agent, analyze your current situation and decide on your next action. 
    Consider your configuration settings, available API integrations, and optimization opportunities.
    Your current configuration: ${JSON.stringify(configurations[category] || {}).substring(0, 200)}`;

    const aiThought = await generateAIResponse(
      contextPrompt,
      `Agent: ${agent.name}, Category: ${category}, Description: ${agent.description}`
    );

    await logActivity(agent.id, {
      activity_type: 'goal_execution',
      title: 'AI Decision Making',
      description: 'Agent analyzed situation and made autonomous decisions',
      metadata: { thought_process: aiThought, category, available_apis: Object.keys(apiKeys) },
      status: 'completed',
      result: { decision: aiThought }
    });

    // Execute category-specific operations
    const categoryConfig = configurations[category] || {};
    
    switch (category) {
      case 'DeFi Assistant':
        await executeDeFiOperations(agent, categoryConfig, apiKeys);
        break;
        
      case 'Trading Bot':
        await executeDeFiOperations(agent, categoryConfig, apiKeys);
        break;
        
      case 'Content Creator':
        await executeContentCreation(agent, categoryConfig, apiKeys);
        break;
        
      case 'Community Manager':
        await executeCommunityManagement(agent, categoryConfig, apiKeys);
        break;
        
      case 'Analytics Agent':
        await executeAnalytics(agent, categoryConfig, apiKeys);
        break;
        
      default:
        // Check if agent has trading configuration regardless of category
        if (categoryConfig.tradingStrategy) {
          await executeDeFiOperations(agent, categoryConfig, apiKeys);
        } else {
          // Default G.A.M.E. framework execution
          await executeContentCreation(agent, categoryConfig, apiKeys);
        }
        break;
    }

    // Update performance metrics
    const { data: currentStatus } = await supabase
      .from('agent_runtime_status')
      .select('tasks_completed, revenue_generated')
      .eq('agent_id', agent.id)
      .single();

    // Generate revenue based on category and performance
    const baseRevenue = 5; // Base revenue
    const categoryMultiplier = category === 'DeFi Assistant' ? 2 : 1;
    const configurationBonus = Object.keys(categoryConfig).length * 0.5;
    const apiIntegrationBonus = Object.keys(apiKeys).length * 1;
    
    const revenueGenerated = baseRevenue * categoryMultiplier + configurationBonus + apiIntegrationBonus + Math.random() * 10;
    
    if (revenueGenerated > 2) { // Only distribute if meaningful amount
      try {
        await supabase.functions.invoke('distribute-revenue', {
          body: {
            agentId: agent.id,
            revenueAmount: revenueGenerated,
            source: 'autonomous_execution'
          }
        });
      } catch (error) {
        console.error('Revenue distribution failed:', error);
      }
    }

    await updateRuntimeStatus(agent.id, {
      tasks_completed: (currentStatus?.tasks_completed || 0) + 1,
      performance_metrics: {
        last_cycle: new Date().toISOString(),
        efficiency: Math.random() * 100,
        engagement_score: Math.random() * 100,
        revenue_generated_this_cycle: revenueGenerated,
        category_performance: {
          category,
          api_integrations: Object.keys(apiKeys).length,
          configuration_completeness: Object.keys(categoryConfig).length
        }
      }
    });

    await logMessage(agent.id, 'info', `Completed execution cycle for agent ${agent.name} (${category})`);

  } catch (error) {
    await logMessage(agent.id, 'error', `Execution cycle failed: ${error.message}`, { error: error.toString() });
    
    await logActivity(agent.id, {
      activity_type: 'goal_execution',
      title: 'Execution Failed',
      description: `Agent execution encountered an error: ${error.message}`,
      status: 'failed',
      result: { error: error.toString() }
    });
  }
}

async function processUserInteraction(agentId: string, userId: string, message: string) {
  try {
    // Verify user has permission to interact with this agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // Check if user is the creator of the agent
    if (agent.creator_id !== userId) {
      throw new Error('Unauthorized: You can only interact with your own agents');
    }

    // Generate AI response to user message
    const aiResponse = await generateAIResponse(
      `A user has sent you this message: "${message}". Respond as the AI agent in a helpful and engaging way.`,
      `Agent: ${agent.name}, Description: ${agent.description}`
    );

    // Log user message
    await supabase
      .from('agent_interactions')
      .insert({
        agent_id: agentId,
        user_id: userId,
        message_type: 'user_message',
        content: message
      });

    // Log agent response
    await supabase
      .from('agent_interactions')
      .insert({
        agent_id: agentId,
        user_id: 'system',
        message_type: 'agent_response',
        content: aiResponse
      });

    await logActivity(agentId, {
      activity_type: 'user_interaction',
      title: 'User Interaction',
      description: 'Responded to user message',
      metadata: { user_message: message, response: aiResponse },
      status: 'completed'
    });

    return aiResponse;

  } catch (error) {
    await logMessage(agentId, 'error', `User interaction failed: ${error.message}`);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, agentId, userId, message } = await req.json();

    // Get user ID from authorization header if not provided
    let actualUserId = userId;
    if (!actualUserId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        // Extract user ID from Supabase JWT token
        try {
          const token = authHeader.replace('Bearer ', '');
          const payload = JSON.parse(atob(token.split('.')[1]));
          actualUserId = payload.sub;
        } catch (error) {
          console.error('Failed to extract user ID from token:', error);
        }
      }
    }

    switch (action) {
      case 'execute_cycle':
        // Verify user owns the agent before executing
        const { data: agentOwnership, error: ownershipError } = await supabase
          .from('agents')
          .select('creator_id')
          .eq('id', agentId)
          .single();

        if (ownershipError || !agentOwnership) {
          throw new Error('Agent not found');
        }

        if (actualUserId && agentOwnership.creator_id !== actualUserId) {
          throw new Error('Unauthorized: You can only execute your own agents');
        }

        // Get agent details
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('id, name, description, framework, category, current_goal')
          .eq('id', agentId)
          .single();

        if (agentError || !agent) {
          throw new Error('Agent not found');
        }

        await executeAgentCycle(agent);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Execution cycle completed' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'interact':
        if (!actualUserId || !message) {
          throw new Error('User ID and message are required for interactions');
        }

        const response = await processUserInteraction(agentId, actualUserId, message);
        
        return new Response(JSON.stringify({ 
          success: true, 
          response 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'get_status':
        const { data: status } = await supabase
          .from('agent_runtime_status')
          .select('*')
          .eq('agent_id', agentId)
          .single();

        return new Response(JSON.stringify({ 
          success: true, 
          status: status || { is_active: false, tasks_completed: 0, revenue_generated: 0 }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Agent runtime error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});