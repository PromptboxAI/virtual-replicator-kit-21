import { Helmet } from 'react-helmet-async';
import { useCurrentPageMetadata } from '@/hooks/useSiteMetadata';

interface DynamicSEOProps {
  // Optional overrides for dynamic pages
  title?: string;
  description?: string;
  image?: string;
  // Template variables for dynamic routes
  templateVars?: Record<string, string>;
  // JSON-LD structured data
  structuredData?: object;
}

export function DynamicSEO({ title, description, image, templateVars, structuredData }: DynamicSEOProps) {
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
  const siteUrl = 'https://promptbox.ai';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : siteUrl;
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  // Build default WebPage structured data
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": finalTitle,
    "description": finalDescription,
    "url": currentUrl,
    ...(finalImage && { 
      "image": finalImage.startsWith('http') ? finalImage : `${siteUrl}${finalImage}` 
    }),
    "isPartOf": {
      "@type": "WebSite",
      "name": "PromptBox",
      "url": siteUrl
    }
  };
  
  // Merge with custom structured data if provided
  const finalStructuredData = structuredData || defaultStructuredData;
  
  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription || ''} />
      {metadata.keywords && <meta name="keywords" content={metadata.keywords} />}
      
      {/* Robots */}
      {!metadata.isIndexable ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Favicon */}
      {metadata.favicon && <link rel="icon" href={metadata.favicon} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription || ''} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PromptBox" />
      {finalImage && <meta property="og:image" content={finalImage.startsWith('http') ? finalImage : `${siteUrl}${finalImage}`} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription || ''} />
      <meta name="twitter:site" content="@promptbox" />
      {finalImage && <meta name="twitter:image" content={finalImage.startsWith('http') ? finalImage : `${siteUrl}${finalImage}`} />}
      
      {/* Canonical */}
      <link rel="canonical" href={`${siteUrl}${currentPath}`} />
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
}

// Helper component for agent pages with rich structured data
interface AgentSEOProps {
  agent: {
    id: string;
    name: string;
    symbol: string;
    description?: string;
    avatar_url?: string;
    current_price?: number;
    market_cap?: number;
    creator_wallet_address?: string;
  };
}

export function AgentSEO({ agent }: AgentSEOProps) {
  const siteUrl = 'https://promptbox.ai';
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${agent.name} (${agent.symbol})`,
    "description": agent.description || `Trade ${agent.name} AI agent tokens on PromptBox`,
    "url": `${siteUrl}/agent/${agent.id}`,
    ...(agent.avatar_url && { "image": agent.avatar_url }),
    "brand": {
      "@type": "Brand",
      "name": "PromptBox"
    },
    "category": "AI Agent Token",
    ...(agent.current_price && {
      "offers": {
        "@type": "Offer",
        "price": agent.current_price,
        "priceCurrency": "PROMPT",
        "availability": "https://schema.org/InStock"
      }
    })
  };
  
  return (
    <DynamicSEO
      title={`${agent.name} ($${agent.symbol}) - Trade AI Agent | PromptBox`}
      description={agent.description || `Trade ${agent.name} ($${agent.symbol}) AI agent tokens. View price, market cap, and trading charts on PromptBox.`}
      image={agent.avatar_url}
      structuredData={structuredData}
    />
  );
}
