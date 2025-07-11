import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      agentId, 
      tokenAddress, 
      transactionHash,
      blockNumber,
      eventType,
      userAddress,
      promptAmount,
      tokenAmount,
      pricePerToken
    } = await req.json();

    console.log('Processing token event:', {
      agentId,
      tokenAddress,
      eventType,
      transactionHash
    });

    // Update agent with token address if not set
    if (tokenAddress && eventType === 'token_created') {
      const { error: agentError } = await supabase
        .from('agents')
        .update({ 
          token_address: tokenAddress,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId);

      if (agentError) {
        console.error('Error updating agent:', agentError);
        throw agentError;
      }
    }

    // Record transaction if it's a buy/sell event
    if (eventType === 'buy' || eventType === 'sell') {
      const { error: txError } = await supabase
        .from('agent_token_transactions')
        .insert({
          agent_id: agentId,
          user_id: userAddress,
          transaction_type: eventType,
          prompt_amount: promptAmount,
          token_amount: tokenAmount,
          price_per_token: pricePerToken,
          transaction_hash: transactionHash,
          block_number: blockNumber,
          status: 'confirmed'
        });

      if (txError) {
        console.error('Error recording transaction:', txError);
        throw txError;
      }

      // Update or create user holdings
      const { data: existingHolding } = await supabase
        .from('agent_token_holders')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', userAddress)
        .single();

      if (existingHolding) {
        // Update existing holding
        const newBalance = eventType === 'buy' 
          ? existingHolding.token_balance + parseFloat(tokenAmount)
          : existingHolding.token_balance - parseFloat(tokenAmount);

        const newInvested = eventType === 'buy'
          ? existingHolding.total_invested + parseFloat(promptAmount)
          : existingHolding.total_invested;

        const newAveragePrice = newInvested / newBalance;

        const { error: updateError } = await supabase
          .from('agent_token_holders')
          .update({
            token_balance: newBalance,
            total_invested: newInvested,
            average_buy_price: newAveragePrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingHolding.id);

        if (updateError) {
          console.error('Error updating holding:', updateError);
          throw updateError;
        }
      } else if (eventType === 'buy') {
        // Create new holding for buy
        const { error: createError } = await supabase
          .from('agent_token_holders')
          .insert({
            agent_id: agentId,
            user_id: userAddress,
            token_balance: parseFloat(tokenAmount),
            total_invested: parseFloat(promptAmount),
            average_buy_price: parseFloat(pricePerToken)
          });

        if (createError) {
          console.error('Error creating holding:', createError);
          throw createError;
        }
      }
    }

    // Create price snapshot
    if (eventType === 'buy' || eventType === 'sell' || eventType === 'price_update') {
      // Get token metrics from the request or fetch from contract
      const { error: snapshotError } = await supabase
        .from('agent_price_snapshots')
        .insert({
          agent_id: agentId,
          price: parseFloat(pricePerToken),
          market_cap: 0, // Will be calculated from contract data
          volume_24h: 0, // Will be calculated from recent transactions
          holders_count: 0, // Will be calculated from holdings table
          prompt_raised: 0, // Will be fetched from contract
          circulating_supply: 0 // Will be fetched from contract
        });

      if (snapshotError) {
        console.error('Error creating price snapshot:', snapshotError);
        // Don't throw here as this is not critical
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Token event processed successfully',
        agentId,
        eventType 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in process-token-event function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});