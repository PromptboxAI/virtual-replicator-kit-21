import React, { useState } from 'react';
import { Coins, Bot, Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  title: string;
  shortBody: string;
  bullets: string[];
  icon: React.ElementType;
}

const features: Feature[] = [
  {
    id: 'token-generation',
    title: 'Token Generation',
    shortBody: 'Launch a token for your agent on Base in a few clicks. Give it a name, symbol, and description, hit launch, and Promptbox automatically handles supply, pricing curve, fee routing, and wallets behind the scenes.',
    bullets: [
      'One-click token launch on Base',
      'Transparent pricing curves, no mystery math',
      'Built-in routing for creator, protocol, and community fees'
    ],
    icon: Coins
  },
  {
    id: 'ai-agent-builder',
    title: 'AI Agent Builder',
    shortBody: 'Design how your agent thinks and acts with a visual builder. Start from templates, connect models like OpenAI or Claude, and wire in workflows that actually do the work.',
    bullets: [
      'Role-based templates for trading, growth, support, and more',
      'Attach models, tools, and data sources without code',
      'Visual workflows to define triggers, decisions, and actions'
    ],
    icon: Bot
  },
  {
    id: 'community-revenue',
    title: 'Community & Revenue',
    shortBody: 'Turn tokens and usage into a real micro-SaaS: dashboards for price and performance, gated access for holders, and on-chain revenue sharing that rewards your community.',
    bullets: [
      'Live dashboards for price, holders, volume, and usage',
      'Holder-gated access to premiums, signals, or tools',
      'Programmed revenue splits between creator, protocol, and token holders'
    ],
    icon: Users
  }
];

// Placeholder illustrations for each feature
const featureImages: Record<string, React.ReactNode> = {
  'token-generation': (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200/50 p-6 flex flex-col gap-4">
      <div className="bg-white rounded-lg border border-blue-100 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">Launch Token</div>
            <div className="text-xs text-slate-500">Configure your token</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Token Name</div>
            <div className="h-8 bg-slate-50 rounded border border-slate-200 flex items-center px-3 text-sm text-slate-900">MyAgent</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Symbol</div>
            <div className="h-8 bg-slate-50 rounded border border-slate-200 flex items-center px-3 text-sm text-slate-900">$AGENT</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-blue-100 p-4 shadow-sm">
        <div className="text-xs text-slate-500 mb-2">Bonding Curve Preview</div>
        <div className="h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded flex items-end px-2 pb-2">
          <div className="w-full h-16 border-l-2 border-b-2 border-blue-300 relative">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path d="M0,60 Q30,55 50,40 T100,10" stroke="url(#curveGradient)" strokeWidth="3" fill="none" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  ),
  'ai-agent-builder': (
    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-xl border border-indigo-200/50 p-6 flex flex-col gap-4">
      <div className="bg-white rounded-lg border border-indigo-100 p-4 shadow-sm flex-1">
        <div className="text-xs text-slate-500 mb-3">Workflow Canvas</div>
        <div 
          className="flex items-center justify-center gap-3 h-32 rounded-lg"
          style={{
            backgroundColor: '#f8fafc',
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        >
          <div className="w-20 h-16 rounded-lg border-2 border-indigo-500 bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700 shadow-sm">Trigger</div>
          <div className="w-8 h-0.5 bg-indigo-400" />
          <div className="w-20 h-16 rounded-lg border-2 border-cyan-400 bg-cyan-50 flex items-center justify-center text-xs font-medium text-cyan-700 shadow-sm">Process</div>
          <div className="w-8 h-0.5 bg-cyan-400" />
          <div className="w-20 h-16 rounded-lg border-2 border-purple-400 bg-purple-50 flex items-center justify-center text-xs font-medium text-purple-700 shadow-sm">Action</div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-indigo-100 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">Agent Settings</div>
            <div className="text-xs text-slate-500">OpenAI GPT-4 connected</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  ),
  'community-revenue': (
    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50 p-6 flex flex-col gap-4">
      <div className="bg-white rounded-lg border border-emerald-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-500">Dashboard</div>
          <div className="text-xs text-emerald-600 font-medium">+12.4%</div>
        </div>
        <div className="h-20 bg-gradient-to-r from-emerald-100 to-teal-50 rounded flex items-end gap-1 p-2">
          {[40, 55, 45, 70, 60, 80, 75, 90].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-emerald-100 p-3 shadow-sm">
          <div className="text-xs text-slate-500">Holders</div>
          <div className="text-lg font-semibold text-slate-900">1,247</div>
        </div>
        <div className="bg-white rounded-lg border border-emerald-100 p-3 shadow-sm">
          <div className="text-xs text-slate-500">Volume 24h</div>
          <div className="text-lg font-semibold text-slate-900">$42.5K</div>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-emerald-100 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-xs text-slate-700">Rewards distributed: <span className="text-emerald-600 font-medium">0.5 ETH</span></div>
        </div>
      </div>
    </div>
  )
};

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const active = features.find(f => f.id === activeFeature) || features[0];

  return (
    <section className="pt-16 pb-24 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-mono text-muted-foreground mb-3 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
            FEATURES
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-medium text-foreground mb-4 tracking-tight">
            The Promptbox Protocol
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover how tokenized AI agents turn your idea into a micro-SaaS business - from launch and demand to revenue and community.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Feature List */}
          <div className="space-y-2 min-h-[520px] lg:min-h-0">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeFeature === feature.id;
              
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={cn(
                    "w-full text-left p-5 rounded-xl border transition-all duration-300",
                    isActive
                      ? "bg-background border-primary/30 shadow-lg"
                      : "bg-transparent border-border/50 hover:border-border hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors flex-shrink-0",
                      isActive ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {isActive && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "text-lg font-semibold mb-2 transition-colors",
                        isActive ? "text-foreground" : "text-foreground/70"
                      )}>
                        {feature.title}
                      </h3>
                      
                      {isActive && (
                        <div className="animate-fade-in">
                          <p className="text-foreground/80 text-sm leading-relaxed mb-4">
                            {feature.shortBody}
                          </p>
                          <ul className="space-y-2">
                            {feature.bullets.map((bullet, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-foreground/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column - Feature Image */}
          <div className="lg:sticky lg:top-24 h-fit mb-8 lg:mb-0">
            <div 
              key={active.id}
              className="aspect-[4/3] animate-scale-in"
            >
              {featureImages[active.id]}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
