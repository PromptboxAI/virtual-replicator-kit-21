import React from 'react';

// Integration logos organized by row
// Using a mix of Simple Icons CDN and SVG Repo for availability
const row1Integrations = [
  { name: 'Salesforce', logo: 'https://www.svgrepo.com/show/303195/salesforce-2-logo.svg' },
  { name: 'HubSpot', logo: 'https://cdn.simpleicons.org/hubspot' },
  { name: 'Zendesk', logo: 'https://cdn.simpleicons.org/zendesk' },
  { name: 'LinkedIn', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg' },
  { name: 'Intercom', logo: 'https://cdn.simpleicons.org/intercom' },
  { name: 'Slack', logo: 'https://cdn.simpleicons.org/slack' },
  { name: 'Microsoft Teams', logo: 'https://img.icons8.com/fluency/96/microsoft-teams-2019.png' },
  { name: 'Gmail', logo: 'https://cdn.simpleicons.org/gmail' },
  { name: 'Outlook', logo: 'https://img.icons8.com/fluency/96/microsoft-outlook-2019.png' },
  { name: 'Twilio', logo: 'https://www.svgrepo.com/show/354472/twilio-icon.svg' },
];

const row2Integrations = [
  { name: 'Snowflake', logo: 'https://cdn.simpleicons.org/snowflake' },
  { name: 'BigQuery', logo: 'https://cdn.simpleicons.org/googlebigquery' },
  { name: 'Amazon Redshift', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Amazon-Redshift-Logo.svg' },
  { name: 'PostgreSQL', logo: 'https://cdn.simpleicons.org/postgresql' },
  { name: 'MySQL', logo: 'https://cdn.simpleicons.org/mysql' },
  { name: 'Google Drive', logo: 'https://cdn.simpleicons.org/googledrive' },
  { name: 'Notion', logo: 'https://cdn.simpleicons.org/notion' },
  { name: 'Confluence', logo: 'https://cdn.simpleicons.org/confluence' },
  { name: 'Dropbox', logo: 'https://cdn.simpleicons.org/dropbox' },
  { name: 'OneDrive', logo: 'https://logo.svgcdn.com/l/microsoft-onedrive.svg' },
];

const row3Integrations = [
  { name: 'GitHub', logo: 'https://cdn.simpleicons.org/github' },
  { name: 'GitLab', logo: 'https://cdn.simpleicons.org/gitlab' },
  { name: 'Jira', logo: 'https://cdn.simpleicons.org/jira' },
  { name: 'Linear', logo: 'https://cdn.simpleicons.org/linear' },
  { name: 'Stripe', logo: 'https://cdn.simpleicons.org/stripe' },
  { name: 'Shopify', logo: 'https://cdn.simpleicons.org/shopify' },
  { name: 'Supabase', logo: 'https://cdn.simpleicons.org/supabase' },
  { name: 'Base', logo: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4' },
  { name: 'Uniswap', logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg' },
  { name: 'Google Cloud', logo: 'https://cdn.simpleicons.org/googlecloud' },
];

interface IntegrationRowProps {
  integrations: { name: string; logo: string }[];
  direction?: 'left' | 'right';
  speed?: 'slow' | 'medium' | 'fast';
}

function IntegrationRow({ integrations, direction = 'left', speed = 'medium' }: IntegrationRowProps) {
  const directionStyle = direction === 'right' ? { animationDirection: 'reverse' as const } : {};

  const getAnimationClass = () => {
    if (speed === 'slow') return 'animate-marquee-slow';
    if (speed === 'fast') return 'animate-marquee-fast';
    return 'animate-marquee';
  };

  return (
    <div className="flex overflow-hidden py-3">
      <div 
        className={`flex gap-12 pr-12 ${getAnimationClass()}`} 
        style={directionStyle}
      >
        {integrations.map((integration, index) => (
          <div
            key={`${integration.name}-1-${index}`}
            className="flex items-center justify-center min-w-[48px]"
            title={integration.name}
          >
            <img 
              src={integration.logo} 
              alt={integration.name}
              className="h-8 w-8 object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      {/* Duplicate for seamless loop */}
      <div 
        className={`flex gap-12 pr-12 ${getAnimationClass()}`} 
        style={directionStyle} 
        aria-hidden="true"
      >
        {integrations.map((integration, index) => (
          <div
            key={`${integration.name}-2-${index}`}
            className="flex items-center justify-center min-w-[48px]"
            title={integration.name}
          >
            <img 
              src={integration.logo} 
              alt={integration.name}
              className="h-8 w-8 object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function IntegrationsSection() {
  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-mono text-muted-foreground mb-3 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
            INTEGRATIONS
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-foreground mb-4 tracking-tight">
            Bring Life to Your Agents
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            With 100+ integrations, Promptbox agents can fully interact with your existing systems and workflows.
          </p>
        </div>

        {/* Rotating Logo Rows */}
        <div className="space-y-2 mb-10">
          <IntegrationRow integrations={row1Integrations} direction="left" speed="slow" />
          <IntegrationRow integrations={row2Integrations} direction="right" speed="medium" />
          <IntegrationRow integrations={row3Integrations} direction="left" speed="slow" />
        </div>

        {/* SEO/AEO Line */}
        <div className="text-center">
          <p className="text-sm md:text-base text-foreground/70 max-w-4xl mx-auto leading-relaxed">
            Any app with an API - from Salesforce and Zendesk to Slack, Stripe, and on-chain DEXs - can be wired into a Promptbox agent via in-platform tools, GPT Actions, or MCP.
          </p>
        </div>
      </div>
    </section>
  );
}
