import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Bot, Briefcase, Check, Code, ExternalLink, FileText, Globe, MessageSquare, Phone, Search, ShoppingCart, Users, Zap } from "lucide-react";

const agentData: Record<string, {
  name: string;
  category: string;
  tagline: string;
  description: string;
  targetAudience: string;
  useCases: string[];
  strengths: string[];
  pricing: string;
  icon: any;
  color: string;
  website?: string;
}> = {
  "lindy-ai": {
    name: "Lindy AI",
    category: "No-Code Agent Builder",
    tagline: "Build AI agents by describing tasks in English",
    description: "A no-code platform that lets you build AI agents by describing tasks in English, with a drag-and-drop interface. Lindy allows you to create AI-employees in minutes and add components with typical tasks such as phone calls, emails, or calendar management. The platform offers access to a template marketplace where you can select pre-built agents for common tasks.",
    targetAudience: "Small businesses and non-technical teams who want automation without complexity",
    useCases: ["Workflow automation", "Customer service", "Lead generation", "Meeting scheduling", "Lead nurturing"],
    strengths: [
      "Beginner-friendly setup",
      "Strong customer service automation capabilities",
      "Over 100 native integrations including CRMs, email platforms, and calendars",
      "Template marketplace for pre-built agents"
    ],
    pricing: "Starting at $50/month for 5,000 credits, with a free tier offering 400 credits per month",
    icon: Bot,
    color: "from-violet-500 to-purple-600",
    website: "https://www.lindy.ai/"
  },
  "relevance-ai": {
    name: "Relevance AI",
    category: "Multi-Agent Platform",
    tagline: "Teams of specialized AI agents collaborating on complex workflows",
    description: "A multi-agent platform where teams of specialized AI agents collaborate on complex workflows, applying advanced chain-of-thought reasoning. Unlike single-agent platforms, Relevance AI deploys multiple agents that work together - think of it as hiring an entire AI department rather than just one assistant. The platform includes agent-to-agent communication protocols and dynamic task allocation.",
    targetAudience: "Enterprise teams handling complex business processes",
    useCases: ["Multi-agent workflows", "Business process automation", "Research pipelines", "Content generation workflows", "Multi-stage sales processes"],
    strengths: [
      "Superior multi-agent coordination",
      "Enterprise-grade security with SOC2 compliance",
      "Comprehensive analytics to monitor AI team performance",
      "Agent-to-agent communication protocols"
    ],
    pricing: "Starting at $19/month for 10,000 credits, with enterprise plans for custom pricing",
    icon: Users,
    color: "from-blue-500 to-cyan-600",
    website: "https://relevanceai.com/"
  },
  "harvey-ai": {
    name: "Harvey AI",
    category: "Legal AI Agents",
    tagline: "Legal-specific AI designed exclusively for law firms",
    description: "Legal-specific AI agents designed exclusively for law firms, with built-in understanding of legal processes and jurisdiction variations. Unlike general-purpose platforms, Harvey is specifically designed for legal tasks. It understands attorney-client privilege, ensures compliance across different jurisdictions, and integrates directly into legal practice management systems.",
    targetAudience: "Law firms and corporate legal departments",
    useCases: ["Contract review", "Legal research", "Due diligence", "Compliance monitoring", "Document analysis"],
    strengths: [
      "In-depth legal expertise that generic AI agents can't match",
      "Regulatory compliance integrated into every workflow",
      "Proven ROI at large firms like Allen & Overy and PwC",
      "Jurisdiction-aware processing"
    ],
    pricing: "Enterprise-only with custom pricing",
    icon: FileText,
    color: "from-amber-500 to-orange-600",
    website: "https://www.harvey.ai/"
  },
  "clay": {
    name: "Clay",
    category: "Sales Enrichment",
    tagline: "AI agents autonomously research prospects from 50+ sources",
    description: "Sales intelligence platform where AI agents autonomously research prospects and enrich data by combining information from 50+ sources. Its 'waterfall enrichment' feature automatically tries multiple data sources until it finds the information you need and can perform complex web searches that go far beyond what CRM-integrated tools offer.",
    targetAudience: "Sales teams and revenue operations",
    useCases: ["Sales prospecting", "Data enrichment", "Outreach personalization", "Account-based marketing", "Prospect research"],
    strengths: [
      "Exceptional data quality with comprehensive prospect profiles",
      "AI-powered personalization at scale",
      "Waterfall enrichment from 50+ data sources",
      "Complex web search capabilities"
    ],
    pricing: "Starting at $149/month for 2,000 credits, with usage-based pricing",
    icon: Search,
    color: "from-emerald-500 to-teal-600",
    website: "https://www.clay.com/"
  },
  "hubspot-breeze": {
    name: "HubSpot Breeze",
    category: "CRM AI Agents",
    tagline: "AI agents living directly inside HubSpot",
    description: "CRM-integrated AI agents that work natively within HubSpot's ecosystem, covering prospecting, customer service, content creation, and social media management. Unlike standalone platforms which require separate integrations, Breeze agents live directly inside HubSpot. You get multiple specialized agents all sharing the same customer data.",
    targetAudience: "HubSpot customers",
    useCases: ["Marketing automation", "Sales automation", "Customer service automation", "Content creation", "Social media management"],
    strengths: [
      "Zero learning curve for existing HubSpot users",
      "Seamless data flow across all agents",
      "Enterprise-grade reliability matching HubSpot's infrastructure",
      "Multiple specialized agents sharing customer data"
    ],
    pricing: "Uses HubSpot Credits included in seat-based tiers. Additional packs from $10/mo for 1000 credits",
    icon: Briefcase,
    color: "from-orange-500 to-red-600",
    website: "https://www.hubspot.com/products/artificial-intelligence"
  },
  "salescloser-ai": {
    name: "SalesCloser AI",
    category: "Sales Automation",
    tagline: "Complete sales conversations handled autonomously",
    description: "Conversational AI that handles complete sales conversations autonomously across email, chat, SMS, and phone channels. It can qualify leads through natural dialogue, handle objections, and book appointments - essentially replacing your SDR team rather than just supporting it.",
    targetAudience: "SMBs and lead generation companies",
    useCases: ["Automated sales conversations", "Lead qualification", "Appointment booking", "Objection handling", "Multi-channel outreach"],
    strengths: [
      "30-40% improvement in lead qualification",
      "Natural conversation flow that doesn't feel robotic",
      "24/7 availability that never misses a hot lead",
      "Multi-channel support (email, chat, SMS, phone)"
    ],
    pricing: "Available upon request",
    icon: ShoppingCart,
    color: "from-pink-500 to-rose-600",
    website: "https://salescloser.ai/"
  },
  "vapi": {
    name: "VAPI",
    category: "Voice AI Infrastructure",
    tagline: "Voice AI with sub-500ms response times",
    description: "Voice AI infrastructure platform that provides the building blocks for creating conversational voice applications with a response time of less than 500ms. It's purely infrastructure - think of it as the voice equivalent of workflow automation. It offers real-time webhook integration during actual calls, perfect for building custom voice agents.",
    targetAudience: "Developers and businesses building voice-enabled applications",
    useCases: ["Voice AI applications", "Phone automation", "Conversational interfaces", "Customer service phone systems", "Accessibility applications"],
    strengths: [
      "Extremely low-latency speech processing (<500ms)",
      "Extensive customization options for brand-specific voice experiences",
      "Direct telephony integration for complex phone systems",
      "Real-time webhook integration during calls"
    ],
    pricing: "Usage-based between $0.05-0.20 per minute depending on the model",
    icon: Phone,
    color: "from-indigo-500 to-blue-600",
    website: "https://vapi.ai/"
  },
  "box-ai-agents": {
    name: "Box AI Agents",
    category: "Document AI",
    tagline: "AI for enterprise document management",
    description: "AI for enterprise document management that provides intelligent search, automatic classification, and workflow automation across organizational content. These agents specialize entirely in document intelligence within enterprise environments, understanding document hierarchies, compliance requirements, and can automatically enforce retention policies.",
    targetAudience: "Large organizations with complex document workflows",
    useCases: ["Document analysis", "Content management", "Enterprise search", "Contract lifecycle management", "Regulatory reporting"],
    strengths: [
      "Deep integration with Box's content management ecosystem",
      "Enterprise-grade security",
      "Advanced document understanding beyond simple text extraction",
      "Automatic compliance and retention policy enforcement"
    ],
    pricing: "Included with Box Enterprise Plus/Advanced plans, with additional AI units for high volume",
    icon: FileText,
    color: "from-sky-500 to-blue-600",
    website: "https://www.box.com/ai"
  },
  "browserbase-director": {
    name: "Browserbase Director",
    category: "Browser Automation",
    tagline: "LLM-powered browser automation from natural language",
    description: "An LLM-powered browser automation platform that generates reproducible scripts from natural language instructions and is built on scalable cloud infrastructure. Unlike traditional browser automation which requires coding skills, Director lets you describe what you want and generates reusable scripts.",
    targetAudience: "Developers and automation engineers",
    useCases: ["Web scraping", "Browser automation", "Automated testing", "Data extraction", "Workflow automation"],
    strengths: [
      "Advanced anti-detection capabilities that bypass bot protection",
      "Reliable scaling across thousands of browser sessions",
      "Turn one-time automations into repeatable workflows",
      "Natural language to script generation"
    ],
    pricing: "Free to create automations, execution from $20/month for Developer Plan",
    icon: Globe,
    color: "from-slate-500 to-gray-600",
    website: "https://www.director.ai/"
  },
  "legacy-use": {
    name: "Legacy-use",
    category: "Legacy System Integration",
    tagline: "REST APIs for legacy systems without code changes",
    description: "An open-source tool that automatically creates REST APIs for legacy systems without requiring changes to existing applications. It uses multimodal LLMs to understand legacy interfaces and automatically generate API endpoints, making it possible to include old Windows software in your automation pipelines.",
    targetAudience: "Enterprise IT teams and system integrators",
    useCases: ["Legacy system API modernization", "ERP integration", "Windows app automation", "System integration"],
    strengths: [
      "No code changes to existing legacy systems required",
      "AI-driven automation that reduces manual configurations",
      "Cost-effective approach to modernization",
      "Multimodal LLM understanding of legacy interfaces"
    ],
    pricing: "Open-source with free community edition, commercial support available",
    icon: Zap,
    color: "from-yellow-500 to-amber-600",
    website: "https://github.com/legacy-use/legacy-use"
  },
  "droidrun": {
    name: "Droidrun",
    category: "Mobile Automation",
    tagline: "LLM-driven automation of Android devices",
    description: "Open-source framework that enables LLM-driven automation of Android devices. It can control both physical and virtual Android devices using computer vision and natural language processing - essentially giving you an AI assistant that can navigate mobile apps just like a human.",
    targetAudience: "Mobile developers and QA engineers",
    useCases: ["Android device automation", "Mobile testing", "User behavior simulation", "Accessibility testing", "App automation"],
    strengths: [
      "Native mobile automation that works with any Android app",
      "LLM-powered intelligent interactions that adapt to UI changes",
      "Support for both testing scenarios and production use cases",
      "Computer vision and NLP capabilities"
    ],
    pricing: "Open-source and free, with upcoming cloud platform options",
    icon: Bot,
    color: "from-green-500 to-emerald-600",
    website: "https://github.com/droidrun/droidrun"
  },
  "claude-code": {
    name: "Claude Code",
    category: "Coding Assistant",
    tagline: "Anthropic's autonomous coding agent",
    description: "Anthropic's official autonomous coding agent that handles complete feature development from natural language descriptions, with built-in CI/CD automation via GitHub Actions. Compared to alternatives, Claude Code enables more autonomous operation - requiring less manual oversight when handling multi-step development tasks from planning to deployment.",
    targetAudience: "Software developers and teams",
    useCases: ["Autonomous coding", "Code review", "Development automation", "Feature development", "Test creation", "Code refactoring"],
    strengths: [
      "High-quality code generation with documentation",
      "Reasoning capabilities for complex development tasks",
      "GitHub Actions integration for CI/CD automation",
      "Less manual oversight for multi-step development"
    ],
    pricing: "Included in Claude Pro ($20/month) or Teams ($25/month), also available via API",
    icon: Code,
    color: "from-purple-500 to-violet-600",
    website: "https://www.anthropic.com/claude-code"
  },
};

