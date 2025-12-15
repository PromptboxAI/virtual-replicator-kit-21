import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  try {
    // GET - Fetch comments for an agent
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const agentId = url.searchParams.get('agentId');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      if (!agentId) {
        return new Response(
          JSON.stringify({ error: 'agentId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Fetch comments (using agent_interactions with message_type='comment')
      const { data: comments, error: commentsError, count } = await supabase
        .from('agent_interactions')
        .select('id, user_id, content, created_at, metadata', { count: 'exact' })
        .eq('agent_id', agentId)
        .eq('message_type', 'comment')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        throw commentsError;
      }

      // Get unique user IDs to fetch profile info
      const userIds = [...new Set((comments || []).map(c => c.user_id))];
      
      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      // Enrich comments with profile data
      const enrichedComments = (comments || []).map(comment => {
        const profile = profileMap.get(comment.user_id);
        return {
          id: comment.id,
          user_id: comment.user_id,
          user_display_name: profile?.display_name || null,
          user_avatar_url: profile?.avatar_url || null,
          content: comment.content,
          metadata: comment.metadata,
          created_at: comment.created_at,
        };
      });

      console.log(`Fetched ${enrichedComments.length} comments for agent ${agentId}`);

      return new Response(
        JSON.stringify({
          success: true,
          agent_id: agentId,
          comments: enrichedComments,
          total_count: count || 0,
          has_more: (count || 0) > offset + limit,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create a new comment
    if (req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { agentId, content } = body;

      if (!agentId || !content) {
        return new Response(
          JSON.stringify({ error: 'agentId and content are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate content length
      if (content.length > 1000) {
        return new Response(
          JSON.stringify({ error: 'Comment must be less than 1000 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify agent exists
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: agent, error: agentError } = await supabaseAdmin
        .from('agents')
        .select('id')
        .eq('id', agentId)
        .single();

      if (agentError || !agent) {
        return new Response(
          JSON.stringify({ error: 'Agent not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert the comment
      const { data: newComment, error: insertError } = await supabase
        .from('agent_interactions')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          content: content.trim(),
          message_type: 'comment',
          metadata: { source: 'trading_app' },
        })
        .select('id, content, created_at')
        .single();

      if (insertError) {
        console.error('Error inserting comment:', insertError);
        throw insertError;
      }

      // Fetch user profile for response
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      console.log(`User ${user.id} posted comment on agent ${agentId}`);

      return new Response(
        JSON.stringify({
          success: true,
          comment: {
            id: newComment.id,
            user_id: user.id,
            user_display_name: profile?.display_name || null,
            user_avatar_url: profile?.avatar_url || null,
            content: newComment.content,
            created_at: newComment.created_at,
          },
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in agent-comments:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
