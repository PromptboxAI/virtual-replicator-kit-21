import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Bot, Coins, TrendingUp, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LogoMarquee } from "@/components/LogoMarquee";
import { FeatureToggle } from "@/components/FeatureToggle";
import { IntegrationsSection } from "@/components/IntegrationsSection";
import baseLogo from "@/assets/base-logo.png";
const TokenAgents = () => {
  return <div className="min-h-screen bg-background">
      <Header />
      

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-6 md:py-12 md:pt-24">
        <div className="max-w-5xl mx-auto text-center space-y-4 md:space-y-8 animate-fade-in">
          <div className="space-y-3 md:space-y-6">
            <h1 className="text-[30px] md:text-6xl lg:text-7xl font-heading font-medium text-foreground leading-tight tracking-tight">
              Launch Tokenized<br className="md:hidden" /> AI Agents as a<br className="md:hidden" /> Micro-SaaS Business<span className="hidden md:inline">.</span>
            </h1>
            <p className="text-[15px] md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Promptbox lets you create, fund and track AI agents with built-in tokenomics, dashboards, and on-chain rails from 100's of templates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all duration-200 h-14 px-8 text-base" asChild>
              <Link to="/create">
                Launch Your Agent
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="hidden sm:inline-flex h-14 px-8 text-base hover:scale-105 transition-all duration-200" asChild>
              <Link to="/learn">
                Learn More
              </Link>
            </Button>
          </div>

        </div>
      </section>

      {/* Feature Toggle Section */}
      <FeatureToggle />

      {/* Built on Badge */}
      <section className="pb-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mb-4">
            Built on <img src={baseLogo} alt="Base" className="h-4 w-4 inline-block" /> • Powered by:
          </p>
          <LogoMarquee />
        </div>
      </section>

      {/* Core Protocol Features */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-24">
            <p className="text-sm font-mono text-muted-foreground mb-4 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
              PROTOCOL
            </p>
            <h2 className="text-3xl md:text-4xl font-heading font-medium text-foreground mb-4 tracking-tight">
              Proof of Demand Meets Verifiable Revenue
            </h2>
            <p className="text-lg text-muted-foreground">
              Every agent must prove real demand before graduation. Every revenue event is cryptographically 
              verified and transparently shared with creators, platform, and token holders.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-10 border-border/50 hover:border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center mb-6">
                <Coins className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Bonding Curve Launch</h3>
              <p className="text-sm text-muted-foreground">
                Agents launch via transparent bonding curves. Only those reaching the graduation threshold unlock full capabilities and DEX liquidity.
              </p>
            </Card>

            <Card className="p-10 border-border/50 hover:border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center mb-6">
                <Bot className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Verifiable Receipts</h3>
              <p className="text-sm text-muted-foreground">
                Every agent action generates cryptographic receipts. Revenue and usage are auditable, tamper-evident, and anchored on-chain.
              </p>
            </Card>

            <Card className="p-10 border-border/50 hover:border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-foreground/5 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Revenue Sharing</h3>
              <p className="text-sm text-muted-foreground">
                Revenue automatically splits between platform, creator, and token holders according to on-chain policies. No trust required.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Platform Features with Visuals */}
      <section className="py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-32">
            
            {/* Feature 1: Agent Graduation Protocol */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6 order-2 md:order-1">
                <Badge className="mb-2">Agent Graduation Protocol</Badge>
                <h3 className="text-3xl md:text-4xl font-heading font-medium text-foreground tracking-tight">
                  Launch with Proof of Demand
                </h3>
                <p className="text-lg text-muted-foreground">
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
                <h3 className="text-3xl md:text-4xl font-heading font-medium text-foreground tracking-tight">
                  Cryptographically Auditable
                </h3>
                <p className="text-lg text-muted-foreground">
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
                <h3 className="text-3xl md:text-4xl font-heading font-medium text-foreground tracking-tight">
                  Agents as Economic Objects
                </h3>
                <p className="text-lg text-muted-foreground">
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
            <p className="text-sm font-mono text-muted-foreground mb-4 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
              AUDIENCE
            </p>
            <h2 className="text-3xl md:text-4xl font-heading font-medium text-foreground mb-4 tracking-tight">
              Built for Everyone
            </h2>
            <p className="text-lg text-muted-foreground">
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
            <p className="text-sm font-mono text-muted-foreground mb-4 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
              PROCESS
            </p>
            <h2 className="text-3xl md:text-4xl font-heading font-medium text-foreground mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              A systematic approach to launching and scaling AI agents with verifiable economics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="space-y-4 group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="font-semibold text-foreground">Launch on Bonding Curve</h3>
              <p className="text-sm text-muted-foreground">
                Create your agent concept and launch on a transparent bonding curve. Early supporters get better pricing and help prove demand.
              </p>
            </div>

            <div className="space-y-4 group hover:-translate-y-2 transition-transform duration-300" style={{ animationDelay: '100ms' }}>
              <div className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="font-semibold text-foreground">Graduate to DEX</h3>
              <p className="text-sm text-muted-foreground">
                Once the threshold is reached, your agent graduates with automatic liquidity pool creation on Uniswap V3. Fully liquid and tradeable.
              </p>
            </div>

            <div className="space-y-4 group hover:-translate-y-2 transition-transform duration-300" style={{ animationDelay: '200ms' }}>
              <div className="w-14 h-14 bg-foreground text-background rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="font-semibold text-foreground">Generate & Share Revenue</h3>
              <p className="text-sm text-muted-foreground">
                Your agent generates verifiable revenue. Every action creates a cryptographic receipt. Revenue splits automatically to all stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <p className="text-sm font-mono text-muted-foreground mb-4 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-heading font-medium text-foreground mb-4 tracking-tight">
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

      {/* CTA Section - Black background with micro dots */}
      <section className="py-20 bg-foreground relative overflow-hidden">
        {/* Dense primary dot grid */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--background) / 0.08) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />
        {/* Medium density layer */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--background) / 0.05) 0.8px, transparent 0.8px)',
            backgroundSize: '12px 12px',
          }}
        />
        {/* Sparse larger dots for depth variation */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--background) / 0.03) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-medium mb-6 text-background tracking-tight">
              Ready to Build Your AI Agent?
            </h2>
            <p className="text-lg text-background/70 mb-8">
              Start with our platform to create custom autonomous workflows where you control exactly how much independence you want to grant your AI agents.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                className="gap-2 bg-background text-foreground hover:bg-background/90 px-8 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                asChild
              >
                <Link to="/create">
                  Start Building
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-background bg-foreground text-background hover:bg-foreground/90 px-8 transition-all duration-300 hover:scale-105"
              >
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default TokenAgents;