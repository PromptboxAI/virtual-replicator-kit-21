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
    
    // For now, let's use a simpler approach to avoid hanging
    // We'll add the full Assistant creation once the conversation flow works
    let aiMessage = "";
    let suggestedIntegrations = [];
    
    // Simple logic to provide guidance based on message content
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('telegram') && lowerMessage.includes('trading')) {
      aiMessage = `Perfect! I'll help you build a Telegram trading bot. This is an excellent choice for automated trading with user interaction.

**Here's what we need to set up:**

🤖 **Telegram Bot Integration**
- Get bot token from @BotFather on Telegram
- Set up commands and message handling
- Configure notifications for trade updates

📈 **Trading Integration** 
- Connect to DEX APIs (Uniswap, PancakeSwap, etc.)
- Set up wallet/private key for trade execution
- Configure risk management parameters

💡 **Additional Features**
- Price monitoring and alerts
- Portfolio tracking
- Trade history and analytics

**First Step:** Let's get your Telegram Bot Token. Have you created a bot with @BotFather yet?

If not, here's how:
1. Message @BotFather on Telegram
2. Send /newbot
3. Choose a name and username for your bot
4. Copy the bot token it gives you

Do you have a Telegram bot token ready, or should I guide you through creating one?`;

      suggestedIntegrations = ['telegram', 'trading'];
      
    } else if (lowerMessage.includes('telegram')) {
      aiMessage = `Great! A Telegram bot is a powerful way to create an interactive AI agent. What would you like your Telegram bot to do?

Some popular options:
- 📈 Trading and DeFi operations
- 📰 News and updates
- 💬 Customer support
- 🎮 Gaming and entertainment
- 📊 Analytics and reporting

Tell me more about the specific functionality you want!`;
      
      suggestedIntegrations = ['telegram'];
      
    } else {
      aiMessage = `I'd love to help you build a custom AI agent! To get started, I need to understand what you want your agent to do.

**Popular agent types:**
- 🤖 **Telegram Trading Bot** - Execute trades, monitor prices, send alerts
- 🐦 **Twitter Bot** - Auto-post content, engage with users, track mentions  
- 💬 **Discord Bot** - Moderate servers, provide info, fun commands
- 📧 **Email Automation** - Process emails, send reports, manage communications
- 🔗 **Multi-platform Agent** - Combine multiple services

**What specific tasks do you want your agent to handle?** The more detail you provide, the better I can help you build exactly what you need!`;
      
      suggestedIntegrations = [];
    }

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