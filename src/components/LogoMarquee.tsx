import React from 'react';
import privyLogo from '@/assets/privy-logo.png';
import openaiLogo from '@/assets/openai-logo.png';
import mitLogo from '@/assets/mit-logo.png';
import geminiLogo from '@/assets/gemini-logo.png';
import supabaseLogo from '@/assets/supabase-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import githubLogo from '@/assets/github-logo.png';

const logos = [
  { name: 'Github', image: githubLogo, mobileHeight: 32, desktopHeight: 48 },
  { name: 'OpenAI', image: openaiLogo, mobileHeight: 32, desktopHeight: 48 },
  { name: 'Privy', image: privyLogo, mobileHeight: 28, desktopHeight: 44 },
  { name: 'Supabase', image: supabaseLogo, mobileHeight: 32, desktopHeight: 52 },
  { name: 'MIT License', image: mitLogo, mobileHeight: 32, desktopHeight: 48 },
  { name: 'Gemini', image: geminiLogo, mobileHeight: 36, desktopHeight: 56 },
  { name: 'Claude', image: claudeLogo, mobileHeight: 44, desktopHeight: 72 },
];

export function LogoMarquee() {
  return (
    <div className="w-full overflow-hidden bg-background py-2 border-y border-border/50">
      {/* Mobile: Static two-column grid */}
      <div className="md:hidden px-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {logos.slice(0, -1).map((logo, index) => (
            <div
              key={`${logo.name}-mobile-${index}`}
              className="flex items-center justify-center"
            >
              <img 
                src={logo.image} 
                alt={logo.name} 
                style={{ height: logo.mobileHeight }}
                className="object-contain" 
              />
            </div>
          ))}
          {/* Center the last logo (Claude) */}
          <div className="col-span-2 flex items-center justify-center">
            <img 
              src={logos[logos.length - 1].image} 
              alt={logos[logos.length - 1].name} 
              style={{ height: logos[logos.length - 1].mobileHeight }}
              className="object-contain" 
            />
          </div>
        </div>
      </div>

      {/* Desktop: Animated marquee */}
      <div className="hidden md:flex relative">
        {/* First set of logos */}
        <div className="flex animate-marquee gap-16 pr-16">
          {logos.map((logo, index) => (
            <div
              key={`${logo.name}-1-${index}`}
              className="flex items-center justify-center min-w-[140px]"
            >
              <img 
                src={logo.image} 
                alt={logo.name} 
                style={{ height: logo.desktopHeight }}
                className="object-contain" 
              />
            </div>
          ))}
        </div>
        
        {/* Duplicate set for seamless loop */}
        <div className="flex animate-marquee gap-16 pr-16" aria-hidden="true">
          {logos.map((logo, index) => (
            <div
              key={`${logo.name}-2-${index}`}
              className="flex items-center justify-center min-w-[140px]"
            >
              <img 
                src={logo.image} 
                alt={logo.name} 
                style={{ height: logo.desktopHeight }}
                className="object-contain" 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
