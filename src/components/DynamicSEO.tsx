import { Helmet } from 'react-helmet-async';
import { useCurrentPageMetadata } from '@/hooks/useSiteMetadata';

const SITE_URL = 'https://promptbox.com';
const TWITTER_HANDLE = '@promptaboratory';

interface DynamicSEOProps {
  // Optional overrides for dynamic pages
  title?: string;
  description?: string;
  image?: string;
  // Template variables for dynamic routes
  templateVars?: Record<string, string>;
  // JSON-LD structured data
  structuredData?: object;
  // Additional overrides
  canonicalUrl?: string;
  author?: string;
  publishDate?: string;
  modifiedDate?: string;
}

export function DynamicSEO({ 
  title, 
  description, 
  image, 
  templateVars, 
  structuredData,
  canonicalUrl,
  author,
  publishDate,
  modifiedDate
}: DynamicSEOProps) {
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
  const currentUrl = typeof window !== 'undefined' ? window.location.href : SITE_URL;
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  // Get advanced SEO settings from metadata
  const pageMetadata = metadata.pageMetadata;
  const finalCanonical = canonicalUrl || pageMetadata?.canonical_url || `${SITE_URL}${currentPath}`;
  const ogType = pageMetadata?.og_type || 'website';
  const twitterCardType = pageMetadata?.twitter_card_type || 'summary_large_image';
  const structuredDataType = pageMetadata?.structured_data_type || 'WebPage';
  const robotsDirectives = pageMetadata?.robots_directives;
  const finalAuthor = author || pageMetadata?.author;
  const finalPublishDate = publishDate || pageMetadata?.publish_date;
  const finalModifiedDate = modifiedDate || pageMetadata?.modified_date;
  
  // Build robots content
  let robotsContent = metadata.isIndexable ? 'index, follow' : 'noindex, nofollow';
  if (robotsDirectives) {
    robotsContent += `, ${robotsDirectives}`;
  }
  
  // Build default structured data based on type
  const buildStructuredData = () => {
    const baseData: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": structuredDataType,
      "name": finalTitle,
      "description": finalDescription,
      "url": currentUrl,
    };
    
    if (finalImage) {
      baseData.image = finalImage.startsWith('http') ? finalImage : `${SITE_URL}${finalImage}`;
    }
    
    // Add type-specific properties
    switch (structuredDataType) {
      case 'Article':
        if (finalAuthor) {
          baseData.author = { "@type": "Person", "name": finalAuthor };
        }
        if (finalPublishDate) {
          baseData.datePublished = finalPublishDate;
        }
        if (finalModifiedDate) {
          baseData.dateModified = finalModifiedDate;
        }
        baseData.publisher = {
          "@type": "Organization",
          "name": "PromptBox",
          "url": SITE_URL
        };
        break;
        
      case 'Organization':
        baseData.logo = `${SITE_URL}/favicon.ico`;
        baseData.sameAs = [
          "https://twitter.com/promptaboratory"
        ];
        break;
        
      case 'Product':
        baseData.brand = { "@type": "Brand", "name": "PromptBox" };
        break;
        
      case 'FAQPage':
        baseData.mainEntity = [];
        break;
        
      default:
        baseData.isPartOf = {
          "@type": "WebSite",
          "name": "PromptBox",
          "url": SITE_URL
        };
    }
    
    return baseData;
  };
  
  const finalStructuredData = structuredData || buildStructuredData();
  
  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription || ''} />
      {metadata.keywords && <meta name="keywords" content={metadata.keywords} />}
      
      {/* Robots */}
      <meta name="robots" content={robotsContent} />
      
      {/* Author */}
      {finalAuthor && <meta name="author" content={finalAuthor} />}
      
      {/* Favicon */}
      {metadata.favicon && <link rel="icon" href={metadata.favicon} />}
      
      {/* Canonical */}
      <link rel="canonical" href={finalCanonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription || ''} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="PromptBox" />
      {finalImage && <meta property="og:image" content={finalImage.startsWith('http') ? finalImage : `${SITE_URL}${finalImage}`} />}
      
      {/* Article specific OG tags */}
      {ogType === 'article' && finalPublishDate && (
        <meta property="article:published_time" content={finalPublishDate} />
      )}
      {ogType === 'article' && finalModifiedDate && (
        <meta property="article:modified_time" content={finalModifiedDate} />
      )}
      {ogType === 'article' && finalAuthor && (
        <meta property="article:author" content={finalAuthor} />
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCardType} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription || ''} />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      {finalImage && <meta name="twitter:image" content={finalImage.startsWith('http') ? finalImage : `${SITE_URL}${finalImage}`} />}
      
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${agent.name} (${agent.symbol})`,
    "description": agent.description || `Trade ${agent.name} AI agent tokens on PromptBox`,
    "url": `${SITE_URL}/agent/${agent.id}`,
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