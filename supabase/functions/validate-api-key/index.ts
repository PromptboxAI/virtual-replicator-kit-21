import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  keyName: string;
  keyValue: string;
  category: string;
}

async function validateTwitterAPI(keyValue: string, keyName: string): Promise<boolean> {
  try {
    // Basic format validation for Twitter API keys
    if (keyName === 'TWITTER_API_KEY') {
      return keyValue.length >= 15 && /^[a-zA-Z0-9]+$/.test(keyValue);
    }
    if (keyName === 'TWITTER_API_SECRET') {
      return keyValue.length >= 40 && /^[a-zA-Z0-9]+$/.test(keyValue);
    }
    if (keyName === 'TWITTER_ACCESS_TOKEN') {
      return keyValue.includes('-') && keyValue.length >= 40;
    }
    if (keyName === 'TWITTER_ACCESS_SECRET') {
      return keyValue.length >= 40 && /^[a-zA-Z0-9]+$/.test(keyValue);
    }
    return true;
  } catch (error) {
    console.error('Twitter validation error:', error);
    return false;
  }
}

async function validateCoinbaseAPI(keyValue: string, keyName: string): Promise<boolean> {
  try {
    // Basic format validation for Coinbase API keys
    if (keyName === 'COINBASE_API_KEY') {
      return keyValue.length >= 32 && /^[a-f0-9]+$/.test(keyValue);
    }
    if (keyName === 'COINBASE_API_SECRET') {
      return keyValue.length >= 40;
    }
    return true;
  } catch (error) {
    console.error('Coinbase validation error:', error);
    return false;
  }
}

async function validateBinanceAPI(keyValue: string, keyName: string): Promise<boolean> {
  try {
    // Basic format validation for Binance API keys
    if (keyName === 'BINANCE_API_KEY') {
      return keyValue.length === 64 && /^[a-zA-Z0-9]+$/.test(keyValue);
    }
    if (keyName === 'BINANCE_API_SECRET') {
      return keyValue.length === 64 && /^[a-zA-Z0-9]+$/.test(keyValue);
    }
    return true;
  } catch (error) {
    console.error('Binance validation error:', error);
    return false;
  }
}

async function validateDiscordBot(keyValue: string): Promise<boolean> {
  try {
    // Basic format validation for Discord bot tokens
    return keyValue.length >= 50 && keyValue.includes('.') && /^[a-zA-Z0-9._-]+$/.test(keyValue);
  } catch (error) {
    console.error('Discord validation error:', error);
    return false;
  }
}

async function validateGenericAPI(keyValue: string, keyName: string): Promise<boolean> {
  try {
    // Basic validation for other API keys
    if (keyName.includes('INFURA')) {
      return keyValue.length === 32 && /^[a-f0-9]+$/.test(keyValue);
    }
    if (keyName.includes('COINMARKETCAP')) {
      return keyValue.length >= 30 && /^[a-f0-9-]+$/.test(keyValue);
    }
    if (keyName.includes('COINGECKO')) {
      return keyValue.startsWith('CG-') && keyValue.length >= 30;
    }
    if (keyName.includes('YOUTUBE')) {
      return keyValue.startsWith('AIza') && keyValue.length === 39;
    }
    if (keyName.includes('TELEGRAM')) {
      return /^\d+:[a-zA-Z0-9_-]+$/.test(keyValue);
    }
    
    // Default validation - just check it's not empty and has reasonable length
    return keyValue.trim().length >= 8;
  } catch (error) {
    console.error('Generic validation error:', error);
    return false;
  }
}

async function validateAPIKey(keyName: string, keyValue: string, category: string): Promise<boolean> {
  if (!keyValue || keyValue.trim().length === 0) {
    return false;
  }

  // Twitter API validation
  if (keyName.startsWith('TWITTER_')) {
    return await validateTwitterAPI(keyValue, keyName);
  }

  // Coinbase API validation
  if (keyName.startsWith('COINBASE_')) {
    return await validateCoinbaseAPI(keyValue, keyName);
  }

  // Binance API validation
  if (keyName.startsWith('BINANCE_')) {
    return await validateBinanceAPI(keyValue, keyName);
  }

  // Discord bot validation
  if (keyName === 'DISCORD_BOT_TOKEN') {
    return await validateDiscordBot(keyValue);
  }

  // Generic API key validation
  return await validateGenericAPI(keyValue, keyName);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyName, keyValue, category }: ValidationRequest = await req.json();

    console.log(`Validating API key: ${keyName} for category: ${category}`);

    const isValid = await validateAPIKey(keyName, keyValue, category);

    return new Response(JSON.stringify({ 
      valid: isValid,
      keyName,
      message: isValid ? 'API key format is valid' : 'API key format is invalid'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('API key validation error:', error);
    return new Response(JSON.stringify({ 
      valid: false,
      error: error.message || 'Validation failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});