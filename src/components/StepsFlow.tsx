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
        @keyframes drawConnector {
          to {
            stroke-dashoffset: 0;
          }
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
                <div className="relative flex-shrink-0" key={`connector-${index}`}>
                  {/* Mobile - Vertical line */}
                  <div className="md:hidden w-full flex justify-center py-2">
                    <div 
                      className="w-0.5 h-6 transition-opacity duration-300"
                      style={{ 
                        backgroundColor: connectorColors[index === 0 ? 'token-agent' : 'agent-value'],
                        opacity: !prefersReducedMotion && isActive ? 0.9 : 0.6 
                      }}
                    />
                  </div>

                  {/* Desktop - Line connecting handle to handle */}
                  <div className="hidden md:block absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg
                      width="48"
                      height="24"
                      viewBox="0 0 48 24"
                      className="absolute"
                      style={{ 
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <path
                        d="M 2 12 Q 24 6, 46 12"
                        stroke={connectorColors[index === 0 ? 'token-agent' : 'agent-value']}
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                          "transition-opacity duration-300",
                          !prefersReducedMotion && isActive ? "opacity-90" : "opacity-60"
                        )}
                        strokeDasharray={!prefersReducedMotion ? "30" : "none"}
                        strokeDashoffset={!prefersReducedMotion ? "30" : "0"}
                        style={{
                          animation: !prefersReducedMotion && isActive 
                            ? "drawConnector 2s ease-in-out forwards" 
                            : "none",
                        }}
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