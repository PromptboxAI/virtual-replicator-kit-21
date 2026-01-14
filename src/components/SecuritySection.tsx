import React from 'react';
import { Shield, CheckCircle, Clock } from 'lucide-react';

const certifications = [
  {
    id: '001',
    name: 'HIPAA',
    status: 'certified',
    category: 'HEALTHCARE',
    description: 'We protect sensitive medical data through secure processing, adhering to HIPAA compliance for data confidentiality.',
    icon: (
      <div className="w-16 h-16 rounded-full border border-background/20 flex items-center justify-center">
        <Shield className="w-8 h-8 text-background/60" />
      </div>
    ),
  },
  {
    id: '002',
    name: 'SOC 2 Type II',
    status: 'pending',
    category: 'SECURITY',
    description: 'Currently in our building infrastructure phase, demonstrating our commitment to rigorous security standards and data protection.',
    icon: (
      <div className="w-16 h-16 rounded-full border border-background/20 flex items-center justify-center">
        <Clock className="w-8 h-8 text-background/60" />
      </div>
    ),
  },
  {
    id: '003',
    name: 'GDPR',
    status: 'certified',
    category: 'EUROPE',
    description: 'We guard data by ensuring secure processing and providing mechanisms to exercise your rights under GDPR.',
    icon: (
      <div className="w-16 h-16 rounded-full border border-background/20 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-background/60" />
      </div>
    ),
  },
];

export const SecuritySection = () => {
  return (
    <section className="py-20 px-4 bg-foreground relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--background)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-mono text-background/50 mb-3 tracking-wider uppercase inline-block border-b-2 border-background/20 pb-1">
            OUR CERTIFICATIONS
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-background tracking-tight mb-4">
            Security built in from day one
          </h2>
          <p className="text-background/60 max-w-2xl text-lg">
            Promptbox is designed to protect your prompts, tokens, and agent workflows with modern, battle-tested security practices - so you can focus on building, not babysitting infrastructure.
          </p>
        </div>

        {/* Certification Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {certifications.map((cert) => (
            <div 
              key={cert.id}
              className="relative p-6 rounded-lg border border-background/10 bg-background/5 backdrop-blur-sm group hover:border-background/20 transition-all duration-300"
            >
              {/* Decorative corner lines */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-dashed border-background/20 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-dashed border-background/20 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-dashed border-background/20 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-dashed border-background/20 rounded-br-lg" />
              
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                {cert.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-heading font-medium text-background mb-2 flex items-center gap-2">
                {cert.name}
              {cert.status === 'pending' && (
                  <span className="text-xs font-mono text-background/40 bg-background/10 px-2 py-0.5 rounded">
                    Pending
                  </span>
                )}
              </h3>
              <p className="text-background/50 text-sm leading-relaxed mb-6">
                {cert.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-background/10">
                <span className="text-xs font-mono text-background/40 tracking-wider">
                  {cert.category}
                </span>
                <span className="text-xs font-mono text-background/40">
                  {cert.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
