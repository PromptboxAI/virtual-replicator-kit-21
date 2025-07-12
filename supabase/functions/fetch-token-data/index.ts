import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MoralisTokenData {
  usdPrice?: number;
  usdPriceFormatted?: string;
  "24hrPercentChange"?: string;
  marketCap?: string;
  fullyDilutedValuation?: string;
  totalSupply?: string;
  circulatingSupply?: string;
  holders?: string;
  volume24h?: string;
}

interface TokenDataResponse {
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  circulatingSupply: number;
  holders: number;
  totalSupply: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tokenAddress, chain = 'base' } = await req.json();
    
    if (!tokenAddress) {
      return new Response(
        JSON.stringify({ error: 'Token address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const moralisApiKey = Deno.env.get('MORALIS_API_KEY');
    if (!moralisApiKey) {
      return new Response(
        JSON.stringify({ error: 'Moralis API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch token price and metadata from Moralis
    const priceUrl = `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/price?chain=${chain}`;
    const metadataUrl = `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/metadata?chain=${chain}`;
    const statsUrl = `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/stats?chain=${chain}`;

    const headers = {
      'accept': 'application/json',
      'X-API-Key': moralisApiKey
    };

    // Fetch all data in parallel
    const [priceResponse, metadataResponse, statsResponse] = await Promise.all([
      fetch(priceUrl, { headers }),
      fetch(metadataUrl, { headers }),
      fetch(statsUrl, { headers })
    ]);

    if (!priceResponse.ok) {
      console.error('Moralis price API error:', await priceResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch token price data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const priceData: MoralisTokenData = await priceResponse.json();
    let metadataData: any = {};
    let statsData: any = {};

    // Handle optional metadata and stats (might not be available for all tokens)
    if (metadataResponse.ok) {
      metadataData = await metadataResponse.json();
    }
    
    if (statsResponse.ok) {
      statsData = await statsResponse.json();
    }

    // Parse and format the data
    const tokenData: TokenDataResponse = {
      currentPrice: parseFloat(priceData.usdPrice?.toString() || '0'),
      marketCap: parseFloat(priceData.marketCap || '0'),
      volume24h: parseFloat(priceData.volume24h || statsData.volume24h || '0'),
      priceChange24h: parseFloat(priceData["24hrPercentChange"] || '0'),
      circulatingSupply: parseFloat(priceData.circulatingSupply || metadataData.possible_spam ? '0' : metadataData.total_supply || '0'),
      holders: parseInt(statsData.holders || priceData.holders || '0'),
      totalSupply: parseFloat(priceData.totalSupply || metadataData.total_supply || '0')
    };

    return new Response(
      JSON.stringify(tokenData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching token data:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});