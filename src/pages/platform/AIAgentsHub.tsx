import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Briefcase, Code, FileText, Globe, MessageSquare, Phone, Search, ShoppingCart, Users, Zap, CheckCircle2, Cpu, Workflow, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const agents = [
  {
    id: "lindy-ai",
    name: "Lindy AI",
    category: "No-Code Agent Builder",
    description: "Build AI agents by describing tasks in English with a drag-and-drop interface. Create AI-employees in minutes with pre-built templates.",
    targetAudience: "Business users",
    useCases: ["Workflow automation", "Customer service", "Lead generation"],
    icon: Bot,
  },
  {
    id: "relevance-ai",
    name: "Relevance AI",
    category: "Multi-Agent Platform",
    description: "Deploy multiple specialized AI agents that collaborate on complex workflows using advanced chain-of-thought reasoning.",
    targetAudience: "Enterprise teams",
    useCases: ["Multi-agent workflows", "Business process automation"],
    icon: Users,
  },
  {
    id: "harvey-ai",
    name: "Harvey AI",
    category: "Legal AI Agents",
    description: "Legal-specific AI agents designed exclusively for law firms with built-in understanding of legal processes and jurisdiction variations.",
    targetAudience: "Legal professionals",
    useCases: ["Document review", "Contract analysis", "Compliance"],
    icon: FileText,
  },
  {
    id: "clay",
    name: "Clay",
    category: "Sales Enrichment",
    description: "AI agents autonomously research prospects and enrich data by combining information from 50+ sources with waterfall enrichment.",
    targetAudience: "Sales teams",
    useCases: ["Sales prospecting", "Data enrichment", "Outreach personalization"],
    icon: Search,
  },
  {
    id: "hubspot-breeze",
    name: "HubSpot Breeze",
    category: "CRM AI Agents",
    description: "CRM-integrated AI agents that work natively within HubSpot's ecosystem for prospecting, customer service, and content creation.",
    targetAudience: "HubSpot users",
    useCases: ["Marketing automation", "Sales automation", "Customer service"],
    icon: Briefcase,
  },
  {
    id: "salescloser-ai",
    name: "SalesCloser AI",
    category: "Sales Automation",
    description: "Conversational AI handling complete sales conversations autonomously across email, chat, SMS, and phone channels.",
    targetAudience: "Sales teams",
    useCases: ["Automated sales conversations", "Lead qualification"],
    icon: ShoppingCart,
  },
  {
    id: "vapi",
    name: "VAPI",
    category: "Voice AI Infrastructure",
    description: "Voice AI platform providing building blocks for conversational voice applications with sub-500ms response times.",
    targetAudience: "Developers",
    useCases: ["Voice AI applications", "Phone automation", "Conversational interfaces"],
    icon: Phone,
  },
  {
    id: "box-ai-agents",
    name: "Box AI Agents",
    category: "Document AI",
    description: "AI for enterprise document management providing intelligent search, automatic classification, and workflow automation.",
    targetAudience: "Enterprise document management",
    useCases: ["Document analysis", "Content management", "Enterprise search"],
    icon: FileText,
  },
  {
    id: "browserbase-director",
    name: "Browserbase Director",
    category: "Browser Automation",
    description: "LLM-powered browser automation platform generating reproducible scripts from natural language instructions.",
    targetAudience: "Developers & automation teams",
    useCases: ["Web scraping", "Browser automation", "Testing"],
    icon: Globe,
  },
  {
    id: "legacy-use",
    name: "Legacy-use",
    category: "Legacy System Integration",
    description: "Open-source tool automatically creating REST APIs for legacy systems without requiring changes to existing applications.",
    targetAudience: "Enterprise IT",
    useCases: ["Legacy system API modernization"],
    icon: Zap,
  },
  {
    id: "droidrun",
    name: "Droidrun",
    category: "Mobile Automation",
    description: "Open-source framework enabling LLM-driven automation of Android devices with computer vision and NLP.",
    targetAudience: "Mobile app developers",
    useCases: ["Android device automation", "Mobile testing"],
    icon: Bot,
  },
  {
    id: "claude-code",
    name: "Claude Code",
    category: "Coding Assistant",
    description: "Anthropic's autonomous coding agent handling complete feature development from natural language with CI/CD automation.",
    targetAudience: "Software developers",
    useCases: ["Autonomous coding", "Code review", "Development automation"],
    icon: Code,
  },
];

