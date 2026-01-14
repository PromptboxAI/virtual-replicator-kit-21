import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Bot, Coins, TrendingUp, Users, Zap, CheckCircle2, Shield, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LogoMarquee } from "@/components/LogoMarquee";
import { FeatureToggle } from "@/components/FeatureToggle";
import { FeaturesSection } from "@/components/FeaturesSection";
import { IntegrationsSection } from "@/components/IntegrationsSection";
import { SecuritySection } from "@/components/SecuritySection";
import { FounderSection } from "@/components/FounderSection";
import baseLogo from "@/assets/base-logo.png";
import graduationProtocolImg from "@/assets/graduation-protocol.png";
import verifiableReceiptsImg from "@/assets/verifiable-receipts.png";
import tokenBoundAccountsImg from "@/assets/token-bound-accounts.png";
const TokenAgents = () => {
  return <div className="min-h-screen bg-background">
      <Header />
      

      <section className="container mx-auto px-4 py-6 md:py-12 md:pt-24">
        <div className="max-w-5xl mx-auto text-center space-y-4 md:space-y-8 animate-fade-in">
          <div className="mt-16 md:mt-0 space-y-3 md:space-y-6">
            <h1 className="text-[36px] md:text-6xl lg:text-7xl font-heading font-medium text-foreground leading-tight tracking-tight">
              Launch Tokenized<br />
              Agentic Workflow & Systems
            </h1>
            <p className="text-[15px] md:text-xl text-zinc-700 max-w-2xl mx-auto leading-relaxed">
              Promptbox lets you create, fund, and run tokenized AI agents with visual workflows, deep integrations, and on-chain rails - from a growing library of ready-to-launch templates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 h-12 px-8 text-base" asChild>
              <Link to="/create">
                Launch Your Agent
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="hidden sm:inline-flex h-12 px-8 text-base transition-all duration-200" asChild>
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

      {/* Features Section */}
      <FeaturesSection />


      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Security Section */}
      <SecuritySection />

      {/* Use Cases Section */}
      <section className="py-32 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <p className="text-sm font-mono text-muted-foreground mb-4 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
              AUDIENCE
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-foreground mb-4 tracking-tight">
              Built for Everyone
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you're a creator, investor or builder, Promptbox creates the rails for the tokenized agentic economy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Creators Card */}
            <Card className="relative p-8 min-h-[380px] hover:shadow-lg transition-all duration-300 overflow-hidden bg-[hsl(0_0%_97%)] dark:bg-[hsl(0_0%_12%)] border-border/30 rounded-2xl">
              <div className="relative z-10 flex flex-col h-full">
                <div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">Creators</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    One-click agent deployment with clear economics, templates, and ongoing revenue share.
                  </p>
                </div>
              </div>
              {/* Large watermark-style dotted pattern */}
              <div className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.07]">
                <div className="w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 2px)',
                  backgroundSize: '10px 10px'
                }} />
              </div>
              {/* Large icon */}
              <div className="absolute bottom-8 right-8">
                <Users className="h-14 w-14 text-foreground" strokeWidth={1.2} />
              </div>
            </Card>

            {/* Investors Card */}
            <Card className="relative p-8 min-h-[380px] hover:shadow-lg transition-all duration-300 overflow-hidden bg-[hsl(0_0%_97%)] dark:bg-[hsl(0_0%_12%)] border-border/30 rounded-2xl">
              <div className="relative z-10 flex flex-col h-full">
                <div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">Investors</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Proof-of-demand gating, auditable revenue, and a concrete protocol with real upside.
                  </p>
                </div>
              </div>
              {/* Large watermark-style dotted pattern */}
              <div className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.07]">
                <div className="w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 2px)',
                  backgroundSize: '10px 10px'
                }} />
              </div>
              {/* Large icon */}
              <div className="absolute bottom-8 right-8">
                <TrendingUp className="h-14 w-14 text-foreground" strokeWidth={1.2} />
              </div>
            </Card>

            {/* Developers Card */}
            <Card className="relative p-8 min-h-[380px] hover:shadow-lg transition-all duration-300 overflow-hidden bg-[hsl(0_0%_97%)] dark:bg-[hsl(0_0%_12%)] border-border/30 rounded-2xl">
              <div className="relative z-10 flex flex-col h-full">
                <div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">Developers</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Composable primitives, open APIs, and verifiable on-chain rails for integrations.
                  </p>
                </div>
              </div>
              {/* Large watermark-style dotted pattern */}
              <div className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.07]">
                <div className="w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 2px)',
                  backgroundSize: '10px 10px'
                }} />
              </div>
              {/* Large icon */}
              <div className="absolute bottom-8 right-8">
                <Bot className="h-14 w-14 text-foreground" strokeWidth={1.2} />
              </div>
            </Card>

            {/* Users Card */}
            <Card className="relative p-8 min-h-[380px] hover:shadow-lg transition-all duration-300 overflow-hidden bg-[hsl(0_0%_97%)] dark:bg-[hsl(0_0%_12%)] border-border/30 rounded-2xl">
              <div className="relative z-10 flex flex-col h-full">
                <div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">Users</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Access to AI agents curated by quality, with fair tokenomics and governed by the community.
                  </p>
                </div>
              </div>
              {/* Large watermark-style dotted pattern */}
              <div className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.07]">
                <div className="w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 2px)',
                  backgroundSize: '10px 10px'
                }} />
              </div>
              {/* Large icon */}
              <div className="absolute bottom-8 right-8">
                <Wallet className="h-14 w-14 text-foreground" strokeWidth={1.2} />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Features with Visuals */}
      <section className="py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <p className="text-sm font-mono text-muted-foreground mb-4 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
              PROTOCOL
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-foreground mb-4 tracking-tight">
              Built for Trust & Transparency
            </h2>
            <p className="text-lg text-muted-foreground">
              Every layer of Promptbox is designed for verifiability, from token economics to agent outputs.
            </p>
          </div>

          <div className="max-w-6xl mx-auto space-y-32">
            
            {/* Feature 1: Agent Graduation Protocol */}
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-6 order-2 md:order-1">
                <Badge variant="outline" className="mb-2 border-foreground/30">Graduation Protocol</Badge>
                <h3 className="text-3xl md:text-4xl font-heading font-medium text-foreground tracking-tight">
                  Proof of Demand Launch
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Every agent starts on a bonding curve. When 42,000 $PROMPT is raised, the agent graduates — 
                  deploying to Uniswap V2 with locked liquidity and unlocking full platform capabilities.
                </p>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Bonding curve pricing</strong> — transparent, predictable token economics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Auto DEX deployment</strong> — instant Uniswap V2 listing on graduation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">3-year LP lock</strong> — permanent liquidity, no rug pulls</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2 group">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-2xl shadow-lg">
                  <img 
                    src={graduationProtocolImg} 
                    alt="Agent Graduation Protocol - Bonding curve to DEX launch visualization" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Feature 2: Verifiable Output Receipts */}
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="group">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-2xl shadow-lg">
                  <img 
                    src={verifiableReceiptsImg} 
                    alt="Verifiable Output Receipts - Merkle tree verification system" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <Badge variant="outline" className="mb-2 border-foreground/30">Output Verification</Badge>
                <h3 className="text-3xl md:text-4xl font-heading font-medium text-foreground tracking-tight">
                  Cryptographic Receipts
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Every agent action generates a signed receipt. Receipts are batched into Merkle trees 
                  with roots anchored on-chain — making all revenue and usage fully auditable.
                </p>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Signed receipts</strong> — cryptographic proof for every inference</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Merkle batching</strong> — efficient on-chain verification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">VorLedger anchoring</strong> — tamper-evident usage logs</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Token-Bound Agent Accounts */}
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-6 order-2 md:order-1">
                <Badge variant="outline" className="mb-2 border-foreground/30">Agent Economics</Badge>
                <h3 className="text-3xl md:text-4xl font-heading font-medium text-foreground tracking-tight">
                  Token-Bound Accounts
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Each agent is linked to an on-chain controller that defines ownership, permissions, 
                  and revenue splits. Agents become composable economic primitives in DeFi.
                </p>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Wallet className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">On-chain registry</strong> — verifiable ownership and policies</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Wallet className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">5% trading fee</strong> — split 50/50 between creator and platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Wallet className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">DeFi composable</strong> — integrate with protocols and wallets</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2 group">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-2xl shadow-lg">
                  <img 
                    src={tokenBoundAccountsImg} 
                    alt="Token-Bound Agent Accounts - Revenue split visualization" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
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

      {/* Founder Section */}
      <FounderSection />

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
                asChild
              >
                <Link to="/contact">
                  Talk to Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default TokenAgents;