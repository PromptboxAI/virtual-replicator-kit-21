import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { model, prompt, userInput, temperature, maxTokens } = await req.json();

    console.log('Executing workflow with:', { model, prompt, userInput, temperature, maxTokens });

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!userInput) {
      return new Response(
        JSON.stringify({ error: 'User input is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Call OpenAI Chat Completions API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: prompt || 'You are a helpful AI assistant. Respond to the user\'s query in a helpful and informative way.' 
          },
          { role: 'user', content: userInput }
        ],
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 1000
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'No response generated';

    console.log('AI Response:', aiResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: aiResponse,
        model: model || 'gpt-4o-mini',
        tokensUsed: data.usage?.total_tokens || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in execute-workflow function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});