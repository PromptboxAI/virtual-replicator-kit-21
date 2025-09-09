import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requesterId, targetUserId, amount } = await req.json();

    if (!requesterId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing requesterId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetId = targetUserId || requesterId;
    const newAmount = Number(amount ?? 200000);
    if (!Number.isFinite(newAmount) || newAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role using has_role RPC
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: requesterId,
      _role: 'admin'
    });

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if balance record exists
    const { data: existing, error: fetchErr } = await supabase
      .from('user_token_balances')
      .select('user_id')
      .eq('user_id', targetId)
      .maybeSingle();

    if (fetchErr) {
      console.error('Fetch balance error:', fetchErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existing) {
      const { error: updateErr } = await supabase
        .from('user_token_balances')
        .update({ balance: newAmount, test_mode: true, updated_at: new Date().toISOString() })
        .eq('user_id', targetId);

      if (updateErr) {
        console.error('Update balance error:', updateErr);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update balance' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { error: insertErr } = await supabase
        .from('user_token_balances')
        .insert({ user_id: targetId, balance: newAmount, test_mode: true });

      if (insertErr) {
        console.error('Insert balance error:', insertErr);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create balance record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, user_id: targetId, balance: newAmount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Set off-chain balance error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});