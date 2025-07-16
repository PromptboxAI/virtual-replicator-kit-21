import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Available integrations with their requirements
const AVAILABLE_INTEGRATIONS = {
  telegram: {
    name: 'Telegram Bot',
    apiKeys: ['TELEGRAM_BOT_TOKEN'],
    description: 'Send messages, manage channels, handle commands',
    setupSteps: [
      'Create bot with @BotFather on Telegram',
      'Get bot token',
      'Configure webhook (optional)',
      'Set bot permissions'
    ]
  },
  trading: {
    name: 'Trading & DEX',
    apiKeys: ['PRIVATE_KEY', 'RPC_URL'],
    description: 'Execute trades on DEXs, monitor prices',
    setupSteps: [
      'Choose trading strategy',
      'Set up wallet/private key',
      'Configure RPC endpoints',
      'Set risk management parameters'
    ]
  },
  twitter: {
    name: 'Twitter/X',
    apiKeys: ['TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET'],
    description: 'Post tweets, monitor mentions, engage with users',
    setupSteps: [
      'Apply for Twitter Developer Account',
      'Create Twitter App',
      'Generate API keys and tokens',
      'Configure permissions'
    ]
  },
  email: {
    name: 'Email',
    apiKeys: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'],
    description: 'Send emails, process inbox, automate responses',
    setupSteps: [
      'Choose email provider (Gmail, SendGrid, etc.)',
      'Generate app passwords',
      'Configure SMTP settings',
      'Test email sending'
    ]
  },
  discord: {
    name: 'Discord',
    apiKeys: ['DISCORD_BOT_TOKEN'],
    description: 'Manage servers, send messages, moderate channels',
    setupSteps: [
      'Create Discord Application',
      'Create bot user',
      'Get bot token',
      'Add bot to server with permissions'
    ]
  },
  webhook: {
    name: 'Webhooks',
    apiKeys: ['WEBHOOK_SECRET'],
    description: 'Receive external notifications and trigger actions',
    setupSteps: [
      'Define webhook endpoints',
      'Set up authentication',
      'Configure payload processing',
      'Test webhook delivery'
    ]
  },
  database: {
    name: 'Database',
    apiKeys: ['DATABASE_URL'],
    description: 'Store data, query information, manage records',
    setupSteps: [
      'Choose database provider',
      'Create database instance',
      'Configure connection string',
      'Set up tables/schemas'
    ]
  },
  ai_analysis: {
    name: 'AI Analysis',
    apiKeys: ['ANALYSIS_API_KEY'],
    description: 'Analyze text, images, data patterns',
    setupSteps: [
      'Choose AI service provider',
      'Get API credentials',
      'Configure analysis parameters',
      'Test analysis endpoints'
    ]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      agentId, 
      agentName, 
      buildingPhase, 
      identifiedIntegrations = [], 
      configuredIntegrations = [],
      conversationHistory = []
    } = await req.json();

    console.log('Agent Builder Request:', { agentName, buildingPhase, message });

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Build context for the AI assistant
    const systemPrompt = buildSystemPrompt(buildingPhase, identifiedIntegrations, configuredIntegrations);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5), // Keep last 5 messages for context
      { role: 'user', content: message }
    ];

    console.log('Calling OpenAI with messages:', messages.length);

    // Call OpenAI with shorter timeout and simpler request
    const response = await Promise.race([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 500,
          functions: [
            {
              name: 'identify_integrations',
              description: 'Identify required integrations',
              parameters: {
                type: 'object',
                properties: {
                  integrations: { type: 'array', items: { type: 'string' } },
                  reasoning: { type: 'string' }
                }
              }
            }
          ],
          function_call: 'auto'
        })
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI timeout')), 8000)
      )
     ]) as Response;

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices[0].message;

    let responseContent = assistantMessage.content || 'I understand. Let me help you with that.';
    let metadata: any = {};

    // Handle function calls
    if (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments);

      switch (functionName) {
        case 'identify_integrations':
          metadata.suggestedIntegrations = functionArgs.integrations;
          metadata.currentStep = 'integration_setup';
          responseContent += `\n\nBased on your requirements, I've identified the following integrations needed:\n\n${functionArgs.integrations.map((int: string) => {
            const integration = AVAILABLE_INTEGRATIONS[int as keyof typeof AVAILABLE_INTEGRATIONS];
            return `• **${integration?.name || int}**: ${integration?.description || 'Custom integration'}`;
          }).join('\n')}\n\n${functionArgs.reasoning}\n\nNow, let's set up each integration step by step. Which one would you like to start with?`;
          break;

        case 'request_api_keys':
          const integration = AVAILABLE_INTEGRATIONS[functionArgs.integration as keyof typeof AVAILABLE_INTEGRATIONS];
          metadata.requiredApiKeys = functionArgs.apiKeys;
          responseContent += `\n\n**Setting up ${integration?.name || functionArgs.integration}**\n\n${functionArgs.instructions}\n\nRequired keys:\n${functionArgs.apiKeys.map((key: string) => `• ${key}`).join('\n')}\n\nPlease provide these keys when you're ready, or let me know if you need help obtaining them.`;
          break;

        case 'create_assistant':
          // Actually create the OpenAI assistant
          const assistantResponse = await createOpenAIAssistant(
            agentId,
            agentName,
            functionArgs.instructions,
            functionArgs.functionalities,
            identifiedIntegrations
          );
          
          if (assistantResponse.success) {
            metadata.assistantCreated = true;
            metadata.assistantId = assistantResponse.assistantId;
            metadata.currentStep = 'complete';
            responseContent += `\n\n🎉 **Agent Successfully Created!**\n\nYour OpenAI Assistant has been created with ID: \`${assistantResponse.assistantId}\`\n\nYour agent is now ready and configured with the following capabilities:\n${functionArgs.functionalities.map((func: string) => `• ${func}`).join('\n')}\n\nYou can now start using your agent!`;
          } else {
            responseContent += `\n\n❌ There was an issue creating your assistant: ${assistantResponse.error}`;
          }
          break;
      }
    }

    return new Response(
      JSON.stringify({
        response: {
          content: responseContent,
          metadata
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in conversational-agent-builder:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function buildSystemPrompt(phase: string, identifiedIntegrations: string[], configuredIntegrations: string[]) {
  const availableIntegrationsText = Object.entries(AVAILABLE_INTEGRATIONS)
    .map(([key, integration]) => `- ${key}: ${integration.description}`)
    .join('\n');

  return `You are an expert AI agent builder assistant. Your job is to guide users through creating custom AI agents by:

1. Understanding their requirements through conversation
2. Identifying needed integrations
3. Guiding them through API key setup
4. Configuring the final OpenAI Assistant

CURRENT PHASE: ${phase}
IDENTIFIED INTEGRATIONS: ${identifiedIntegrations.join(', ') || 'None'}
CONFIGURED INTEGRATIONS: ${configuredIntegrations.join(', ') || 'None'}

AVAILABLE INTEGRATIONS:
${availableIntegrationsText}

BEHAVIOR GUIDELINES:
- Ask clarifying questions to understand exactly what they want
- Be specific about integration requirements
- Provide step-by-step guidance for API key setup
- Don't assume - always confirm requirements
- Explain WHY each integration is needed
- Guide them through the complete setup process

When identifying integrations, use the identify_integrations function.
When requesting API keys, use the request_api_keys function with detailed instructions.
When ready to create the assistant, use the create_assistant function.

Be conversational, helpful, and thorough. Make sure they understand each step.`;
}

async function createOpenAIAssistant(
  agentId: string,
  agentName: string,
  instructions: string,
  functionalities: string[],
  integrations: string[]
) {
  try {
    const tools = buildToolsForIntegrations(integrations);
    
    const assistantPayload = {
      name: agentName,
      instructions,
      model: "gpt-4o-mini",
      tools: [
        { type: "code_interpreter" },
        { type: "file_search" },
        ...tools
      ],
      metadata: {
        agent_id: agentId,
        integrations: integrations.join(','),
        functionalities: functionalities.join(','),
        created_by: 'conversational_builder'
      }
    };

    const response = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify(assistantPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const assistant = await response.json();
    
    // Store in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase
      .from('agent_configurations')
      .insert({
        agent_id: agentId,
        category: 'openai_assistant',
        configuration: {
          assistant_id: assistant.id,
          integrations,
          functionalities,
          tools: tools.map(tool => tool.function?.name).filter(Boolean)
        }
      });

    return { success: true, assistantId: assistant.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function buildToolsForIntegrations(integrations: string[]) {
  const tools: any[] = [];

  integrations.forEach(integration => {
    switch (integration) {
      case 'telegram':
        tools.push({
          type: "function",
          function: {
            name: "send_telegram_message",
            description: "Send message to Telegram chat or channel",
            parameters: {
              type: "object",
              properties: {
                chat_id: { type: "string", description: "Chat or channel ID" },
                message: { type: "string", description: "Message content" },
                parse_mode: { type: "string", enum: ["HTML", "Markdown"] }
              },
              required: ["chat_id", "message"]
            }
          }
        });
        break;

      case 'trading':
        tools.push({
          type: "function",
          function: {
            name: "execute_trade",
            description: "Execute trading operation",
            parameters: {
              type: "object",
              properties: {
                action: { type: "string", enum: ["buy", "sell", "swap"] },
                token_in: { type: "string" },
                token_out: { type: "string" },
                amount: { type: "number" },
                slippage: { type: "number" }
              },
              required: ["action", "token_in", "token_out", "amount"]
            }
          }
        });
        break;

      case 'twitter':
        tools.push({
          type: "function",
          function: {
            name: "post_tweet",
            description: "Post to Twitter/X",
            parameters: {
              type: "object",
              properties: {
                content: { type: "string" },
                reply_to: { type: "string" }
              },
              required: ["content"]
            }
          }
        });
        break;

      // Add more integrations as needed
    }
  });

  return tools;
}