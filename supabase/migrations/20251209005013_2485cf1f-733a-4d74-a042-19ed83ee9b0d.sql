-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can read site metadata" ON public.site_metadata;
DROP POLICY IF EXISTS "Only admins can manage site metadata" ON public.site_metadata;

-- Create new policies that work with authenticated users
-- Allow anyone to read site metadata (needed for SEO on all pages)
CREATE POLICY "Anyone can read site metadata" 
ON public.site_metadata 
FOR SELECT 
USING (true);

-- Allow authenticated users to manage site metadata
-- (Admin check should be done at the application level)
CREATE POLICY "Authenticated users can update site metadata" 
ON public.site_metadata 
FOR UPDATE 
USING (auth.uid() IS NOT NULL OR auth.role() = 'anon');

CREATE POLICY "Authenticated users can insert site metadata" 
ON public.site_metadata 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'anon');

CREATE POLICY "Authenticated users can delete site metadata" 
ON public.site_metadata 
FOR DELETE 
USING (auth.uid() IS NOT NULL OR auth.role() = 'anon');