import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Conversational agent builder called');
    
    const { message, agentName, conversationHistory = [] } = await req.json();
    console.log('Processing message:', message);
    console.log('Conversation history length:', conversationHistory.length);

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Build conversation context for OpenAI
    const systemPrompt = `You are an expert AI agent builder assistant. Your job is to guide users step-by-step through building custom AI agents.

IMPORTANT: Follow the conversation context and respond appropriately to the user's specific question or request.

When helping users build agents, you should:
1. Understand what they want to build
2. Identify required integrations (telegram, trading, twitter, email, discord)
3. Guide them through getting API keys step-by-step
4. Provide specific, actionable instructions
5. Ask follow-up questions to move the process forward

Available integrations:
- Telegram: Bot API for messaging, commands, notifications
- Trading: DEX APIs, wallet integration, price monitoring
- Twitter: Post tweets, monitor mentions, engage users
- Email: Send notifications, process messages
- Discord: Bot functionality, server management

Always maintain conversation context and provide specific help based on what the user is asking for.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: message }
    ];

    console.log('Calling OpenAI API with conversation context...');

    // Call OpenAI API with aggressive timeout and error handling
    let openAIResponse;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 300, // Reduced to speed up response
          temperature: 0.5,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!openAIResponse.ok) {
        console.error('OpenAI API error:', openAIResponse.status);
        throw new Error(`OpenAI API error: ${openAIResponse.status}`);
      }
      
    } catch (error) {
      console.error('OpenAI call failed:', error);
      
      // Fallback to intelligent hardcoded response based on context
      const fallbackResponse = generateFallbackResponse(message, conversationHistory);
      
      return new Response(
        JSON.stringify({
          response: {
            content: fallbackResponse.content,
            metadata: fallbackResponse.metadata
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const openAIResult = await openAIResponse.json();
    console.log('OpenAI response received successfully');
    
    const aiMessage = openAIResult.choices[0].message.content;

    // Detect integrations mentioned in the conversation
    const suggestedIntegrations = [];
    const fullText = (message + ' ' + aiMessage).toLowerCase();
    
    if (fullText.includes('telegram')) suggestedIntegrations.push('telegram');
    if (fullText.includes('trading') || fullText.includes('trade')) suggestedIntegrations.push('trading');
    if (fullText.includes('twitter')) suggestedIntegrations.push('twitter');
    if (fullText.includes('email')) suggestedIntegrations.push('email');
    if (fullText.includes('discord')) suggestedIntegrations.push('discord');

    const response = {
      response: {
        content: aiMessage,
        metadata: {
          suggestedIntegrations,
          currentStep: suggestedIntegrations.length > 0 ? 'integration_setup' : 'discovery'
        }
      }
    };

    console.log('Sending AI response');
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in conversational-agent-builder:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});

function generateFallbackResponse(message: string, conversationHistory: any[]) {
  const lowerMessage = message.toLowerCase();
  const lastMessage = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1]?.content?.toLowerCase() || '' : '';
  
  // Check if they're asking for telegram bot setup
  if (lowerMessage.includes('show') || lowerMessage.includes('guide') || lowerMessage.includes('how')) {
    if (lastMessage.includes('telegram') || lowerMessage.includes('telegram')) {
      return {
        content: `Here's exactly how to create a Telegram bot:

**Step-by-Step Telegram Bot Setup:**

1. **Open Telegram** and search for @BotFather
2. **Start a chat** with @BotFather
3. **Send /newbot** command
4. **Choose a name** for your bot (e.g., "My Trading Bot")
5. **Choose a username** (must end with 'bot', e.g., "mytrading_bot")
6. **Copy the token** - BotFather will give you a token like: \`123456789:ABCdef123456789...\`

**Important:** Keep this token safe! This is what we'll use to connect your agent.

Do you have your Telegram bot token ready? Paste it here and I'll help you set up the trading functionality next.`,
        metadata: {
          suggestedIntegrations: ['telegram'],
          currentStep: 'integration_setup'
        }
      };
    }
  }
  
  // Default fallback
  return {
    content: `I'm here to help you build your AI agent! What specific question do you have about setting up your agent?

If you're building a Telegram trading bot, I can help you with:
- Getting your Telegram bot token from @BotFather
- Setting up trading functionality
- Connecting to DEX APIs
- Configuring wallet integration

What would you like to work on first?`,
    metadata: {
      suggestedIntegrations: [],
      currentStep: 'discovery'
    }
  };
}