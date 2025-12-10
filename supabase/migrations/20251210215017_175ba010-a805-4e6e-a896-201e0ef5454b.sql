-- Add advanced SEO columns to site_metadata
ALTER TABLE site_metadata
ADD COLUMN IF NOT EXISTS canonical_url text,
ADD COLUMN IF NOT EXISTS structured_data_type text DEFAULT 'WebPage',
ADD COLUMN IF NOT EXISTS robots_directives text,
ADD COLUMN IF NOT EXISTS sitemap_priority numeric DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS sitemap_changefreq text DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS og_type text DEFAULT 'website',
ADD COLUMN IF NOT EXISTS twitter_card_type text DEFAULT 'summary_large_image',
ADD COLUMN IF NOT EXISTS focus_keyword text,
ADD COLUMN IF NOT EXISTS author text,
ADD COLUMN IF NOT EXISTS publish_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS modified_date timestamp with time zone;

-- Add constraints for valid values
ALTER TABLE site_metadata 
ADD CONSTRAINT valid_sitemap_priority CHECK (sitemap_priority >= 0 AND sitemap_priority <= 1),
ADD CONSTRAINT valid_changefreq CHECK (sitemap_changefreq IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
ADD CONSTRAINT valid_og_type CHECK (og_type IN ('website', 'article', 'product', 'profile', 'video.movie', 'video.episode', 'music.song', 'book')),
ADD CONSTRAINT valid_twitter_card CHECK (twitter_card_type IN ('summary', 'summary_large_image', 'app', 'player')),
ADD CONSTRAINT valid_structured_data CHECK (structured_data_type IN ('WebPage', 'Article', 'Product', 'Organization', 'Person', 'FAQPage', 'HowTo', 'LocalBusiness', 'Event', 'Recipe', 'VideoObject', 'BreadcrumbList'));