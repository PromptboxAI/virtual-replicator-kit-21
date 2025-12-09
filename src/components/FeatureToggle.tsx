import React, { useState } from 'react';
import { Coins, Bot, Workflow, Plug, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  label: string;
  icon: React.ElementType;
  image: string;
  description: string;
}

const features: Feature[] = [
  {
    id: 'token',
    label: 'Token',
    icon: Coins,
    image: '/placeholder.svg',
    description: 'Launch tokens with built-in bonding curves and automatic liquidity.'
  },
  {
    id: 'agent',
    label: 'Agent',
    icon: Bot,
    image: '/placeholder.svg',
    description: 'Deploy AI agents that can trade, analyze, and execute strategies.'
  },
  {
    id: 'workflow',
    label: 'Workflow',
    icon: Workflow,
    image: '/placeholder.svg',
    description: 'Build automated workflows connecting agents with data and actions.'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Plug,
    image: '/placeholder.svg',
    description: 'Connect to 100+ APIs, blockchains, and external services.'
  },
  {
    id: 'community',
    label: 'Community',
    icon: Users,
    image: '/placeholder.svg',
    description: 'Join a thriving ecosystem of builders and traders.'
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    image: '/placeholder.svg',
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
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;
            
            return (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                  "border",
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-foreground hover:border-foreground/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {feature.label}
              </button>
            );
          })}
        </div>

        {/* Feature Display */}
        <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="aspect-[16/9] md:aspect-[21/9] relative">
            <img
              src={active.image}
              alt={active.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-heading font-medium text-foreground mb-2">
                {active.label}
              </h3>
              <p className="text-muted-foreground max-w-lg">
                {active.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