const capabilities = [
  {
    icon: Cpu,
    title: "Autonomous Operation",
    description: "AI agents that work independently, making decisions and taking actions without constant human oversight.",
  },
  {
    icon: Workflow,
    title: "Multi-Step Workflows",
    description: "Chain complex tasks together with intelligent handoffs between different specialized agents.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant infrastructure with role-based access control and audit logging.",
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description: "Sub-500ms response times with streaming outputs for immediate feedback.",
  },
];

const useCaseCategories = [
  {
    title: "Extract insights from documents",
    description: "Automatically analyze contracts, reports, and legal documents to surface key information.",
  },
  {
    title: "Automate customer interactions",
    description: "Handle support tickets, qualify leads, and manage conversations across channels.",
  },
  {
    title: "Streamline sales workflows",
    description: "Research prospects, enrich data, and personalize outreach at scale.",
  },
];

const AIAgentsHub = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>AI Agents Platform | Promptbox</title>
        <meta name="description" content="Discover the 12 best autonomous AI agents of 2025. From no-code builders to enterprise solutions, find the perfect AI agent for your business needs." />
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* Hero Section - Clean, minimal like Stack AI */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-sm font-mono text-muted-foreground mb-6 tracking-wider uppercase">
                Tokenized Production-Grade AI Agent Platform
              </p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight">
                Transform Your Operations with AI Agents
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Automate routine processes and ensure compliance across your organization with AI agents that extract data, retrieve critical knowledge, and generate audit-ready documentation.
              </p>
              <Button size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90 px-8 py-6 text-base">
                Get a Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Use Case Tabs Section */}
        <section className="py-16 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {useCaseCategories.map((useCase, index) => (
                <div 
                  key={index} 
                  className={`p-6 rounded-lg border border-border bg-background hover:border-foreground/30 transition-colors cursor-pointer ${index === 0 ? 'border-foreground/50' : ''}`}
                >
                  <h3 className="font-semibold text-foreground mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Built for Volume
              </h2>
              <p className="text-lg text-muted-foreground">
                Our AI agents are designed to handle complex workflows with reliability and security.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {capabilities.map((capability, index) => {
                const IconComponent = capability.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{capability.title}</h3>
                    <p className="text-sm text-muted-foreground">{capability.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Agents Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Explore Our AI Agents
              </h2>
              <p className="text-lg text-muted-foreground">
                Each agent is designed for specific use cases, from legal document review to autonomous coding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const IconComponent = agent.icon;
                return (
                  <Link key={agent.id} to={`/platform/ai-agents/${agent.id}`}>
                    <Card className="group p-6 h-full bg-background border-border hover:border-foreground/30 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-muted">
                          <IconComponent className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {agent.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {agent.category}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {agent.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {agent.useCases.slice(0, 2).map((useCase) => (
                          <Badge key={useCase} variant="secondary" className="text-xs font-normal">
                            {useCase}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          For {agent.targetAudience}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features List Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                  Why Choose Our Platform
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Our AI agent platform provides everything you need to build, deploy, and manage autonomous workflows at scale.
                </p>
                <ul className="space-y-4">
                  {[
                    "No-code agent builder with pre-built templates",
                    "Multi-agent collaboration for complex workflows",
                    "Real-time monitoring and analytics dashboard",
                    "Enterprise-grade security and compliance",
                    "Seamless integration with existing tools",
                    "24/7 autonomous operation with human oversight"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border border-border">
                <div className="text-center p-8">
                  <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Platform Demo</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Black background with dots */}
        <section className="py-20 bg-foreground relative overflow-hidden">
          {/* Semi-transparent dots pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-background">
                Ready to Build Your AI Agent?
              </h2>
              <p className="text-lg text-background/70 mb-8">
                Start with our platform to create custom autonomous workflows where you control exactly how much independence you want to grant your AI agents.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" variant="secondary" className="gap-2 bg-background text-foreground hover:bg-background/90 px-8">
                  Start Building <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10 px-8">
                  Talk to Sales
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AIAgentsHub;