import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentDetails {
  agent: any;
  marketing: any;
  team: any[];
  roadmap: any[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('id');
    const symbol = url.searchParams.get('symbol');
    const includeMarketing = url.searchParams.get('includeMarketing') !== 'false';
    const includeTeam = url.searchParams.get('includeTeam') !== 'false';
    const includeRoadmap = url.searchParams.get('includeRoadmap') !== 'false';

    console.log('📋 get-agent-details called:', {
      agentId,
      symbol,
      includeMarketing,
      includeTeam,
      includeRoadmap,
      method: req.method,
    });

    if (!agentId && !symbol) {
      console.error('❌ Missing required parameter: id or symbol');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter', 
          message: 'Either "id" or "symbol" parameter is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(
      'https://cjzazuuwapsliacmjxfg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemF6dXV3YXBzbGlhY21qeGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDk1ODgsImV4cCI6MjA2NzU4NTU4OH0.RuRyIGlY0362B3yLcMZEGuCyhAYVIK9K7mcW7BiXpAc'
    );

    // Fetch agent data
    console.log('🔍 Fetching agent data...');
    let agentQuery = supabase
      .from('agents')
      .select('*');
    
    if (agentId) {
      agentQuery = agentQuery.eq('id', agentId);
    } else if (symbol) {
      agentQuery = agentQuery.eq('symbol', symbol.toUpperCase());
    }

    const { data: agent, error: agentError } = await agentQuery.single();

    if (agentError || !agent) {
      console.error('❌ Agent not found:', agentError);
      return new Response(
        JSON.stringify({ 
          error: 'Agent not found', 
          message: agentError?.message || 'No agent found with the provided identifier' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Agent found:', { id: agent.id, name: agent.name, symbol: agent.symbol });

    const result: AgentDetails = {
      agent,
      marketing: null,
      team: [],
      roadmap: [],
    };

    // Fetch marketing data if requested
    if (includeMarketing) {
      console.log('📸 Fetching marketing data...');
      const { data: marketing, error: marketingError } = await supabase
        .from('agent_marketing')
        .select('*')
        .eq('agent_id', agent.id)
        .maybeSingle();

      if (marketingError) {
        console.warn('⚠️ Error fetching marketing data:', marketingError);
      } else {
        result.marketing = marketing;
        console.log('✅ Marketing data fetched:', marketing ? 'Found' : 'None');
      }
    }

    // Fetch team members if requested
    if (includeTeam) {
      console.log('👥 Fetching team members...');
      const { data: team, error: teamError } = await supabase
        .from('agent_team_members')
        .select('*')
        .eq('agent_id', agent.id)
        .order('order_index', { ascending: true });

      if (teamError) {
        console.warn('⚠️ Error fetching team members:', teamError);
      } else {
        result.team = team || [];
        console.log('✅ Team members fetched:', team?.length || 0);
      }
    }

    // Fetch roadmap milestones if requested
    if (includeRoadmap) {
      console.log('🗺️ Fetching roadmap milestones...');
      const { data: roadmap, error: roadmapError } = await supabase
        .from('agent_roadmap_milestones')
        .select('*')
        .eq('agent_id', agent.id)
        .order('order_index', { ascending: true });

      if (roadmapError) {
        console.warn('⚠️ Error fetching roadmap milestones:', roadmapError);
      } else {
        result.roadmap = roadmap || [];
        console.log('✅ Roadmap milestones fetched:', roadmap?.length || 0);
      }
    }

    console.log('🎉 Successfully retrieved complete agent details');

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
