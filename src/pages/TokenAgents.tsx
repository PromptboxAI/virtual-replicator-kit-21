import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Bot, Coins, TrendingUp, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LogoMarquee } from "@/components/LogoMarquee";
const TokenAgents = () => {
  return <div className="min-h-screen bg-background">
      <Header />
      

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-32">
        <div className="max-w-5xl mx-auto text-center space-y-12 animate-fade-in">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[1.1] tracking-tight">
              The Agent Graduation Protocol
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Turns agents into investable, cash-flowing micro-SaaS with proof of demand and verifiable revenue.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all duration-200 h-14 px-8 text-base" asChild>
              <Link to="/create">
                Launch Your Agent
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-base hover:scale-105 transition-all duration-200" asChild>
              <Link to="/learn">
                Learn More
              </Link>
            </Button>
          </div>

          {/* Trust Indicator */}
          <div className="pt-8">
            <p className="text-sm text-muted-foreground/60">Built on Base • Powered by Verifiable Output Receipts</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2 animate-fade-in hover:scale-105 transition-transform duration-300">
            <div className="text-4xl md:text-5xl font-bold text-foreground">42K</div>
            <div className="text-sm text-muted-foreground">Graduation Threshold</div>
          </div>
          <div className="text-center space-y-2 animate-fade-in hover:scale-105 transition-transform duration-300" style={{ animationDelay: '100ms' }}>
            <div className="text-4xl md:text-5xl font-bold text-foreground">100%</div>
            <div className="text-sm text-muted-foreground">On-Chain Verifiable</div>
          </div>
          <div className="text-center space-y-2 animate-fade-in hover:scale-105 transition-transform duration-300" style={{ animationDelay: '200ms' }}>
            <div className="text-4xl md:text-5xl font-bold text-foreground">3-Way</div>
            <div className="text-sm text-muted-foreground">Revenue Split</div>
          </div>
          <div className="text-center space-y-2 animate-fade-in hover:scale-105 transition-transform duration-300" style={{ animationDelay: '300ms' }}>
            <div className="text-4xl md:text-5xl font-bold text-foreground">Base</div>
            <div className="text-sm text-muted-foreground">L2 Network</div>
          </div>
        </div>
      </section>

      {/* Logo Marquee */}
      <LogoMarquee />

      {/* Core Protocol Features */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8 leading-tight">
              Proof of Demand Meets Verifiable Revenue
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              Every agent must prove real demand before graduation. Every revenue event is cryptographically 
              verified and transparently shared with creators, platform, and token holders.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-10 border-border/50 hover:border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center mb-6">
                <Coins className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Bonding Curve Launch</h3>
              <p className="text-muted-foreground leading-relaxed">
                Agents launch via transparent bonding curves. Only those reaching the graduation 
                threshold unlock full capabilities and DEX liquidity.
              </p>
            </Card>

            <Card className="p-10 border-border/50 hover:border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center mb-6">
                <Bot className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Verifiable Receipts</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every agent action generates cryptographic receipts. Revenue and usage are 
                auditable, tamper-evident, and anchored on-chain.
              </p>
            </Card>

            <Card className="p-10 border-border/50 hover:border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Revenue Sharing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Revenue automatically splits between platform, creator, and token holders 
                according to on-chain policies. No trust required.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Features with Visuals */}
      <section className="py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-32">
            
            {/* Feature 1: Agent Graduation Protocol */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6 order-2 md:order-1">
                <Badge className="mb-2">Agent Graduation Protocol</Badge>
                <h3 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  Launch with Proof of Demand
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Agents start on a transparent bonding curve. Reach the 42K threshold to graduate, 
                  unlock full capabilities, and automatically deploy to Uniswap V3 with permanent liquidity.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                    <span>Transparent pricing via bonding curve mechanics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                    <span>Automatic DEX listing upon graduation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                    <span>Milestone-gated governance and features</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2 group">
                <div className="relative aspect-video bg-foreground/5 rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TrendingUp className="h-24 w-24 text-foreground/20 group-hover:text-foreground/30 transition-colors group-hover:scale-110 duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Verifiable Output Receipts */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="group">
                <div className="relative aspect-video bg-foreground/5 rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bot className="h-24 w-24 text-foreground/20 group-hover:text-foreground/30 transition-colors group-hover:scale-110 duration-300" />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <Badge className="mb-2">Verifiable Output Receipts</Badge>
                <h3 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  Cryptographically Auditable
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Every monetized agent action generates a signed receipt. Receipts are batched into Merkle trees 
                  with roots anchored on-chain, making all revenue and usage tamper-evident.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                    <span>Structured receipts for every inference and action</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                    <span>Merkle-tree batching for efficient verification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                    <span>On-chain anchoring via VorLedger contract</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Token-Bound Agent Accounts */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6 order-2 md:order-1">
                <Badge className="mb-2">Token-Bound Agent Accounts</Badge>
                <h3 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  Agents as Economic Objects
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Each agent is linked to an on-chain controller defining creator, platform permissions, 
                  and revenue split policies. Agents become composable DeFi primitives.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                    <span>On-chain registry for ownership and policies</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                    <span>Configurable revenue splits (platform/creator/holders)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                    <span>Composable with DeFi protocols and integrations</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2 group">
                <div className="relative aspect-video bg-foreground/5 rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-xl">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="h-24 w-24 text-foreground/20 group-hover:text-foreground/30 transition-colors group-hover:scale-110 duration-300" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8 leading-tight">
              Built for Everyone
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              Whether you're a creator, investor, or builder, Promptbox offers clear value.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <Card className="p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-foreground/5 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-foreground" />
                </div>
                <h4 className="text-xl font-semibold">Creators</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  One-click agent deployment with clear economics, templates, and ongoing revenue share.
                </p>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-foreground/5 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-foreground" />
                </div>
                <h4 className="text-xl font-semibold">Investors</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Proof-of-demand gating, auditable revenue, and a concrete protocol with real upside.
                </p>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-foreground/5 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-foreground" />
                </div>
                <h4 className="text-xl font-semibold">Developers</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Composable primitives, open APIs, and verifiable on-chain rails for integrations.
                </p>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-foreground/5 rounded-lg flex items-center justify-center">
                  <Coins className="h-5 w-5 text-foreground" />
                </div>
                <h4 className="text-xl font-semibold">Users</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Transparent pricing, verifiable performance, and agents that work like micro-SaaS.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/30 py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8 leading-tight">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              A systematic approach to launching and scaling AI agents with verifiable economics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="space-y-4 group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="text-2xl font-semibold">Launch on Bonding Curve</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create your agent concept and launch on a transparent bonding curve. Early supporters 
                get better pricing and help prove demand.
              </p>
            </div>

            <div className="space-y-4 group hover:-translate-y-2 transition-transform duration-300" style={{ animationDelay: '100ms' }}>
              <div className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="text-2xl font-semibold">Graduate to DEX</h3>
              <p className="text-muted-foreground leading-relaxed">
                Once the threshold is reached, your agent graduates with automatic liquidity pool 
                creation on Uniswap V3. Fully liquid and tradeable.
              </p>
            </div>

            <div className="space-y-4 group hover:-translate-y-2 transition-transform duration-300" style={{ animationDelay: '200ms' }}>
              <div className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="text-2xl font-semibold">Generate & Share Revenue</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your agent generates verifiable revenue. Every action creates a cryptographic 
                receipt. Revenue splits automatically to all stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8 leading-tight">
              Frequently Asked Questions
            </h2>
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
      <section className="py-32 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-background rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-background rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight max-w-4xl mx-auto">
            Ready to Launch Your Agent?
          </h2>
          <p className="text-xl mb-12 opacity-80 max-w-2xl mx-auto font-light">
            Join the Agent Graduation Protocol. Prove demand, generate revenue, share success.
          </p>
          <Button size="lg" className="bg-background text-foreground hover:bg-background/90 hover:scale-105 transition-all duration-200 h-14 px-8 text-base" asChild>
            <Link to="/create">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>;
};
export default TokenAgents;