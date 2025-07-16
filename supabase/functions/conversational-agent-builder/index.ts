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
    console.log('OpenAI API Key exists:', !!openAIApiKey);
    console.log('Messages to send:', JSON.stringify(messages, null, 2));

    // Make OpenAI call with detailed logging
    const startTime = Date.now();
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const responseTime = Date.now() - startTime;
    console.log(`OpenAI request took ${responseTime}ms`);
    console.log('OpenAI response status:', openAIResponse.status);
    console.log('OpenAI response headers:', Object.fromEntries(openAIResponse.headers.entries()));

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error details:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIResult = await openAIResponse.json();
    console.log('OpenAI response received successfully');
    console.log('OpenAI result:', JSON.stringify(openAIResult, null, 2));

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