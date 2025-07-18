import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bot, Coins, TrendingUp, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TokenAgents = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Announcement Bar */}
      <div className="bg-primary/10 border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-primary/20">New</Badge>
            <span className="text-foreground/80">
              PromptBox Raises $16M to Help Enterprises Deploy Token-First AI Agents at Scale
            </span>
            <Link to="/learn" className="text-primary hover:text-primary/80 flex items-center gap-1">
              Read More <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {/* Workflow Visual */}
            <div className="flex items-center gap-4 mb-8">
              <Card className="p-4 border-blue-200 bg-blue-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-700">Token</span>
                </div>
              </Card>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Card className="p-4 border-yellow-200 bg-yellow-50/50">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-yellow-700" />
                  <span className="text-xs font-medium text-yellow-700">Agent</span>
                </div>
              </Card>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Card className="p-4 border-green-200 bg-green-50/50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-700" />
                  <span className="text-xs font-medium text-green-700">Value</span>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-foreground leading-tight">
                AI Agents for the{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Token Economy
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Launch tokens first to build community and generate immediate value.
                Then deploy AI agents that grow your ecosystem.
                Loved by Web3 and DeFi teams.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                <Zap className="mr-2 h-4 w-4" />
                Launch Your Token
              </Button>
              <Button variant="outline" size="lg">
                Try Demo
              </Button>
            </div>

            {/* Company Logos */}
            <div className="pt-8">
              <p className="text-sm text-muted-foreground mb-4">Trusted by leading Web3 projects</p>
              <div className="flex items-center gap-8 opacity-60">
                <div className="h-8 bg-muted rounded px-4 flex items-center text-xs font-medium">
                  Ethereum
                </div>
                <div className="h-8 bg-muted rounded px-4 flex items-center text-xs font-medium">
                  Polygon
                </div>
                <div className="h-8 bg-muted rounded px-4 flex items-center text-xs font-medium">
                  Solana
                </div>
                <div className="h-8 bg-muted rounded px-4 flex items-center text-xs font-medium">
                  Base
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl"></div>
            <img
              src="/lovable-uploads/be05442f-d979-41f4-8395-57aba376cb60.png"
              alt="Token-First AI Agent Platform"
              className="relative z-10 w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">PLATFORM</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              A Powerful Interface to Deploy Token-First AI Agents
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Build, deploy, and monetize AI agents while creating sustainable token economies 
              that benefit your entire community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Coins className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Token Launch</h3>
              <p className="text-muted-foreground">
                Launch your token with built-in bonding curves and community incentives. 
                Generate immediate value and funding for your AI agent development.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Agent Deployment</h3>
              <p className="text-muted-foreground">
                Deploy sophisticated AI agents that serve your community while generating 
                revenue that flows back to token holders automatically.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Community Growth</h3>
              <p className="text-muted-foreground">
                Build engaged communities around your agents. Token holders share in success 
                and have governance rights over agent development.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <Badge variant="outline" className="mb-4">WHY TOKEN-FIRST?</Badge>
                <h2 className="text-4xl font-bold text-foreground mb-6">
                  Start with Value, Scale with Purpose
                </h2>
                <p className="text-lg text-muted-foreground">
                  Traditional AI agents struggle with funding and adoption. Our token-first approach 
                  solves both by creating immediate value and aligned incentives.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Instant Funding</h3>
                    <p className="text-muted-foreground">
                      Generate capital through token sales before building. No need for traditional funding rounds.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Built-in Community</h3>
                    <p className="text-muted-foreground">
                      Token holders become your first users and advocates, ensuring product-market fit.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Aligned Incentives</h3>
                    <p className="text-muted-foreground">
                      Revenue sharing creates sustainable growth where everyone benefits from agent success.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Agent Revenue</span>
                    <Badge variant="secondary">+127% this month</Badge>
                  </div>
                  <div className="text-3xl font-bold">$2.4M</div>
                  <div className="text-sm text-muted-foreground">
                    Distributed to 12,847 token holders
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Community Pool</span>
                      <span>40%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-primary h-2 rounded-full w-2/5"></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Token Holders</span>
                      <span>60%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-primary h-2 rounded-full w-3/5"></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
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
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Launch Your Token-First AI Agent?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join the future of AI agent economics. Create value, build community, 
            and scale with purpose.
          </p>
          <div className="flex justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-white/90">
              Get Started
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TokenAgents;