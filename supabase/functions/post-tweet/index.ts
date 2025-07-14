import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);

// Twitter API credentials from agent's encrypted storage
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(
    consumerSecret
  )}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");

  return signature;
}

function generateOAuthHeader(
  method: string, 
  url: string, 
  credentials: any
): string {
  const oauthParams = {
    oauth_consumer_key: credentials.consumer_key,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.access_token,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    credentials.consumer_secret,
    credentials.access_token_secret
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const entries = Object.entries(signedOAuthParams).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    "OAuth " +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

async function sendTweet(tweetText: string, credentials: any): Promise<any> {
  const url = "https://api.x.com/2/tweets";
  const method = "POST";
  const params = { text: tweetText };

  const oauthHeader = generateOAuthHeader(method, url, credentials);

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${responseText}`
    );
  }

  return JSON.parse(responseText);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, content } = await req.json();
    
    if (!agentId || !content) {
      throw new Error('Missing agentId or content');
    }

    console.log(`[POST-TWEET] Posting tweet for agent ${agentId}: ${content}`);

    // Get agent with Twitter credentials
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentError?.message}`);
    }

    if (!agent.twitter_api_configured || !agent.twitter_api_encrypted_credentials) {
      throw new Error('Twitter API not configured for this agent');
    }

    // For demo purposes, we'll simulate the decryption
    // In production, you'd decrypt the stored credentials
    const credentials = JSON.parse(agent.twitter_api_encrypted_credentials || '{}');
    
    if (!credentials.consumer_key || !credentials.consumer_secret || 
        !credentials.access_token || !credentials.access_token_secret) {
      throw new Error('Invalid Twitter credentials stored');
    }

    // Post the tweet
    const tweetResult = await sendTweet(content, credentials);
    
    console.log(`[POST-TWEET] Tweet posted successfully:`, tweetResult);

    // Log the successful tweet
    await supabase
      .from('agent_logs')
      .insert({
        agent_id: agentId,
        log_level: 'info',
        message: `Tweet posted successfully`,
        context: { 
          tweet_id: tweetResult.data?.id,
          content: content,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(JSON.stringify({
      success: true,
      tweet_id: tweetResult.data?.id,
      message: 'Tweet posted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[POST-TWEET] Error:', error);

    // Log the error
    if (req.body) {
      const { agentId } = await req.json();
      if (agentId) {
        await supabase
          .from('agent_logs')
          .insert({
            agent_id: agentId,
            log_level: 'error',
            message: `Tweet posting failed: ${error.message}`,
            context: { error: error.message }
          });
      }
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});