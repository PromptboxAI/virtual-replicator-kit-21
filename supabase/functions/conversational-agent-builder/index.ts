import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Function called successfully');
    
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { message } = body;
    
    // Simple hardcoded response for now to test
    const responseContent = `I understand you want to build: "${message}"

For a Telegram trading bot, you'll need:

**Required Integrations:**
🤖 **Telegram Bot API** - For user interaction
📈 **Trading/DEX Integration** - For executing trades  
💰 **Price Monitoring** - For market data

**Next Steps:**
1. Get Telegram Bot Token from @BotFather
2. Set up trading wallet/private key
3. Choose your preferred DEX (Uniswap, PancakeSwap, etc.)

Which integration would you like to set up first?`;

    const response = {
      response: {
        content: responseContent,
        metadata: {
          suggestedIntegrations: ['telegram', 'trading'],
          currentStep: 'integration_setup'
        }
      }
    };

    console.log('Sending response:', JSON.stringify(response));

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
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