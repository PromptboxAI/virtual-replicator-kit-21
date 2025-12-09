-- Create the seo-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('seo-assets', 'seo-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to read from seo-assets bucket
CREATE POLICY "Anyone can view seo-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'seo-assets');

-- Allow authenticated users to upload to seo-assets bucket
CREATE POLICY "Authenticated users can upload seo-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'seo-assets');

-- Allow authenticated users to update seo-assets
CREATE POLICY "Authenticated users can update seo-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'seo-assets');

-- Allow authenticated users to delete from seo-assets
CREATE POLICY "Authenticated users can delete seo-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'seo-assets');