import React, { useState } from 'react';
import { Coins, Bot, Workflow, Plug, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import featureTokenImg from '@/assets/feature-token.png';

interface Feature {
  id: string;
  label: string;
  icon: React.ElementType;
  image: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    id: 'token',
    label: 'Token',
    icon: Coins,
    image: featureTokenImg,
    title: 'Launch Token',
    description: 'Launch an on-chain token for your agent on Base in a few clicks - supply, curve, and fees handled for you.'
  },
  {
    id: 'agent',
    label: 'Agent',
    icon: Bot,
    image: '/placeholder.svg',
    title: 'Agent',
    description: 'Deploy AI agents that can trade, analyze, and execute strategies.'
  },
  {
    id: 'workflow',
    label: 'Workflow',
    icon: Workflow,
    image: '/placeholder.svg',
    title: 'Workflow',
    description: 'Build automated workflows connecting agents with data and actions.'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Plug,
    image: '/placeholder.svg',
    title: 'Integrations',
    description: 'Connect to 100+ APIs, blockchains, and external services.'
  },
  {
    id: 'community',
    label: 'Community',
    icon: Users,
    image: '/placeholder.svg',
    title: 'Community',
    description: 'Join a thriving ecosystem of builders and traders.'
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    image: '/placeholder.svg',
    title: 'Security',
    description: 'Enterprise-grade security with audited smart contracts.'
  }
];

export function FeatureToggle() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const active = features.find(f => f.id === activeFeature) || features[0];

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Toggle Buttons */}
        <div className="flex md:flex-wrap md:justify-center gap-2 mb-10 overflow-x-auto pb-2 md:pb-0 snap-x snap-mandatory scrollbar-hide">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;
            
            return (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                  "border flex-shrink-0 snap-center",
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:bg-foreground hover:text-background hover:border-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {feature.label}
              </button>
            );
          })}
        </div>

        {/* Feature Display */}
        <div 
          className="relative rounded-2xl border border-border overflow-hidden"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
            <div className="flex-1 flex items-center justify-center">
              <img
                key={active.id}
                src={active.image}
                alt={active.label}
                className="max-h-[400px] w-auto rounded-lg shadow-lg border border-border/50 animate-scale-in"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-3">
                {active.title}
              </h3>
              <p className="text-foreground">
                {active.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
