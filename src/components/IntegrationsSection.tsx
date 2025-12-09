import React from 'react';

// Integration logos organized by row
const row1Integrations = [
  { name: 'Salesforce', icon: '☁️' },
  { name: 'HubSpot', icon: '🧡' },
  { name: 'Zendesk', icon: '💬' },
  { name: 'ServiceNow', icon: '⚙️' },
  { name: 'Slack', icon: '💬' },
  { name: 'Microsoft Teams', icon: '💼' },
];

const row2Integrations = [
  { name: 'Snowflake', icon: '❄️' },
  { name: 'BigQuery', icon: '📊' },
  { name: 'Postgres', icon: '🐘' },
  { name: 'Google Drive', icon: '📁' },
  { name: 'Notion', icon: '📝' },
  { name: 'Confluence', icon: '📚' },
];

const row3Integrations = [
  { name: 'GitHub', icon: '🐙' },
  { name: 'Jira', icon: '📋' },
  { name: 'Stripe', icon: '💳' },
  { name: 'Shopify', icon: '🛒' },
  { name: 'Supabase', icon: '⚡' },
  { name: 'Base', icon: '🔵' },
  { name: 'Uniswap', icon: '🦄' },
];

interface IntegrationRowProps {
  integrations: { name: string; icon: string }[];
  direction?: 'left' | 'right';
  speed?: 'slow' | 'medium' | 'fast';
}

function IntegrationRow({ integrations, direction = 'left', speed = 'medium' }: IntegrationRowProps) {
  const speedClass = {
    slow: 'animate-marquee-slow',
    medium: 'animate-marquee',
    fast: 'animate-marquee-fast',
  }[speed];
  
  const directionStyle = direction === 'right' ? { animationDirection: 'reverse' } : {};

  return (
    <div className="flex overflow-hidden py-2">
      <div className={`flex ${speedClass} gap-4 pr-4`} style={directionStyle}>
        {integrations.map((integration, index) => (
          <div
            key={`${integration.name}-1-${index}`}
            className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50 whitespace-nowrap min-w-max"
          >
            <span className="text-lg">{integration.icon}</span>
            <span className="text-sm font-medium text-foreground">{integration.name}</span>
          </div>
        ))}
      </div>
      {/* Duplicate for seamless loop */}
      <div className={`flex ${speedClass} gap-4 pr-4`} style={directionStyle} aria-hidden="true">
        {integrations.map((integration, index) => (
          <div
            key={`${integration.name}-2-${index}`}
            className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50 whitespace-nowrap min-w-max"
          >
            <span className="text-lg">{integration.icon}</span>
            <span className="text-sm font-medium text-foreground">{integration.name}</span>
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
        <div className="space-y-3 mb-10">
          <IntegrationRow integrations={row1Integrations} direction="left" speed="slow" />
          <IntegrationRow integrations={row2Integrations} direction="right" speed="medium" />
          <IntegrationRow integrations={row3Integrations} direction="left" speed="slow" />
        </div>

        {/* SEO/AEO Line */}
        <div className="text-center">
          <p className="text-sm md:text-base text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Any app with an API - from Salesforce and Zendesk to Slack, Stripe, and on-chain DEXs - can be wired into a Promptbox agent via in-platform tools, GPT Actions, or MCP.
          </p>
        </div>
      </div>
    </section>
  );
}
