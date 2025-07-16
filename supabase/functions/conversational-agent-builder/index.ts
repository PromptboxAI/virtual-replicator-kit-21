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
    console.log('Function called successfully');
    
    const { message, agentName, buildingPhase, conversationHistory = [] } = await req.json();
    console.log('Received message:', message);

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Build the conversation for OpenAI
    const systemPrompt = `You are an expert AI agent builder assistant. Help users create custom AI agents by:

1. Understanding their requirements through conversation
2. Identifying needed integrations (telegram, trading, twitter, email, discord, etc.)
3. Guiding them through API key setup step-by-step
4. Explaining what each integration does and why it's needed

Available integrations:
- telegram: Telegram Bot API for messaging and commands
- trading: DEX trading, price monitoring, swap execution
- twitter: Twitter API for posting, monitoring mentions
- email: Email automation and notifications
- discord: Discord bot functionality
- webhook: External notifications and triggers

When you identify integrations needed, be specific about:
- Which APIs are required
- How to get API keys
- What permissions are needed
- Step-by-step setup instructions

Be conversational and ask clarifying questions to understand exactly what they want to build.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-8), // Keep last 8 messages for context
      { role: 'user', content: message }
    ];

    console.log('Calling OpenAI API...');
    
    // Call OpenAI with timeout
    const openAIResponse = await Promise.race([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 600,
          temperature: 0.7
        })
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI timeout')), 10000)
      )
    ]) as Response;

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', openAIResponse.status);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIResult = await openAIResponse.json();
    console.log('OpenAI response received');
    
    const aiMessage = openAIResult.choices[0].message.content;

    // Detect integrations mentioned in the response or original message
    const suggestedIntegrations = [];
    const fullText = (message + ' ' + aiMessage).toLowerCase();
    
    if (fullText.includes('telegram')) suggestedIntegrations.push('telegram');
    if (fullText.includes('trading') || fullText.includes('trade') || fullText.includes('swap')) suggestedIntegrations.push('trading');
    if (fullText.includes('twitter') || fullText.includes('tweet')) suggestedIntegrations.push('twitter');
    if (fullText.includes('email')) suggestedIntegrations.push('email');
    if (fullText.includes('discord')) suggestedIntegrations.push('discord');

    return new Response(
      JSON.stringify({
        response: {
          content: aiMessage,
          metadata: {
            suggestedIntegrations,
            currentStep: suggestedIntegrations.length > 0 ? 'integration_setup' : 'discovery'
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
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