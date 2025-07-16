import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { revenue_type, amount, agent_id, transaction_hash, network } = await req.json()

    console.log('Tracking revenue:', { revenue_type, amount, agent_id, transaction_hash, network })

    // Validate required fields
    if (!revenue_type || !amount || !network) {
      throw new Error('Missing required fields: revenue_type, amount, network')
    }

    // Valid revenue types
    const validTypes = ['agent_creation', 'trading_fee']
    if (!validTypes.includes(revenue_type)) {
      throw new Error(`Invalid revenue_type. Must be one of: ${validTypes.join(', ')}`)
    }

    // Insert revenue record
    const { data, error } = await supabase
      .from('platform_revenue')
      .insert({
        revenue_type,
        amount: parseFloat(amount),
        agent_id: agent_id || null,
        transaction_hash: transaction_hash || null,
        network
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting revenue record:', error)
      throw error
    }

    console.log('Revenue tracked successfully:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        revenue_id: data.id,
        message: 'Revenue tracked successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in track-revenue function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})