const AIAgentDetail = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const agent = agentId ? agentData[agentId] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [agentId]);

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Agent not found</h1>
            <Link to="/platform/ai-agents">
              <Button>Back to AI Agents</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const IconComponent = agent.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{agent.name} | AI Agents | Promptbox</title>
        <meta name="description" content={agent.description} />
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-6">
          <Link to="/platform/ai-agents" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to AI Agents
          </Link>
        </div>

        {/* Hero Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-6 mb-8">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${agent.color} text-white shrink-0`}>
                  <IconComponent className="w-10 h-10" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-3">
                    {agent.category}
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    {agent.name}
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    {agent.tagline}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {agent.website && (
                  <Button size="lg" className="gap-2" asChild>
                    <a href={agent.website} target="_blank" rel="noopener noreferrer">
                      Visit Website <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Button size="lg" variant="outline">
                  Try Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto grid gap-8">
              {/* Description */}
              <Card className="p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {agent.description}
                </p>
              </Card>

              {/* Use Cases */}
              <Card className="p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-4">Use Cases</h2>
                <div className="flex flex-wrap gap-2">
                  {agent.useCases.map((useCase) => (
                    <Badge key={useCase} variant="outline" className="px-3 py-1">
                      {useCase}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Strengths */}
              <Card className="p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-4">Key Strengths</h2>
                <ul className="space-y-3">
                  {agent.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{strength}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Target Audience & Pricing */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Target Audience</h3>
                  <p className="text-muted-foreground">{agent.targetAudience}</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Pricing</h3>
                  <p className="text-muted-foreground">{agent.pricing}</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">
                Ready to Get Started with {agent.name}?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Explore how this AI agent can transform your workflows and boost productivity.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {agent.website && (
                  <Button size="lg" className="gap-2" asChild>
                    <a href={agent.website} target="_blank" rel="noopener noreferrer">
                      Get Started <ArrowRight className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Button size="lg" variant="outline" asChild>
                  <Link to="/platform/ai-agents">
                    Explore Other Agents
                  </Link>
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

export default AIAgentDetail;
