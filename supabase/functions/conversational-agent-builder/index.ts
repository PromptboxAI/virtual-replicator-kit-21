import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Edge function starting up...');

serve(async (req: Request) => {
  console.log('Request received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    
    const body = await req.json();
    console.log('Request body received:', JSON.stringify(body));
    
    const { message } = body;
    console.log('User message:', message);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API key present:', !!openAIApiKey);
    console.log('OpenAI API key length:', openAIApiKey?.length || 0);
    
    if (!openAIApiKey) {
      console.error('No OpenAI API key found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log('About to call OpenAI API...');
    
    const startTime = Date.now();
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
            content: 'You are a helpful AI agent builder assistant. Help users create custom AI agents step by step.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`OpenAI request completed in ${responseTime}ms`);
    console.log('OpenAI response status:', openAIResponse.status);
    
    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI error:', errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI error: ${openAIResponse.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const result = await openAIResponse.json();
    console.log('OpenAI response received successfully');
    
    const aiMessage = result.choices[0].message.content;
    console.log('AI response:', aiMessage);
    
    const response = {
      response: {
        content: aiMessage,
        metadata: {
          suggestedIntegrations: [],
          currentStep: 'discovery'
        }
      }
    };
    
    console.log('Sending response back to client');
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Caught error:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});