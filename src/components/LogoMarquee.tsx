import React from 'react';
import privyLogo from '@/assets/privy-logo.png';

const logos = [
  { name: 'Github', text: 'GITHUB' },
  { name: 'OpenAI', text: 'OPENAI' },
  { name: 'Privy', image: privyLogo },
  { name: 'Supabase', text: 'SUPABASE' },
  { name: 'MIT License', text: 'MIT LICENSE' },
  { name: 'Google', text: 'GOOGLE' },
  { name: 'Claude', text: 'CLAUDE' },
];

export function LogoMarquee() {
  return (
    <div className="w-full overflow-hidden bg-muted/20 py-12 border-y border-border/50">
      <div className="relative flex">
        {/* First set of logos */}
        <div className="flex animate-marquee gap-16 pr-16">
          {logos.map((logo, index) => (
            <div
              key={`${logo.name}-1-${index}`}
              className="flex items-center justify-center min-w-[140px] grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              {'image' in logo ? (
                <img src={logo.image} alt={logo.name} className="h-20 object-contain" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {logo.text}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Duplicate set for seamless loop */}
        <div className="flex animate-marquee gap-16 pr-16" aria-hidden="true">
          {logos.map((logo, index) => (
            <div
              key={`${logo.name}-2-${index}`}
              className="flex items-center justify-center min-w-[140px] grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              {'image' in logo ? (
                <img src={logo.image} alt={logo.name} className="h-20 object-contain" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {logo.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
