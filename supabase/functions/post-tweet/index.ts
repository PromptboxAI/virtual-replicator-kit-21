import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

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
    // ========================================
    // AUTHENTICATION CHECK
    // ========================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[POST-TWEET] Missing Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's auth token to verify identity
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error('[POST-TWEET] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[POST-TWEET] Authenticated user: ${user.id}`);

    // Parse request body
    const { agentId, content } = await req.json();
    
    if (!agentId || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing agentId or content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate content length (Twitter limit is 280 characters)
    if (content.length > 280) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tweet content exceeds 280 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // AUTHORIZATION CHECK - Verify user owns the agent
    // ========================================
    // Use service role client for database queries
    const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Get agent and verify ownership
    const { data: agent, error: agentError } = await serviceSupabase
      .from('agents')
      .select('id, creator_id, twitter_api_configured, twitter_api_encrypted_credentials')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('[POST-TWEET] Agent not found:', agentError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user owns the agent
    if (agent.creator_id !== user.id) {
      console.error(`[POST-TWEET] Forbidden: User ${user.id} does not own agent ${agentId} (owner: ${agent.creator_id})`);
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: You do not own this agent' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[POST-TWEET] User ${user.id} authorized to post for agent ${agentId}`);

    // ========================================
    // TWITTER API CONFIGURATION CHECK
    // ========================================
    if (!agent.twitter_api_configured || !agent.twitter_api_encrypted_credentials) {
      return new Response(
        JSON.stringify({ success: false, error: 'Twitter API not configured for this agent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt stored credentials (simplified for demo - in production use proper encryption)
    let credentials;
    try {
      // For now, assume credentials are stored as JSON (in production, decrypt properly)
      credentials = JSON.parse(agent.twitter_api_encrypted_credentials || '{}');
      
      if (!credentials.consumer_key || !credentials.consumer_secret || 
          !credentials.access_token || !credentials.access_token_secret) {
        throw new Error('Missing required Twitter API credentials');
      }
    } catch (parseError) {
      console.error('[POST-TWEET] Failed to parse credentials:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse stored Twitter credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // POST THE TWEET
    // ========================================
    const tweetResult = await sendTweet(content, credentials);
    
    console.log(`[POST-TWEET] Tweet posted successfully:`, tweetResult);

    // Log the successful tweet with user attribution
    await serviceSupabase
      .from('agent_logs')
      .insert({
        agent_id: agentId,
        log_level: 'info',
        message: `Tweet posted successfully`,
        context: { 
          tweet_id: tweetResult.data?.id,
          content: content,
          posted_by_user_id: user.id,
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

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
