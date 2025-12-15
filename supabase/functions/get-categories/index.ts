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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all unique categories from active agents
    const { data: agents, error } = await supabase
      .from('agents')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    // Extract unique categories and count agents per category
    const categoryCount: Record<string, number> = {};
    
    (agents || []).forEach(agent => {
      if (agent.category) {
        categoryCount[agent.category] = (categoryCount[agent.category] || 0) + 1;
      }
    });

    // Sort categories by count (most popular first)
    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Also provide a simple array of category names
    const categoryNames = sortedCategories.map(c => c.name);

    console.log(`Found ${sortedCategories.length} unique categories`);

    return new Response(
      JSON.stringify({
        success: true,
        categories: sortedCategories,
        category_names: categoryNames,
        total_categories: sortedCategories.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-categories:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
