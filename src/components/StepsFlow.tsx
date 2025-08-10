import React, { useEffect, useState } from 'react';
import { Bot, Coins, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    bg: string;
    bgDark: string;
    border: string;
    text: string;
  };
}

const steps: Step[] = [
  {
    id: 'token',
    label: 'Create Token',
    icon: Coins,
    color: {
      bg: 'bg-blue-50',
      bgDark: 'dark:bg-blue-950/30',
      border: 'border-blue-200/50',
      text: 'text-slate-900 dark:text-slate-100',
    },
  },
  {
    id: 'agent',
    label: 'Build Agent',
    icon: Bot,
    color: {
      bg: 'bg-violet-50',
      bgDark: 'dark:bg-violet-950/30',
      border: 'border-violet-200/50',
      text: 'text-slate-900 dark:text-slate-100',
    },
  },
  {
    id: 'value',
    label: 'Generate Value',
    icon: TrendingUp,
    color: {
      bg: 'bg-green-50',
      bgDark: 'dark:bg-green-950/30',
      border: 'border-green-200/50',
      text: 'text-slate-900 dark:text-slate-100',
    },
  },
];

const connectorColors = {
  'token-agent': '#3b82f6', // blue
  'agent-value': '#22c55e', // green
};

interface StepsFlowProps {
  className?: string;
}

export function StepsFlow({ className }: StepsFlowProps) {
  const [activeConnector, setActiveConnector] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Trigger load animation
    setTimeout(() => setIsLoaded(true), 100);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    
    // Cycle between connectors every 2.5s
    const interval = setInterval(() => {
      setActiveConnector((prev) => (prev + 1) % 2);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const renderConnector = (index: number) => {
    if (index === steps.length - 1) return null;
    
    const connectorKey = index === 0 ? 'token-agent' : 'agent-value';
    const color = connectorColors[connectorKey as keyof typeof connectorColors];
    const isActive = activeConnector === index;

    return (
      <div className="relative flex-shrink-0" key={`connector-${index}`}>
        {/* Mobile - Vertical line */}
        <div className="md:hidden w-full flex justify-center py-2">
          <div className="relative">
            <div 
              className="w-0.5 h-6 bg-border/60"
              style={{ backgroundColor: `${color}40` }}
            />
            {!prefersReducedMotion && (
              <div 
                className="absolute top-0 left-0 w-0.5 h-6 transition-opacity duration-300"
                style={{ 
                  backgroundColor: color,
                  opacity: isActive ? 0.9 : 0.6 
                }}
              />
            )}
          </div>
        </div>

        {/* Desktop - Curved SVG connector */}
        <div className="hidden md:block relative z-0">
          <svg
            width="64"
            height="32"
            viewBox="0 0 64 32"
            className="overflow-visible"
          >
            {/* Handle at start */}
            <circle
              cx="6"
              cy="16"
              r="3"
              stroke={color}
              fill={color}
              strokeWidth="1"
              className={cn(
                "transition-opacity duration-300",
                !prefersReducedMotion && isActive ? "opacity-90" : "opacity-60"
              )}
            />
            
            {/* Curved connector path */}
            <path
              d="M 12 16 Q 32 8, 52 16"
              stroke={color}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "transition-opacity duration-300",
                !prefersReducedMotion && isActive ? "opacity-90" : "opacity-60"
              )}
              strokeDasharray={!prefersReducedMotion ? "40" : "none"}
              strokeDashoffset={!prefersReducedMotion ? "40" : "0"}
              style={{
                animation: !prefersReducedMotion && isActive 
                  ? "drawConnector 2s ease-in-out forwards" 
                  : "none",
              }}
            />
            
            {/* Handle at end */}
            <circle
              cx="58"
              cy="16"
              r="3"
              stroke={color}
              fill={color}
              strokeWidth="1"
              className={cn(
                "transition-opacity duration-300",
                !prefersReducedMotion && isActive ? "opacity-90" : "opacity-60"
              )}
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full mt-4 md:mt-6", className)}>
      <style>{`
        @keyframes drawConnector {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      
      <div className="flex md:flex-row flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          
          return (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  "relative z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border shadow-sm",
                  "transition-all duration-300 ease-out",
                  step.color.bg,
                  step.color.bgDark,
                  step.color.border,
                  isLoaded 
                    ? "translate-y-0 opacity-100" 
                    : "translate-y-2 opacity-0"
                )}
                style={{
                  transitionDelay: isLoaded ? `${index * 150}ms` : "0ms",
                }}
              >
                {/* Icon */}
                <StepIcon 
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    step.color.text
                  )} 
                />
                
                {/* Label */}
                <span
                  className={cn(
                    "font-medium text-sm sm:text-base whitespace-nowrap",
                    step.color.text
                  )}
                >
                  {step.label}
                </span>

                {/* Micro handles */}
                {index < steps.length - 1 && (
                  <div 
                    className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full hidden md:block"
                    style={{ backgroundColor: connectorColors[index === 0 ? 'token-agent' : 'agent-value'] }}
                  />
                )}
                
                {index > 0 && (
                  <div 
                    className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full hidden md:block"
                    style={{ backgroundColor: connectorColors[index === 1 ? 'token-agent' : 'agent-value'] }}
                  />
                )}
              </div>
              
              {renderConnector(index)}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}