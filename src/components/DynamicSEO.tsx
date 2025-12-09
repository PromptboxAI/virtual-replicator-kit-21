import { Helmet } from 'react-helmet-async';
import { useCurrentPageMetadata } from '@/hooks/useSiteMetadata';

interface DynamicSEOProps {
  // Optional overrides for dynamic pages
  title?: string;
  description?: string;
  image?: string;
  // Template variables for dynamic routes
  templateVars?: Record<string, string>;
}

export function DynamicSEO({ title, description, image, templateVars }: DynamicSEOProps) {
  const metadata = useCurrentPageMetadata();
  
  // Apply template variables if provided
  const applyTemplate = (template: string | null, vars?: Record<string, string>) => {
    if (!template || !vars) return template;
    let result = template;
    Object.entries(vars).forEach(([key, value]) => {
      result = result?.replace(new RegExp(`\\{${key}\\}`, 'g'), value) || result;
    });
    return result;
  };
  
  const finalTitle = title || applyTemplate(metadata.pageMetadata?.title_template, templateVars) || metadata.title;
  const finalDescription = description || applyTemplate(metadata.pageMetadata?.description_template, templateVars) || metadata.description;
  const finalImage = image || metadata.ogImage;
  const siteUrl = window.location.origin;
  const currentUrl = window.location.href;
  
  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {metadata.keywords && <meta name="keywords" content={metadata.keywords} />}
      
      {/* Robots */}
      {!metadata.isIndexable && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Favicon */}
      {metadata.favicon && <link rel="icon" href={metadata.favicon} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      {finalImage && <meta property="og:image" content={finalImage.startsWith('http') ? finalImage : `${siteUrl}${finalImage}`} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      {finalImage && <meta name="twitter:image" content={finalImage.startsWith('http') ? finalImage : `${siteUrl}${finalImage}`} />}
      
      {/* Canonical */}
      <link rel="canonical" href={currentUrl} />
    </Helmet>
  );
}
