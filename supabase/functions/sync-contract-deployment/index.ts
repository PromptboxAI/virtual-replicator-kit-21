/**
 * Sync Contract Deployment Edge Function
 * 
 * Phase 1 Security: Moves client-side database writes to server-validated edge function.
 * Validates contract addresses and transaction hashes before recording deployments.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid contract types
const VALID_CONTRACT_TYPES = [
  'bonding_curve',
  'agent_factory',
  'graduation_manager',
  'trading_router',
  'prototype_token',
  'agent_token',
  'prompt_token',
  'lp_locker',
  'team_vesting',
  'ecosystem_rewards',
  'vault',
] as const;

// Valid networks
const VALID_NETWORKS = ['base_sepolia', 'base_mainnet'] as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const {
      contractAddress,
      contractType,
      transactionHash,
      network = 'base_sepolia',
      deployerAddress,
      name,
      symbol,
      agentId,
    } = body;

    // Validate required fields
    if (!contractAddress || !contractType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: contractAddress and contractType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate contract address format (0x followed by 40 hex characters)
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return new Response(
        JSON.stringify({ error: 'Invalid contract address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate transaction hash if provided
    if (transactionHash && !/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return new Response(
        JSON.stringify({ error: 'Invalid transaction hash format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate contract type
    if (!VALID_CONTRACT_TYPES.includes(contractType)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid contract type. Must be one of: ${VALID_CONTRACT_TYPES.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate network
    if (!VALID_NETWORKS.includes(network)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid network. Must be one of: ${VALID_NETWORKS.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate deployer address if provided
    if (deployerAddress && !/^0x[a-fA-F0-9]{40}$/.test(deployerAddress)) {
      return new Response(
        JSON.stringify({ error: 'Invalid deployer address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if contract already exists
    const { data: existing } = await supabase
      .from('deployed_contracts')
      .select('id')
      .eq('contract_address', contractAddress.toLowerCase())
      .eq('network', network)
      .single();

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('deployed_contracts')
        .update({
          contract_type: contractType,
          transaction_hash: transactionHash?.toLowerCase(),
          deployer_address: deployerAddress?.toLowerCase(),
          name: name || null,
          symbol: symbol || null,
          agent_id: agentId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true, data, updated: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new deployment record
    const { data, error } = await supabase
      .from('deployed_contracts')
      .insert({
        contract_address: contractAddress.toLowerCase(),
        contract_type: contractType,
        transaction_hash: transactionHash?.toLowerCase() || null,
        network: network,
        deployer_address: deployerAddress?.toLowerCase() || null,
        name: name || null,
        symbol: symbol || null,
        agent_id: agentId || null,
        verified: false, // Will be verified by separate process
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`[sync-contract-deployment] Recorded ${contractType} at ${contractAddress} on ${network}`);

    return new Response(
      JSON.stringify({ ok: true, data, created: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[sync-contract-deployment] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
