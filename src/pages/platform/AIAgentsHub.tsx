import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Briefcase, Code, FileText, Globe, MessageSquare, Phone, Search, ShoppingCart, Users, Zap } from "lucide-react";
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
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "relevance-ai",
    name: "Relevance AI",
    category: "Multi-Agent Platform",
    description: "Deploy multiple specialized AI agents that collaborate on complex workflows using advanced chain-of-thought reasoning.",
    targetAudience: "Enterprise teams",
    useCases: ["Multi-agent workflows", "Business process automation"],
    icon: Users,
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "harvey-ai",
    name: "Harvey AI",
    category: "Legal AI Agents",
    description: "Legal-specific AI agents designed exclusively for law firms with built-in understanding of legal processes and jurisdiction variations.",
    targetAudience: "Legal professionals",
    useCases: ["Document review", "Contract analysis", "Compliance"],
    icon: FileText,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "clay",
    name: "Clay",
    category: "Sales Enrichment",
    description: "AI agents autonomously research prospects and enrich data by combining information from 50+ sources with waterfall enrichment.",
    targetAudience: "Sales teams",
    useCases: ["Sales prospecting", "Data enrichment", "Outreach personalization"],
    icon: Search,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "hubspot-breeze",
    name: "HubSpot Breeze",
    category: "CRM AI Agents",
    description: "CRM-integrated AI agents that work natively within HubSpot's ecosystem for prospecting, customer service, and content creation.",
    targetAudience: "HubSpot users",
    useCases: ["Marketing automation", "Sales automation", "Customer service"],
    icon: Briefcase,
    color: "from-orange-500 to-red-600",
  },
  {
    id: "salescloser-ai",
    name: "SalesCloser AI",
    category: "Sales Automation",
    description: "Conversational AI handling complete sales conversations autonomously across email, chat, SMS, and phone channels.",
    targetAudience: "Sales teams",
    useCases: ["Automated sales conversations", "Lead qualification"],
    icon: ShoppingCart,
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "vapi",
    name: "VAPI",
    category: "Voice AI Infrastructure",
    description: "Voice AI platform providing building blocks for conversational voice applications with sub-500ms response times.",
    targetAudience: "Developers",
    useCases: ["Voice AI applications", "Phone automation", "Conversational interfaces"],
    icon: Phone,
    color: "from-indigo-500 to-blue-600",
  },
  {
    id: "box-ai-agents",
    name: "Box AI Agents",
    category: "Document AI",
    description: "AI for enterprise document management providing intelligent search, automatic classification, and workflow automation.",
    targetAudience: "Enterprise document management",
    useCases: ["Document analysis", "Content management", "Enterprise search"],
    icon: FileText,
    color: "from-sky-500 to-blue-600",
  },
  {
    id: "browserbase-director",
    name: "Browserbase Director",
    category: "Browser Automation",
    description: "LLM-powered browser automation platform generating reproducible scripts from natural language instructions.",
    targetAudience: "Developers & automation teams",
    useCases: ["Web scraping", "Browser automation", "Testing"],
    icon: Globe,
    color: "from-slate-500 to-gray-600",
  },
  {
    id: "legacy-use",
    name: "Legacy-use",
    category: "Legacy System Integration",
    description: "Open-source tool automatically creating REST APIs for legacy systems without requiring changes to existing applications.",
    targetAudience: "Enterprise IT",
    useCases: ["Legacy system API modernization"],
    icon: Zap,
    color: "from-yellow-500 to-amber-600",
  },
  {
    id: "droidrun",
    name: "Droidrun",
    category: "Mobile Automation",
    description: "Open-source framework enabling LLM-driven automation of Android devices with computer vision and NLP.",
    targetAudience: "Mobile app developers",
    useCases: ["Android device automation", "Mobile testing"],
    icon: Bot,
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    category: "Coding Assistant",
    description: "Anthropic's autonomous coding agent handling complete feature development from natural language with CI/CD automation.",
    targetAudience: "Software developers",
    useCases: ["Autonomous coding", "Code review", "Development automation"],
    icon: Code,
    color: "from-purple-500 to-violet-600",
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
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/30 bg-primary/5">
                AI Agents Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                12 Best Autonomous AI Agents
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                From simple no-code builders to sophisticated systems that operate independently. 
                Find the perfect AI agent for your business needs.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline">
                  View Documentation
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">12</div>
                <div className="text-sm text-muted-foreground">AI Agents</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">100+</div>
                <div className="text-sm text-muted-foreground">Integrations</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">500ms</div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Availability</div>
              </div>
            </div>
          </div>
        </section>

        {/* Agents Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Explore Our AI Agents
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Each agent is designed for specific use cases, from legal document review to autonomous coding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const IconComponent = agent.icon;
                return (
                  <Link key={agent.id} to={`/platform/ai-agents/${agent.id}`}>
                    <Card className="group p-6 h-full hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${agent.color} text-white`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                            {agent.name}
                          </h3>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {agent.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {agent.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {agent.useCases.slice(0, 2).map((useCase) => (
                          <Badge key={useCase} variant="outline" className="text-xs">
                            {useCase}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                          For {agent.targetAudience}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Build Your AI Agent?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start with our platform to create custom autonomous workflows where you control exactly how much independence you want to grant your AI agents.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="gap-2">
                  Start Building <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline">
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
