import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Cpu, Shield, Zap } from "lucide-react";

const Learn = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-8 text-foreground">
            LearnPromptBox
          </h1>
          <h2 className="text-3xl md:text-4xl mb-6 text-foreground">
            Leverage the power
            <br />
            of autonomous intelligence
            <br />
            on the world's AI blockchain.
          </h2>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg px-8 py-6">
            Get Started with AI Agents
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="relative bg-gray-100 rounded-2xl overflow-hidden max-w-4xl mx-auto aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-0 h-0 border-l-8 border-l-white border-t-6 border-t-transparent border-b-6 border-b-transparent ml-1"></div>
                </div>
                <p className="text-lg text-muted-foreground">A message from PromptBox Co-Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tokenize Intelligence Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">Tokenize Intelligence</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto">
            Artificial intelligence is a multi-trillion-dollar asset class trapped in centralized systems. 
            PromptBox onramps AI to the blockchain and makes it programmable through innovation across three layers:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Layer 1 */}
            <Card className="p-8 bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow text-center group cursor-pointer">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Application Ecosystem</h3>
              <p className="text-muted-foreground mb-4">
                A vibrant ecosystem of applications that leverage tokenized artificial intelligence for use cases like AIFi.
              </p>
            </Card>

            {/* Layer 2 */}
            <Card className="p-8 bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow text-center group cursor-pointer">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Programmable AI License</h3>
              <p className="text-muted-foreground mb-4">
                A universal license agreement with out-of-the-box configurations to connect code and intelligence.
              </p>
            </Card>

            {/* Layer 3 */}
            <Card className="p-8 bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow text-center group cursor-pointer">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Cpu className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Proof-of-Intelligence Protocol</h3>
              <p className="text-muted-foreground mb-4">
                A modular smart contract protocol that tokenizes AI agents and makes them programmable.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Start Your AI Agent Journey</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Learn the fundamentals of AI agents, blockchain integration, and tokenized intelligence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-foreground">AI Agents 101</h3>
              <p className="text-muted-foreground mb-4">
                Understanding autonomous AI agents and their capabilities in the digital economy.
              </p>
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </Card>
            
            <Card className="p-6 bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Tokenization Basics</h3>
              <p className="text-muted-foreground mb-4">
                How AI agents become tradeable assets through blockchain tokenization.
              </p>
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </Card>
            
            <Card className="p-6 bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Trading Guide</h3>
              <p className="text-muted-foreground mb-4">
                Step-by-step guide to trading and investing in AI agent tokens.
              </p>
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </Card>
            
            <Card className="p-6 bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Developer Resources</h3>
              <p className="text-muted-foreground mb-4">
                Technical documentation for building on the PromptBox platform.
              </p>
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </Card>
            
            <Card className="p-6 bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Community Hub</h3>
              <p className="text-muted-foreground mb-4">
                Connect with other AI agent creators and investors in our community.
              </p>
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </Card>
            
            <Card className="p-6 bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Advanced Concepts</h3>
              <p className="text-muted-foreground mb-4">
                Deep dive into advanced AI agent mechanics and protocol features.
              </p>
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">Ready to Build the Future?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers and investors shaping the autonomous AI economy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Start Building
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 font-semibold">
              Explore Documentation
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Learn;