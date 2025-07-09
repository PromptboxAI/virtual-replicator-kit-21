import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { createHmac } from "node:crypto";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TWITTER_CLIENT_ID = Deno.env.get('TWITTER_CLIENT_ID')?.trim()
const TWITTER_CLIENT_SECRET = Deno.env.get('TWITTER_CLIENT_SECRET')?.trim()
const TWITTER_REDIRECT_URI = `${supabaseUrl}/functions/v1/twitter-auth`

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret = ''
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
  )}`
  
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`
  const hmacSha1 = createHmac('sha1', signingKey)
  return hmacSha1.update(signatureBaseString).digest('base64')
}

function generateOAuthHeader(method: string, url: string, additionalParams = {}) {
  const oauthParams = {
    oauth_consumer_key: TWITTER_CLIENT_ID!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    oauth_callback: TWITTER_REDIRECT_URI,
    ...additionalParams
  }

  const signature = generateOAuthSignature(method, url, oauthParams, TWITTER_CLIENT_SECRET!)
  const signedOAuthParams = { ...oauthParams, oauth_signature: signature }

  return 'OAuth ' + Object.entries(signedOAuthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ')
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const oauth_token = url.searchParams.get('oauth_token')
    const oauth_verifier = url.searchParams.get('oauth_verifier')
    const user_id = url.searchParams.get('user_id')

    // Step 1: Get request token (initiate OAuth)
    if (!oauth_token && !oauth_verifier && user_id) {
      const requestTokenUrl = 'https://api.twitter.com/oauth/request_token'
      const authHeader = generateOAuthHeader('POST', requestTokenUrl)

      const response = await fetch(requestTokenUrl, {
        method: 'POST',
        headers: { Authorization: authHeader }
      })

      const responseText = await response.text()
      const params = new URLSearchParams(responseText)
      const requestToken = params.get('oauth_token')

      if (!requestToken) {
        throw new Error('Failed to get request token')
      }

      const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${requestToken}&force_login=true`
      
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 2: Handle callback and get access token
    if (oauth_token && oauth_verifier) {
      const accessTokenUrl = 'https://api.twitter.com/oauth/access_token'
      const oauthParams = {
        oauth_consumer_key: TWITTER_CLIENT_ID!,
        oauth_nonce: Math.random().toString(36).substring(2),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: oauth_token,
        oauth_version: '1.0'
      }

      const signature = generateOAuthSignature('POST', accessTokenUrl, oauthParams, TWITTER_CLIENT_SECRET!)
      const authHeader = 'OAuth ' + Object.entries({ ...oauthParams, oauth_signature: signature })
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
        .join(', ')

      const response = await fetch(accessTokenUrl, {
        method: 'POST',
        headers: { Authorization: authHeader },
        body: `oauth_verifier=${oauth_verifier}`
      })

      const responseText = await response.text()
      const params = new URLSearchParams(responseText)
      
      const accessToken = params.get('oauth_token')
      const accessTokenSecret = params.get('oauth_token_secret')
      const screenName = params.get('screen_name')
      const userId = params.get('user_id')

      if (!accessToken || !accessTokenSecret) {
        throw new Error('Failed to get access token')
      }

      // Get user profile data
      const userUrl = 'https://api.twitter.com/1.1/users/show.json'
      const userParams = {
        oauth_consumer_key: TWITTER_CLIENT_ID!,
        oauth_nonce: Math.random().toString(36).substring(2),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: accessToken,
        oauth_version: '1.0',
        user_id: userId!
      }

      const userSignature = generateOAuthSignature('GET', userUrl, userParams, TWITTER_CLIENT_SECRET!, accessTokenSecret)
      const userAuthHeader = 'OAuth ' + Object.entries({ ...userParams, oauth_signature: userSignature })
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
        .join(', ')

      const userResponse = await fetch(`${userUrl}?user_id=${userId}`, {
        headers: { Authorization: userAuthHeader }
      })

      const userData = await userResponse.json()

      // Return user data to be stored by the client
      const twitterData = {
        twitter_id: userId,
        twitter_username: screenName,
        twitter_display_name: userData.name,
        twitter_avatar_url: userData.profile_image_url_https,
        access_token: accessToken,
        access_token_secret: accessTokenSecret
      }

      // Close the popup and return data to parent
      const html = `
        <html>
          <body>
            <script>
              window.opener.postMessage(${JSON.stringify({ success: true, data: twitterData })}, '*');
              window.close();
            </script>
          </body>
        </html>
      `

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    throw new Error('Invalid request')

  } catch (error: any) {
    console.error('Twitter auth error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})