import React, { useEffect, useState } from 'react';
import { Bot, Coins, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    bg: string;
    border: string;
    text: string;
    handle: string;
  };
}

const steps: Step[] = [
  {
    id: 'token',
    label: 'Create Token',
    icon: Coins,
    color: {
      bg: 'bg-blue-50/80',
      border: 'border-blue-200',
      text: 'text-blue-700',
      handle: 'fill-blue-500',
    },
  },
  {
    id: 'agent',
    label: 'Build Agent',
    icon: Bot,
    color: {
      bg: 'bg-purple-50/80',
      border: 'border-purple-200',
      text: 'text-purple-700',
      handle: 'fill-purple-500',
    },
  },
  {
    id: 'value',
    label: 'Generate Value',
    icon: TrendingUp,
    color: {
      bg: 'bg-green-50/80',
      border: 'border-green-200',
      text: 'text-green-700',
      handle: 'fill-green-500',
    },
  },
];

interface StepsFlowProps {
  className?: string;
}

export function StepsFlow({ className }: StepsFlowProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
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
    
    // Auto highlight cycle
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const renderConnector = (index: number) => {
    if (index === steps.length - 1) return null;
    
    const isActive = activeStep === index || hoveredStep === index;
    const nextIsActive = activeStep === index + 1 || hoveredStep === index + 1;
    const shouldHighlight = isActive || nextIsActive;

    return (
      <div className="flex-shrink-0 relative" key={`connector-${index}`}>
        {/* Mobile - Short straight line */}
        <div className="md:hidden flex items-center justify-center h-6">
          <div 
            className={cn(
              "w-0.5 h-full transition-all duration-600",
              shouldHighlight && !prefersReducedMotion ? "bg-primary/60" : "bg-border"
            )}
          ></div>
        </div>

        {/* Desktop - Curved SVG connector */}
        <div className="hidden md:block">
          <svg
            width="60"
            height="40"
            viewBox="0 0 60 40"
            className="overflow-visible"
          >
            {/* Curved connector path */}
            <path
              d="M 0 20 Q 30 10, 60 20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className={cn(
                "text-border transition-all duration-600",
                shouldHighlight && !prefersReducedMotion ? "text-primary opacity-80" : "opacity-40"
              )}
              strokeDasharray={!prefersReducedMotion ? "60" : "none"}
              strokeDashoffset={!prefersReducedMotion ? "60" : "0"}
              style={{
                animation: !prefersReducedMotion && shouldHighlight 
                  ? "drawLine 1.5s ease-in-out forwards" 
                  : "none",
              }}
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full mb-8", className)}>
      <style>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.995);
          }
        }
        
        .breathing {
          animation: breathe 6s ease-in-out infinite;
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row items-center md:justify-start gap-4 md:gap-0">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = activeStep === index;
          const isHovered = hoveredStep === index;
          const shouldGlow = isActive || isHovered;
          
          return (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  "relative group cursor-pointer",
                  "transform transition-all duration-300 ease-out",
                  "will-change-transform",
                  isLoaded 
                    ? `translate-y-0 opacity-100` 
                    : "translate-y-4 opacity-0",
                  !prefersReducedMotion && !isHovered && "breathing"
                )}
                style={{
                  transitionDelay: isLoaded ? `${index * 120}ms` : "0ms",
                }}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Card */}
                <div
                  className={cn(
                    "relative p-3 rounded-xl border backdrop-blur-sm w-28 h-12",
                    "transition-all duration-300 ease-out",
                    "hover:shadow-lg hover:-translate-y-1",
                    step.color.bg,
                    step.color.border,
                    shouldGlow && !prefersReducedMotion
                      ? "shadow-glow ring-2 ring-primary/20"
                      : "shadow-sm"
                  )}
                >
                  {/* Left handle dot - visible on all boxes */}
                  <div 
                    className={cn(
                      "absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background",
                      "transition-all duration-300 z-10",
                      step.color.handle.replace('fill-', 'bg-'),
                      index === 0 ? "opacity-50" : "opacity-100",
                      (activeStep === index || hoveredStep === index) && !prefersReducedMotion ? "scale-110" : ""
                    )}
                  />
                  
                  {/* Right handle dot - visible on all boxes */}
                  <div 
                    className={cn(
                      "absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background",
                      "transition-all duration-300 z-10",
                      step.color.handle.replace('fill-', 'bg-'),
                      index === steps.length - 1 ? "opacity-50" : "opacity-100",
                      shouldGlow && !prefersReducedMotion ? "scale-110 shadow-sm" : ""
                    )}
                  />

                  {/* Content */}
                  <div className="flex items-center justify-center gap-2 h-full">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                        "transition-all duration-300",
                        step.color.bg.replace('/80', ''),
                        shouldGlow 
                          ? "ring-1 ring-primary/30" 
                          : ""
                      )}
                    >
                      <StepIcon 
                        className={cn(
                          "w-3 h-3 transition-colors duration-300",
                          step.color.text
                        )} 
                      />
                    </div>
                    
                    {/* Label */}
                    <span
                      className={cn(
                        "text-xs font-medium whitespace-nowrap transition-colors duration-300",
                        step.color.text
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              </div>
              
              {renderConnector(index)}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}