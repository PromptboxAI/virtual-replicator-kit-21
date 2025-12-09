import React from 'react';
import { Card } from '@/components/ui/card';
import { Quote } from 'lucide-react';
import kevinPhoto from '@/assets/kevin-godfrey.png';

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
        <Card className="p-8 md:p-12 bg-card border-border">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            {/* Photo */}
            <div className="flex-shrink-0">
              <div className="w-40 h-48 md:w-48 md:h-56 overflow-hidden group">
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
                "We built Promptbox because we believe the future of AI isn't just about building smarter models—it's about giving everyone the power to create, own, and monetize their own AI agents. The intersection of AI and tokenomics creates entirely new possibilities for how software can be built, funded, and governed."
              </blockquote>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-lg">
                    Kevin Godfrey
                  </p>
                  <p className="text-sm text-muted-foreground tracking-wider uppercase">
                    Founder, Promptbox
                  </p>
                </div>
                <Quote className="w-10 h-10 text-muted-foreground/30" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
