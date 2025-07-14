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
  current_goal?: string;
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

async function executeAgentCycle(agent: Agent) {
  await logMessage(agent.id, 'info', `Starting execution cycle for agent ${agent.name}`);
  
  try {
    // Update status to active
    await updateRuntimeStatus(agent.id, { 
      is_active: true,
      current_goal: agent.current_goal || 'Autonomous goal execution'
    });

    // Generate autonomous thoughts and decisions
    const aiThought = await generateAIResponse(
      `As an AI agent, analyze your current situation and decide on your next action. 
      Consider: market conditions, social media engagement opportunities, user interactions, and goal progress.`,
      `Agent: ${agent.name}, Description: ${agent.description}, Framework: ${agent.framework}`
    );

    await logActivity(agent.id, {
      activity_type: 'goal_execution',
      title: 'AI Decision Making',
      description: 'Agent analyzed situation and made autonomous decisions',
      metadata: { thought_process: aiThought },
      status: 'completed',
      result: { decision: aiThought }
    });

    // Simulate different types of autonomous actions based on framework
    if (agent.framework === 'G.A.M.E.') {
      // Social media engagement simulation
      const socialAction = await generateAIResponse(
        'Generate a strategic social media post that would engage your community and drive value for your token holders.',
        `Agent: ${agent.name}, Focus: Community engagement and value creation`
      );

      await logActivity(agent.id, {
        activity_type: 'twitter_post',
        title: 'Social Media Engagement',
        description: 'Generated strategic social media content',
        metadata: { platform: 'twitter', content: socialAction },
        status: 'completed',
        result: { engagement_potential: 'high' }
      });

      // Market analysis simulation
      const marketAnalysis = await generateAIResponse(
        'Analyze current market conditions and provide insights for token holders.',
        `Agent: ${agent.name}, Focus: Market analysis and trading insights`
      );

      await logActivity(agent.id, {
        activity_type: 'trading_decision',
        title: 'Market Analysis',
        description: 'Analyzed market conditions and generated insights',
        metadata: { analysis: marketAnalysis },
        status: 'completed',
        result: { confidence_level: 'medium' }
      });
    }

    // Update performance metrics
    const { data: currentStatus } = await supabase
      .from('agent_runtime_status')
      .select('tasks_completed, revenue_generated')
      .eq('agent_id', agent.id)
      .single();

    await updateRuntimeStatus(agent.id, {
      tasks_completed: (currentStatus?.tasks_completed || 0) + 1,
      revenue_generated: (currentStatus?.revenue_generated || 0) + Math.random() * 10, // Simulated revenue
      performance_metrics: {
        last_cycle: new Date().toISOString(),
        efficiency: Math.random() * 100,
        engagement_score: Math.random() * 100
      }
    });

    await logMessage(agent.id, 'info', `Completed execution cycle for agent ${agent.name}`);

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
    // Get agent context
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (!agent) {
      throw new Error('Agent not found');
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

    switch (action) {
      case 'execute_cycle':
        // Get agent details
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('*')
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
        if (!userId || !message) {
          throw new Error('User ID and message are required for interactions');
        }

        const response = await processUserInteraction(agentId, userId, message);
        
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