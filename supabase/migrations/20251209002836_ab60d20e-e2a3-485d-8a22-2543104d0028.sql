-- Create site_metadata table for SEO management
CREATE TABLE public.site_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  og_image_url TEXT,
  keywords TEXT,
  is_indexable BOOLEAN DEFAULT true,
  is_dynamic BOOLEAN DEFAULT false,
  title_template TEXT,
  description_template TEXT,
  is_global BOOLEAN DEFAULT false,
  favicon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_metadata ENABLE ROW LEVEL SECURITY;

-- Everyone can read site metadata (needed for SEO)
CREATE POLICY "Site metadata is viewable by everyone"
ON public.site_metadata FOR SELECT
USING (true);

-- Only admins can manage site metadata
CREATE POLICY "Only admins can manage site metadata"
ON public.site_metadata FOR ALL
USING (has_role((auth.uid())::text, 'admin'::app_role))
WITH CHECK (has_role((auth.uid())::text, 'admin'::app_role));

-- Create storage bucket for SEO assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('seo-assets', 'seo-assets', true);

-- Allow public read access to SEO assets
CREATE POLICY "SEO assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'seo-assets');

-- Allow authenticated users to upload SEO assets
CREATE POLICY "Authenticated users can upload SEO assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'seo-assets' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update SEO assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'seo-assets' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete SEO assets
CREATE POLICY "Authenticated users can delete SEO assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'seo-assets' AND auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_site_metadata_updated_at
BEFORE UPDATE ON public.site_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Pre-populate with all pages
INSERT INTO public.site_metadata (page_path, page_name, is_indexable, is_dynamic, is_global) VALUES
-- Global settings (special row)
('_global', 'Global Settings', true, false, true),

-- Indexable public pages
('/', 'Homepage', true, false, false),
('/ai-agents', 'AI Agents', true, false, false),
('/about', 'About', true, false, false),
('/learn', 'Learn', true, false, false),
('/market', 'Market', true, false, false),
('/agents', 'All Agents', true, false, false),
('/platform/ai-agents', 'AI Agents Hub', true, false, false),
('/privacy', 'Privacy Policy', true, false, false),
('/terms', 'Terms of Service', true, false, false),
('/promptbox-dpa', 'Promptbox DPA', true, false, false),
('/careers', 'Careers', true, false, false),
('/status', 'Status', true, false, false),
('/api-reference', 'API Reference', true, false, false),
('/auth', 'Authentication', true, false, false),
('/create', 'Create Agent', true, false, false),
('/my-agents', 'My Agents', true, false, false),
('/faucet', 'Faucet', true, false, false),

-- Dynamic routes
('/agent/:agentId', 'Agent Detail', true, true, false),
('/platform/ai-agents/:agentId', 'AI Agent Detail', true, true, false),
('/dashboard/:agentId', 'Agent Dashboard', true, true, false),

-- Non-indexable pages (test/admin)
('/admin', 'Admin', false, false, false),
('/admin-settings', 'Admin Settings', false, false, false),
('/admin/seo', 'SEO Manager', false, false, false),
('/test-lab', 'Test Lab', false, false, false),
('/test-sepolia-token', 'Test Token', false, false, false),
('/graduation-test', 'Graduation Test', false, false, false),
('/price-audit', 'Price Audit', false, false, false),
('/fee-test/:agentId', 'Fee Test', false, true, false),
('/contract-test', 'Contract Test', false, false, false),
('/healthz', 'Health Check', false, false, false),
('/token-agents', 'Token Agents', false, false, false);