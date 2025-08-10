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

  return (
    <div className={cn("w-full mt-4 md:mt-6", className)}>
      <style>{`
        @keyframes flowingDots {
          0% {
            stroke-dashoffset: 30;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        
        .animated-connector {
          animation: flowingDots 2s linear infinite;
        }
      `}</style>
      
      <div className="flex md:flex-row flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = activeConnector === index;
          
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

                {/* Micro handles - right side for Token and Agent */}
                {index < steps.length - 1 && (
                  <div 
                    className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: connectorColors[index === 0 ? 'token-agent' : 'agent-value'] }}
                  />
                )}
                
                {/* Micro handles - left side for Agent and Value */}
                {index > 0 && (
                  <div 
                    className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: connectorColors[index === 1 ? 'token-agent' : 'agent-value'] }}
                  />
                )}
              </div>
              
              {/* Connector line between boxes */}
              {index < steps.length - 1 && (
                <div className="relative" style={{ width: '48px', height: '32px' }}>
                  {/* Mobile - Vertical line */}
                  <div className="md:hidden w-full flex justify-center">
                    <div 
                      className={cn(
                        "w-0.5 h-6 transition-opacity duration-300",
                        !prefersReducedMotion && "animated-connector"
                      )}
                      style={{ 
                        backgroundColor: connectorColors[index === 0 ? 'token-agent' : 'agent-value'],
                        opacity: 0.8
                      }}
                    />
                  </div>

                  {/* Desktop - Visible connecting line */}
                  <div className="hidden md:block w-full h-full">
                    <svg
                      width="48"
                      height="32"
                      viewBox="0 0 48 32"
                      className="w-full h-full"
                    >
                      <path
                        d="M 0 16 Q 24 8, 48 16"
                        stroke={connectorColors[index === 0 ? 'token-agent' : 'agent-value']}
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="8 4"
                        opacity="0.8"
                        className={cn(
                          !prefersReducedMotion && "animated-connector"
                        )}
                      />
                    </svg>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}