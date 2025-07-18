import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about PromptBox and token-first AI agents
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-0">
              <AccordionItem value="item-1" className="border-b border-border">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  What is Promptbox?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  Promptbox is a Web3-native platform that lets anyone launch and customize their own AI agent. Agents are created by pledging $PROMPT tokens to a bonding curve. Once a token reaches a threshold, it "graduates" and unlocks a fully featured AI workflow builder — no coding required.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b border-border">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  How do I create an AI agent?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  First, you pledge $PROMPT tokens to a bonding curve tied to a new agent concept. Once the curve reaches 42,000 $PROMPT pledged, your token launches, and the agent becomes live. You'll then unlock access to a private dashboard where you can build your agent using drag-and-drop tools.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-b border-border">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  What can my AI agent do?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  <div className="space-y-2">
                    <p>Your agent can:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Use LLMs like GPT-4 and Claude</li>
                      <li>Connect to files, websites, or spreadsheets</li>
                      <li>Chain logic and memory steps</li>
                      <li>Output to chatbots, APIs, or even trading bots</li>
                      <li>Integrate with tools like Zapier, Slack, or custom webhooks</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b border-border">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  Do I need to know how to code?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  Nope. Promptbox is completely no-code. Our visual builder lets you connect blocks like "Input," "Prompt," "Memory," "Output," and more — just like StackAI or Zapier.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-b border-border">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  What's the difference between Promptbox and StackAI?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  Promptbox is token-gated. Every AI agent on the platform begins as a crypto-backed project. This means agents can be community-owned, tradable, and incentivized — unlocking a whole new layer of utility and value beyond traditional SaaS tools.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border-b border-border">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  What happens after I create an agent?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  <div className="space-y-2">
                    <p>Once your agent is live:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>You'll get access to a private builder dashboard</li>
                      <li>You can export the agent as a chatbot, embed, API, or public interface</li>
                      <li>Others can interact with, fork, or even govern the agent if tokenized permissions are enabled</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border-b border-border">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  Is Promptbox on Ethereum?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  Promptbox is built on Base, an Ethereum Layer 2. This enables fast, low-cost transactions and compatibility with existing wallets like MetaMask, Coinbase Wallet, and others.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border-b border-border">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  What is the $PROMPT token used for?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  <div className="space-y-2">
                    <p>$PROMPT is the native utility token of the platform. It's used to:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Launch AI agents via bonding curves</li>
                      <li>Access premium features and tools</li>
                      <li>Participate in governance (future roadmap)</li>
                      <li>Power incentive mechanisms for agent creators and users</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border-b border-border">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  Can I monetize my AI agent?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  <div className="space-y-2">
                    <p>Yes. You can:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Charge access fees for advanced agent outputs</li>
                      <li>Create community-owned agents and govern them via tokenomics</li>
                      <li>Earn $PROMPT through usage, staking, or referral incentives (coming soon)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="border-b border-border">
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  How do I get started?
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-muted-foreground">
                  <div className="space-y-2">
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Connect your wallet</li>
                      <li>Choose an idea or template</li>
                      <li>Pledge $PROMPT to begin</li>
                      <li>Once launched, build your agent in the visual workflow editor</li>
                      <li>Export it however you like — as a chatbot, API, or embed for your app</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
            GET STARTED
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