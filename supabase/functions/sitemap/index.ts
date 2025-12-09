import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

const SITE_URL = 'https://promptbox.com';

// Static pages that should be indexed
const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/ai-agents', priority: '0.9', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/learn', priority: '0.8', changefreq: 'weekly' },
  { path: '/market', priority: '0.9', changefreq: 'hourly' },
  { path: '/agents', priority: '0.9', changefreq: 'hourly' },
  { path: '/platform/ai-agents', priority: '0.9', changefreq: 'daily' },
  { path: '/create', priority: '0.7', changefreq: 'monthly' },
  { path: '/faucet', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/promptbox-dpa', priority: '0.3', changefreq: 'yearly' },
  { path: '/careers', priority: '0.6', changefreq: 'monthly' },
  { path: '/status', priority: '0.4', changefreq: 'daily' },
  { path: '/api-reference', priority: '0.6', changefreq: 'weekly' },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating sitemap...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active agents for dynamic pages
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, updated_at, name')
      .eq('is_active', true)
      .eq('test_mode', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
    }

    const today = new Date().toISOString().split('T')[0];

    // Build XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add dynamic agent pages
    if (agents && agents.length > 0) {
      for (const agent of agents) {
        const lastmod = agent.updated_at 
          ? new Date(agent.updated_at).toISOString().split('T')[0] 
          : today;
        
        // Main agent page
        xml += `  <url>
    <loc>${SITE_URL}/agent/${agent.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        
        // Platform agent detail page
        xml += `  <url>
    <loc>${SITE_URL}/platform/ai-agents/${agent.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    console.log(`Sitemap generated with ${staticPages.length} static pages and ${agents?.length || 0} agent pages`);

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
