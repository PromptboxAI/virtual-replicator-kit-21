import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { ensName, walletAddress, userId } = await req.json()

    console.log('ENS resolution request:', { ensName, walletAddress, userId })

    // If ENS name is provided, try to resolve it
    let resolvedWallet = walletAddress
    if (ensName && ensName.endsWith('.eth')) {
      try {
        // Using a public ENS resolver API (Infura or Alchemy)
        const ensResponse = await fetch(`https://api.ensideas.com/ens/resolve/${ensName}`)
        if (ensResponse.ok) {
          const ensData = await ensResponse.json()
          if (ensData.address) {
            resolvedWallet = ensData.address
            console.log(`Resolved ENS ${ensName} to ${resolvedWallet}`)
          }
        }
      } catch (error) {
        console.log('ENS resolution failed:', error.message)
        // Continue with provided wallet address if ENS resolution fails
      }
    }

    // Update the user profile with wallet and ENS information
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        wallet_address: walletAddress,
        ens_name: ensName || null,
        resolved_wallet: resolvedWallet,
        wallet_last_updated: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Also update any agents created by this user to include their wallet info
    const { error: agentUpdateError } = await supabase
      .from('agents')
      .update({
        creator_wallet_address: resolvedWallet,
        creator_ens_name: ensName || null
      })
      .eq('creator_id', userId)

    if (agentUpdateError) {
      console.error('Error updating agent creator wallet:', agentUpdateError)
    }

    console.log('Successfully updated wallet mapping for user:', userId)

    return new Response(
      JSON.stringify({
        success: true,
        profile,
        resolvedWallet,
        ensResolved: resolvedWallet !== walletAddress
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('ENS resolution error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})