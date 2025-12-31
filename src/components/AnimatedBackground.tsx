import React, { useEffect, useRef } from 'react';
import { Brain, Network, Cpu, Database, Zap, Link, Code, Bot } from 'lucide-react';

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  icon: React.ComponentType<any>;
  opacity: number;
  direction: { x: number; y: number };
}

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const elementsRef = useRef<FloatingElement[]>([]);

  // Web3 + AI themed icons
  const icons = [Brain, Network, Cpu, Database, Zap, Link, Code, Bot];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize floating elements
    const initElements = () => {
      elementsRef.current = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 20 + 15, // 15-35px
        speed: Math.random() * 0.5 + 0.2, // 0.2-0.7
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.5, // -0.25 to 0.25
        icon: icons[Math.floor(Math.random() * icons.length)],
        opacity: Math.random() * 0.3 + 0.1, // 0.1-0.4
        direction: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2
        }
      }));
    };

    // Animation loop
    const animate = () => {
      elementsRef.current.forEach(element => {
        // Update position
        element.x += element.direction.x * element.speed;
        element.y += element.direction.y * element.speed;
        
        // Update rotation
        element.rotation += element.rotationSpeed;
        
        // Bounce off edges
        if (element.x <= 0 || element.x >= window.innerWidth) {
          element.direction.x *= -1;
        }
        if (element.y <= 0 || element.y >= window.innerHeight) {
          element.direction.y *= -1;
        }
        
        // Keep within bounds
        element.x = Math.max(0, Math.min(window.innerWidth, element.x));
        element.y = Math.max(0, Math.min(window.innerHeight, element.y));
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    initElements();
    animate();

    const handleResize = () => {
      initElements();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none -z-10"
    >
      {/* Clean background - no gradient */}
      
      {/* Neural network-style connections */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern id="circuit" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 0v60M0 30h60" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3"/>
            <circle cx="30" cy="30" r="2" fill="hsl(var(--primary))" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)"/>
      </svg>

      {/* Floating icons */}
      {elementsRef.current.map((element) => {
        const IconComponent = element.icon;
        return (
          <div
            key={element.id}
            className="absolute transition-all duration-1000 ease-out"
            style={{
              left: `${element.x}px`,
              top: `${element.y}px`,
              transform: `rotate(${element.rotation}deg)`,
              opacity: element.opacity,
            }}
          >
            <div className="relative">
              <IconComponent 
                size={element.size} 
                className="text-primary drop-shadow-sm animate-pulse"
                style={{ 
                  animationDuration: `${2 + Math.random() * 2}s`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
              {/* Glow effect */}
              <div 
                className="absolute inset-0 blur-md opacity-30"
                style={{
                  background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Particle flow animation */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-primary/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Data flow lines */}
      <div className="absolute inset-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`line-${i}`}
            className="absolute bg-gradient-to-r from-transparent via-primary/20 to-transparent h-px animate-pulse"
            style={{
              width: `${200 + Math.random() * 300}px`,
              left: `${Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              transform: `rotate(${Math.random() * 45 - 22.5}deg)`,
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
