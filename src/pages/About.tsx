import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Target, Shield, Zap, Users, Globe, TrendingUp } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-cyber bg-clip-text text-transparent">
              The Future of AI Agent
            </span>
            <br />
            <span className="text-foreground">Ownership & Trading</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            PromptBox is pioneering the world's first transparent marketplace for co-owning AI agents. 
            We're building the infrastructure for the autonomous digital economy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow-primary">
              Join the Revolution
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary/50 hover:border-primary">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
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
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-border">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">100%</div>
                    <div className="text-sm text-muted-foreground">Transparent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                    <div className="text-sm text-muted-foreground">Autonomous</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">∞</div>
                    <div className="text-sm text-muted-foreground">Scalable</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">0%</div>
                    <div className="text-sm text-muted-foreground">Platform Fees</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Why PromptBox?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We're building the foundational infrastructure for AI agent commerce and governance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors">
              <Target className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Fair Ownership</h3>
              <p className="text-muted-foreground">
                Transparent tokenomics ensure fair distribution and governance of AI agent ownership
              </p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Secure Protocol</h3>
              <p className="text-muted-foreground">
                Built on battle-tested blockchain infrastructure with advanced security measures
              </p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors">
              <Zap className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Lightning Fast</h3>
              <p className="text-muted-foreground">
                High-performance trading engine with instant settlement and real-time updates
              </p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Community Driven</h3>
              <p className="text-muted-foreground">
                Decentralized governance where token holders shape the future of the platform
              </p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors">
              <Globe className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Global Access</h3>
              <p className="text-muted-foreground">
                Access from anywhere in the world with support for multiple currencies and languages
              </p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-colors">
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Value Creation</h3>
              <p className="text-muted-foreground">
                AI agents generate real value through autonomous trading, content creation, and services
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* $PROMPT Token Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-cyber bg-clip-text text-transparent">$PROMPT</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                The currency of AI Agents
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow-primary">
                  Buy $PROMPT
                </Button>
                <Button size="lg" variant="outline" className="border-primary/50 hover:border-primary">
                  Read our Whitepaper
                </Button>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-border">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                  <div className="text-6xl font-bold text-primary/50">$PROMPT</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">The Vision</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-muted-foreground text-lg mb-8">
              Imagine a world where AI agents work autonomously to generate value, make decisions, 
              and participate in the global economy. Where humans can invest in and benefit from 
              AI capabilities without the complexity of traditional corporate structures.
            </p>
            <p className="text-muted-foreground text-lg mb-8">
              PromptBox is building that future today. We're creating the rails for an autonomous 
              digital economy where AI agents are the new companies, and everyone can participate 
              in their success.
            </p>
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow-primary">
              Be Part of the Future
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Card className="p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join our community and be among the first to experience the future of AI agent ownership
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow-primary">
                  Join Waitlist
                </Button>
                <Button size="lg" variant="outline" className="border-primary/50 hover:border-primary">
                  Contact Us
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-cyber bg-clip-text text-transparent mb-4">
                PromptBox
              </div>
              <p className="text-muted-foreground text-sm">
                Building the future of autonomous AI agent commerce and collaboration.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>AI Agents</div>
                <div>ACP Protocol</div>
                <div>GAME Framework</div>
                <div>Governance</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Developers</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Documentation</div>
                <div>API Reference</div>
                <div>SDK</div>
                <div>Support</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Community</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Discord</div>
                <div>Twitter</div>
                <div>GitHub</div>
                <div>Blog</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;