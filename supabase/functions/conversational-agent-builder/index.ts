import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Conversational agent builder called');
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    const { message, agentName } = requestBody;
    console.log('Processing message:', message);

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    // Simple response logic based on message content
    let responseContent = '';
    let suggestedIntegrations: string[] = [];
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('telegram') && lowerMessage.includes('trading')) {
      responseContent = `Perfect! I'll help you build a Telegram trading bot. This is an excellent choice for automated trading with user interaction.

**Here's what we need to set up:**

🤖 **Telegram Bot Integration**
- Get bot token from @BotFather on Telegram
- Set up commands and message handling
- Configure notifications for trade updates

📈 **Trading Integration** 
- Connect to DEX APIs (Uniswap, PancakeSwap, etc.)
- Set up wallet/private key for trade execution
- Configure risk management parameters

**First Step:** Let's get your Telegram Bot Token. Have you created a bot with @BotFather yet?

If not, here's how:
1. Message @BotFather on Telegram
2. Send /newbot
3. Choose a name and username for your bot
4. Copy the bot token it gives you

Do you have a Telegram bot token ready, or should I guide you through creating one?`;

      suggestedIntegrations = ['telegram', 'trading'];
      
    } else if (lowerMessage.includes('telegram')) {
      responseContent = `Great! A Telegram bot is a powerful way to create an interactive AI agent. What would you like your Telegram bot to do?

Some popular options:
- 📈 Trading and DeFi operations
- 📰 News and updates
- 💬 Customer support
- 🎮 Gaming and entertainment
- 📊 Analytics and reporting

Tell me more about the specific functionality you want!`;
      
      suggestedIntegrations = ['telegram'];
      
    } else {
      responseContent = `I'd love to help you build a custom AI agent! To get started, I need to understand what you want your agent to do.

**Popular agent types:**
- 🤖 **Telegram Trading Bot** - Execute trades, monitor prices, send alerts
- 🐦 **Twitter Bot** - Auto-post content, engage with users, track mentions  
- 💬 **Discord Bot** - Moderate servers, provide info, fun commands
- 📧 **Email Automation** - Process emails, send reports, manage communications
- 🔗 **Multi-platform Agent** - Combine multiple services

**What specific tasks do you want your agent to handle?** The more detail you provide, the better I can help you build exactly what you need!`;
      
      suggestedIntegrations = [];
    }

    const response = {
      response: {
        content: responseContent,
        metadata: {
          suggestedIntegrations,
          currentStep: suggestedIntegrations.length > 0 ? 'integration_setup' : 'discovery'
        }
      }
    };

    console.log('Sending successful response');
    
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