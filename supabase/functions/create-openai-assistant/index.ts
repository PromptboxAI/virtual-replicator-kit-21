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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      description, 
      purpose, 
      functionalities, 
      customInstructions, 
      category,
      agentId,
      apiKeys,
      validate = false 
    } = await req.json();

    console.log('Creating OpenAI Assistant for agent:', { name, category, functionalities });

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Build the assistant instructions based on user input
    const systemInstructions = buildSystemInstructions({
      name,
      description,
      purpose,
      functionalities,
      customInstructions,
      category,
      personality: req.body?.personality || 'friendly'
    });

    // Build function definitions based on selected functionalities
    const tools = buildFunctionTools(functionalities);

    const assistantPayload = {
      name: name,
      description: description || `AI Agent: ${name}`,
      instructions: systemInstructions,
      model: "gpt-4o-mini",
      tools: [
        { type: "code_interpreter" },
        { type: "file_search" },
        ...tools
      ],
      metadata: {
        agent_id: agentId || '',
        category: category,
        functionalities: functionalities.join(','),
        created_by: 'promptbox'
      }
    };

    // If just validating, return success without creating
    if (validate) {
      console.log('Validation successful for agent configuration');
      return new Response(
        JSON.stringify({ success: true, message: 'Configuration is valid' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the OpenAI Assistant
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
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create OpenAI Assistant', details: error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const assistant = await response.json();
    console.log('OpenAI Assistant created:', assistant.id);

    // Store assistant configuration in Supabase if agentId provided
    if (agentId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Encrypt and store API keys securely
      const encryptedApiKeys = await encryptApiKeys(apiKeys);
      
      const { error: configError } = await supabase
        .from('agent_configurations')
        .insert({
          agent_id: agentId,
          category: 'openai_assistant',
          configuration: {
            assistant_id: assistant.id,
            functionalities: functionalities,
            custom_instructions: customInstructions,
            encrypted_api_keys: encryptedApiKeys,
            tools: tools.map(tool => tool.function?.name).filter(Boolean)
          }
        });

      if (configError) {
        console.error('Failed to store configuration:', configError);
        // Don't fail the request if storage fails, just log it
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        assistant_id: assistant.id,
        assistant_name: assistant.name,
        functionalities: functionalities
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-openai-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function buildSystemInstructions({ name, description, purpose, functionalities, customInstructions, category, personality }: any) {
  // Build personality-specific interaction style
  const personalityStyles = {
    professional: {
      tone: "formal and business-focused",
      communication: "Use professional language, provide detailed explanations, and maintain a formal tone. Address users respectfully and focus on business outcomes.",
      approach: "methodical, thorough, and results-oriented"
    },
    friendly: {
      tone: "casual and approachable", 
      communication: "Use friendly language, be conversational, and make users feel welcome. Use appropriate emojis and casual expressions.",
      approach: "warm, helpful, and relationship-focused"
    },
    expert: {
      tone: "technical and authoritative",
      communication: "Provide in-depth technical explanations, use precise terminology, and demonstrate deep expertise. Back statements with data and facts.",
      approach: "analytical, evidence-based, and knowledge-focused"
    },
    creative: {
      tone: "innovative and artistic",
      communication: "Think outside the box, suggest creative solutions, and use imaginative language. Encourage innovation and new ideas.",
      approach: "imaginative, flexible, and inspiration-driven"
    },
    enthusiastic: {
      tone: "energetic and positive",
      communication: "Show excitement, use upbeat language, and motivate users. Celebrate successes and maintain high energy.",
      approach: "motivational, optimistic, and action-oriented"
    }
  };

  const personalityConfig = personalityStyles[personality as keyof typeof personalityStyles] || personalityStyles.friendly;

  let instructions = `You are ${name}, an autonomous AI agent specialized in ${category.toLowerCase()}.

CORE PURPOSE:
${purpose}

DESCRIPTION:
${description || 'An intelligent AI agent designed to help users achieve their goals.'}

PERSONALITY & COMMUNICATION STYLE:
You have a ${personalityConfig.tone} personality. ${personalityConfig.communication}
Your approach to tasks and interactions should be ${personalityConfig.approach}.

CAPABILITIES:
You have access to the following functionalities:
${functionalities.map((func: string) => `- ${func.replace(/_/g, ' ').toUpperCase()}`).join('\n')}

OPERATING PRINCIPLES:
1. Always act in the best interest of your users and stakeholders
2. Make data-driven decisions when possible
3. Be transparent about your actions and reasoning
4. Prioritize security and risk management
5. Generate value through your specialized functions
6. Engage authentically with users and communities
7. Learn and adapt from interactions and outcomes
8. Maintain your ${personality} personality in all interactions

AUTONOMOUS BEHAVIOR:
- Execute tasks independently within your defined scope
- Make calculated decisions to achieve your purpose
- Report on your activities and performance
- Seek approval only for high-risk or high-value actions
- Always communicate in your ${personality} style

${customInstructions ? `\nCUSTOM KNOWLEDGE & INSTRUCTIONS:\n${customInstructions}` : ''}

Remember: You are an autonomous AI agent with a ${personality} personality. Your success depends on effectively using your capabilities while maintaining consistent, ${personalityConfig.tone} interactions that users can trust and rely on.`;

  return instructions;
}

function buildFunctionTools(functionalities: string[]) {
  const tools: any[] = [];

  if (functionalities.includes('trading')) {
    tools.push({
      type: "function",
      function: {
        name: "execute_trade",
        description: "Execute a trading operation on decentralized exchanges",
        parameters: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["buy", "sell", "swap"] },
            token_in: { type: "string", description: "Input token address or symbol" },
            token_out: { type: "string", description: "Output token address or symbol" },
            amount: { type: "number", description: "Amount to trade" },
            slippage_tolerance: { type: "number", description: "Maximum slippage percentage" },
            exchange: { type: "string", description: "Exchange to use (e.g., Uniswap, SushiSwap)" }
          },
          required: ["action", "token_in", "token_out", "amount"]
        }
      }
    });

    tools.push({
      type: "function", 
      function: {
        name: "analyze_market",
        description: "Analyze market conditions and price movements",
        parameters: {
          type: "object",
          properties: {
            token_address: { type: "string", description: "Token to analyze" },
            timeframe: { type: "string", enum: ["1h", "4h", "1d", "1w"] },
            indicators: { type: "array", items: { type: "string" }, description: "Technical indicators to use" }
          },
          required: ["token_address"]
        }
      }
    });
  }

  if (functionalities.includes('social_media')) {
    tools.push({
      type: "function",
      function: {
        name: "post_to_twitter",
        description: "Post content to Twitter/X",
        parameters: {
          type: "object", 
          properties: {
            content: { type: "string", description: "Tweet content" },
            media_urls: { type: "array", items: { type: "string" }, description: "Optional media URLs" },
            reply_to: { type: "string", description: "Tweet ID to reply to (optional)" }
          },
          required: ["content"]
        }
      }
    });
  }

  if (functionalities.includes('telegram')) {
    tools.push({
      type: "function",
      function: {
        name: "send_telegram_message",
        description: "Send message to Telegram channel or chat",
        parameters: {
          type: "object",
          properties: {
            chat_id: { type: "string", description: "Telegram chat or channel ID" },
            message: { type: "string", description: "Message content" },
            parse_mode: { type: "string", enum: ["HTML", "Markdown"], description: "Message formatting" }
          },
          required: ["chat_id", "message"]
        }
      }
    });
  }

  if (functionalities.includes('defi_analysis')) {
    tools.push({
      type: "function",
      function: {
        name: "analyze_defi_protocol",
        description: "Analyze DeFi protocol metrics and opportunities",
        parameters: {
          type: "object",
          properties: {
            protocol: { type: "string", description: "DeFi protocol name" },
            metrics: { type: "array", items: { type: "string" }, description: "Metrics to analyze" },
            pool_address: { type: "string", description: "Specific pool address (optional)" }
          },
          required: ["protocol"]
        }
      }
    });
  }

  if (functionalities.includes('content_creation')) {
    tools.push({
      type: "function",
      function: {
        name: "generate_content",
        description: "Generate marketing or educational content",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["article", "social_post", "newsletter", "announcement"] },
            topic: { type: "string", description: "Content topic or theme" },
            target_audience: { type: "string", description: "Target audience" },
            tone: { type: "string", enum: ["professional", "casual", "technical", "enthusiastic"] }
          },
          required: ["type", "topic"]
        }
      }
    });
  }

  return tools;
}

async function encryptApiKeys(apiKeys: Record<string, string>): Promise<string> {
  // Simple base64 encoding for now - in production use proper encryption
  // This should be replaced with actual encryption using a secret key
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(apiKeys));
  return btoa(String.fromCharCode(...data));
}