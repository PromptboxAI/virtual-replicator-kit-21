import React from 'react';
import { Card } from '@/components/ui/card';
import kevinPhoto from '@/assets/kevin-godfrey.png';
import pbLogo from '@/assets/pb-logo-icon.png';

interface TeamQuote {
  id: string;
  quote: string;
  author: string;
  role: string;
}

const teamQuotes: TeamQuote[] = [
  {
    id: '1',
    quote: "Working on Promptbox has been an incredible journey. We're not just writing code, we're building infrastructure that will really help the next generation of AI creators to turn their ideas into real, sustainable businesses.",
    author: 'Alex C.',
    role: 'Lead Developer',
  },
  {
    id: '2',
    quote: "The technical challenges we're solving here are unique. Combining smart contracts, bonding curves, and AI agent orchestration into a seamless experience is exactly the kind of problem that gets me excited to code every day.",
    author: 'Marcus Rodriguez',
    role: 'Senior Engineer',
  },
];

export function FounderSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12">
          <p className="text-sm font-mono text-muted-foreground mb-2 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
            A WORD FROM OUR FOUNDER
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-foreground leading-tight tracking-tight">
            Why We Built Promptbox
          </h2>
        </div>

        {/* Founder Quote Card */}
        <Card className="p-8 md:p-12 mb-6 bg-card border-border relative">
          {/* Logo in corner */}
          <img 
            src={pbLogo} 
            alt="Promptbox" 
            className="absolute bottom-6 right-6 w-20 h-20"
          />
          
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            {/* Photo - Doubled size */}
            <div className="flex-shrink-0">
              <div className="w-80 h-96 md:w-96 md:h-[28rem] overflow-hidden group">
                <img 
                  src={kevinPhoto} 
                  alt="Kevin Godfrey, Founder of Promptbox"
                  className="w-full h-full object-cover object-top grayscale transition-all duration-500 group-hover:grayscale-0"
                />
              </div>
            </div>

            {/* Quote Content */}
            <div className="flex-1">
              <blockquote className="text-lg md:text-xl lg:text-2xl font-medium text-foreground leading-relaxed mb-8">
                "We're building Promptbox because we believe the future of AI isn't just about building smarter models or the next big tool - it's about giving everyone the power to create, own, and monetize their own AI-driven ideas. The intersection of Agents and tokenomics creates entirely new possibilities for how software can be built, funded, and governed."
              </blockquote>
              
              <div>
                <p className="font-semibold text-foreground text-lg">
                  Kevin Godfrey
                </p>
                <p className="text-sm text-muted-foreground tracking-wider uppercase">
                  Founder, Promptbox
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Team Quotes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamQuotes.map((member) => (
            <Card 
              key={member.id} 
              className="p-6 md:p-8 bg-card border-border relative flex flex-col"
            >
              {/* Logo in corner */}
              <img 
                src={pbLogo} 
                alt="Promptbox" 
                className="absolute bottom-6 right-6 w-8 h-8"
              />
              
              <blockquote className="text-muted-foreground leading-relaxed mb-6 italic flex-1">
                "{member.quote}"
              </blockquote>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">
                  {member.author}
                </p>
                <span className="text-muted-foreground">·</span>
                <p className="text-sm text-muted-foreground">
                  {member.role}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
