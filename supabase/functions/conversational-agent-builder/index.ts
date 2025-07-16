import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Agent builder function called');
    
    const { message, agentName } = await req.json();
    console.log('Received message:', message);

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Call OpenAI API
    console.log('Calling OpenAI API...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expert AI agent builder. Help users create custom AI agents by identifying required integrations and guiding them through setup.

Available integrations:
- telegram: Telegram Bot API for messaging
- trading: DEX trading and price monitoring
- twitter: Twitter API for social media
- email: Email automation
- discord: Discord bot functionality

When the user describes what they want, identify which integrations they need and explain the setup process.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', openAIResponse.status);
      const errorText = await openAIResponse.text();
      console.error('Error details:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIResult = await openAIResponse.json();
    console.log('OpenAI response received');
    
    const aiMessage = openAIResult.choices[0].message.content;

    // Simple integration detection based on message content
    const suggestedIntegrations = [];
    if (message.toLowerCase().includes('telegram')) {
      suggestedIntegrations.push('telegram');
    }
    if (message.toLowerCase().includes('trading') || message.toLowerCase().includes('trade')) {
      suggestedIntegrations.push('trading');
    }
    if (message.toLowerCase().includes('twitter')) {
      suggestedIntegrations.push('twitter');
    }

    return new Response(
      JSON.stringify({
        response: {
          content: aiMessage,
          metadata: {
            suggestedIntegrations,
            currentStep: 'integration_setup'
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in conversational-agent-builder:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});