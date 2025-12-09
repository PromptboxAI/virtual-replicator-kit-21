import React from 'react';
import { Card } from '@/components/ui/card';
import { Quote } from 'lucide-react';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarUrl?: string;
  featured?: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    quote: "PromptBox helps our team streamline the management and scaling of complex AI workflows across multiple products. We've used it to test, deploy, and manage a wide range of Agents—PromptBox provides a reliable foundation for building and running production-ready AI systems.",
    author: 'Sarah Chen',
    role: 'Chief Technology Officer',
    company: 'Nexus AI',
    featured: true,
  },
  {
    id: '2',
    quote: "PromptBox was paramount in easily building AI assistants for our students, in a matter of weeks. We were able to transform the students' learning journey ourselves, without the need to code or become an expert in AI.",
    author: 'Dr. Marcus Webb',
    role: 'Director of Innovation',
    company: 'Stanford EdTech Lab',
  },
  {
    id: '3',
    quote: "With PromptBox, work that once took a week now runs in five minutes—producing fully cited reports that eliminate the blank-page problem. PromptBox's flexibility, speed, and no-code UI have helped us to build internal tools that give our teams an edge.",
    author: 'Elena Rodriguez',
    role: 'VP of Operations',
    company: 'Quantum Ventures',
  },
];

export function TestimonialsSection() {
  const featuredTestimonial = testimonials.find(t => t.featured);
  const regularTestimonials = testimonials.filter(t => !t.featured);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12">
          <p className="text-sm font-mono text-muted-foreground mb-2 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
            OUR CLIENTS' OPINIONS
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-foreground leading-tight tracking-tight">
            Proven Impact, In Our<br />Customers' Words
          </h2>
        </div>

        {/* Featured Testimonial */}
        {featuredTestimonial && (
          <Card className="p-8 md:p-12 mb-6 bg-card border-border">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {featuredTestimonial.avatarUrl ? (
                  <img 
                    src={featuredTestimonial.avatarUrl} 
                    alt={featuredTestimonial.author}
                    className="w-40 h-48 md:w-48 md:h-56 object-cover grayscale"
                  />
                ) : (
                  <div className="w-40 h-48 md:w-48 md:h-56 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <span className="text-4xl font-heading font-medium text-muted-foreground">
                      {featuredTestimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
              </div>

              {/* Quote Content */}
              <div className="flex-1">
                <blockquote className="text-lg md:text-xl lg:text-2xl font-medium text-foreground leading-relaxed mb-8">
                  {featuredTestimonial.quote}
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-lg">
                      {featuredTestimonial.author}
                    </p>
                    <p className="text-sm text-muted-foreground tracking-wider uppercase">
                      {featuredTestimonial.role}, {featuredTestimonial.company}
                    </p>
                  </div>
                  <Quote className="w-10 h-10 text-muted-foreground/30" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Regular Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regularTestimonials.map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className="p-6 md:p-8 bg-card border-border"
            >
              <blockquote className="text-muted-foreground leading-relaxed mb-6 italic">
                {testimonial.quote}
              </blockquote>
              <div>
                <p className="font-semibold text-foreground">
                  {testimonial.author}
                </p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.role}, {testimonial.company}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
