import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ArrowRight, Target, Shield, Zap, Users, Globe, TrendingUp } from "lucide-react";
import { OnboardingGuide } from "@/components/OnboardingGuide";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            PROMPTBOX MAKES IP
            <br />
            <span className="text-white">INTELLIGENT</span>
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            IP is the world's largest asset class and one that AI can't exist without.
            <br />
            PromptBox lets you take control over your AI agents and earn wherever they're used.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
              Start Building
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-foreground">Tokenize Intelligence</h2>
              <p className="text-muted-foreground text-lg mb-6">
                We believe the future belongs to autonomous AI agents that can create value, 
                make decisions, and participate in the digital economy. PromptBox provides 
                the fairest, most transparent way for humans to co-own and benefit from these agents.
              </p>
              <p className="text-muted-foreground text-lg">
                Our platform enables collective ownership, governance, and trading of AI agents, 
                creating a new asset class for the digital age.
              </p>
            </div>
            <div className="relative">
              <Card className="p-8 bg-white border border-gray-100 shadow-lg">
                <h3 className="text-lg font-semibold mb-6 text-center">INTANGIBLE ASSETS</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">$61T</div>
                    <div className="text-sm text-muted-foreground">IP Market Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">$6.64T</div>
                    <div className="text-sm text-muted-foreground">Media*</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">$7.81T</div>
                    <div className="text-sm text-muted-foreground">Healthcare*</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">$3.48T</div>
                    <div className="text-sm text-muted-foreground">Energy*</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">* source: stockanalysis.com</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="py-16 px-4 pb-32 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Get Started On PromptBox</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join the future of AI agent ownership
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <OnboardingGuide />
          </div>
        </div>
      </section>

      {/* $PROMPT Token Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-story bg-clip-text text-transparent">$PROMPT</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                The currency of AI Agents
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-gradient-primary text-white hover:opacity-90 font-semibold">
                  Buy $PROMPT
                </Button>
                <Button size="lg" variant="outline" className="border-primary hover:border-primary/70 text-primary font-semibold">
                  Read our Whitepaper
                </Button>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8 bg-gradient-primary shadow-xl border-0">
                <div className="aspect-square bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <div className="text-6xl font-bold text-white">$PROMPT</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">PromptBox is the World's IP Blockchain</h2>
          <h3 className="text-2xl mb-8 text-muted-foreground">that transforms intelligence into Programmable IP assets.</h3>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card className="p-6 bg-white border border-gray-100 shadow-lg">
                <h4 className="font-semibold mb-3 text-foreground">Trade</h4>
                <p className="text-muted-foreground text-sm">
                  Trade IP in a global market for AI training and remixing
                </p>
              </Card>
              <Card className="p-6 bg-white border border-gray-100 shadow-lg">
                <h4 className="font-semibold mb-3 text-foreground">Onramp</h4>
                <p className="text-muted-foreground text-sm">
                  Onramp real-world IP (RWIP) for DeFi use cases
                </p>
              </Card>
              <Card className="p-6 bg-white border border-gray-100 shadow-lg">
                <h4 className="font-semibold mb-3 text-foreground">Monetize</h4>
                <p className="text-muted-foreground text-sm">
                  Tokenize, fractionalize, and monetize IP onchain
                </p>
              </Card>
            </div>
            <Button size="lg" className="bg-gradient-primary text-white hover:opacity-90 font-semibold">
              Be Part of the Future
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-primary py-20 relative overflow-hidden">
        {/* Dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(100,100,100,0.6) 1px, transparent 1px)`,
            backgroundSize: '8px 8px'
          }}
        ></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="text-sm text-white/60 tracking-widest uppercase mb-4">
            CREATE AGENT
          </div>
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Launch<br />Your Token-First AI Agent?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join the future of AI agent economics. Create value, build community, 
            and scale with purpose.
          </p>
          <div className="flex justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-white/90">
              Create Agent
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;