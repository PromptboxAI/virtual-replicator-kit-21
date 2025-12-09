import React from 'react';
import privyLogo from '@/assets/privy-logo.png';
import openaiLogo from '@/assets/openai-logo.png';
import mitLogo from '@/assets/mit-logo.png';
import geminiLogo from '@/assets/gemini-logo.png';
import supabaseLogo from '@/assets/supabase-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import githubLogo from '@/assets/github-logo.png';

const logos = [
  { name: 'Github', image: githubLogo },
  { name: 'OpenAI', image: openaiLogo },
  { name: 'Privy', image: privyLogo },
  { name: 'Supabase', image: supabaseLogo },
  { name: 'MIT License', image: mitLogo },
  { name: 'Gemini', image: geminiLogo },
  { name: 'Claude', image: claudeLogo },
];

export function LogoMarquee() {
  return (
    <div className="w-full overflow-hidden bg-background py-4 border-y border-border/50">
      {/* Scrolling marquee for all screen sizes */}
      <div className="flex relative">
        {/* First set of logos */}
        <div className="flex animate-marquee gap-8 md:gap-16 pr-8 md:pr-16">
          {logos.map((logo, index) => (
            <div
              key={`${logo.name}-1-${index}`}
              className="flex items-center justify-center min-w-[100px] md:min-w-[140px]"
            >
              <img 
                src={logo.image} 
                alt={logo.name} 
                className="h-10 md:h-14 object-contain" 
              />
            </div>
          ))}
        </div>
        
        {/* Duplicate set for seamless loop */}
        <div className="flex animate-marquee gap-8 md:gap-16 pr-8 md:pr-16" aria-hidden="true">
          {logos.map((logo, index) => (
            <div
              key={`${logo.name}-2-${index}`}
              className="flex items-center justify-center min-w-[100px] md:min-w-[140px]"
            >
              <img 
                src={logo.image} 
                alt={logo.name} 
                className="h-10 md:h-14 object-contain" 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
