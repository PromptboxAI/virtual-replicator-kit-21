import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

const SITE_URL = 'https://promptbox.com';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating sitemap from site_metadata...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all indexable pages from site_metadata
    const { data: pages, error: pagesError } = await supabase
      .from('site_metadata')
      .select('page_path, sitemap_priority, sitemap_changefreq, is_indexable, is_dynamic, updated_at')
      .eq('is_indexable', true)
      .eq('is_global', false)
      .order('sitemap_priority', { ascending: false });

    if (pagesError) {
      console.error('Error fetching site_metadata:', pagesError);
    }

    // Get all active agents for dynamic pages
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, updated_at, name')
      .eq('is_active', true)
      .eq('test_mode', false)
      .order('updated_at', { ascending: false });

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
    }

    const today = new Date().toISOString().split('T')[0];

    // Build XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages from site_metadata
    if (pages && pages.length > 0) {
      for (const page of pages) {
        // Skip dynamic routes (they'll be handled separately)
        if (page.is_dynamic) continue;
        
        const lastmod = page.updated_at 
          ? new Date(page.updated_at).toISOString().split('T')[0] 
          : today;
        const priority = page.sitemap_priority?.toFixed(1) || '0.5';
        const changefreq = page.sitemap_changefreq || 'weekly';
        
        xml += `  <url>
    <loc>${SITE_URL}${page.page_path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
      }
    }

    // Add dynamic agent pages
    if (agents && agents.length > 0) {
      // Find the dynamic route settings for agent pages
      const agentRouteSettings = pages?.find(p => p.page_path === '/agent/:agentId');
      const platformRouteSettings = pages?.find(p => p.page_path === '/platform/ai-agents/:agentId');
      
      for (const agent of agents) {
        const lastmod = agent.updated_at 
          ? new Date(agent.updated_at).toISOString().split('T')[0] 
          : today;
        
        // Main agent page
        xml += `  <url>
    <loc>${SITE_URL}/agent/${agent.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${agentRouteSettings?.sitemap_changefreq || 'hourly'}</changefreq>
    <priority>${agentRouteSettings?.sitemap_priority?.toFixed(1) || '0.8'}</priority>
  </url>
`;
        
        // Platform agent detail page
        xml += `  <url>
    <loc>${SITE_URL}/platform/ai-agents/${agent.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${platformRouteSettings?.sitemap_changefreq || 'hourly'}</changefreq>
    <priority>${platformRouteSettings?.sitemap_priority?.toFixed(1) || '0.7'}</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    const staticCount = pages?.filter(p => !p.is_dynamic).length || 0;
    const dynamicCount = (agents?.length || 0) * 2;
    console.log(`Sitemap generated with ${staticCount} static pages and ${dynamicCount} dynamic agent pages`);

    return new Response(xml, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: corsHeaders, status: 500 }
    );
  }
});