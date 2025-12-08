import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Briefcase, Code, FileText, Globe, MessageSquare, Phone, Search, ShoppingCart, Users, Zap, CheckCircle2, Cpu, Workflow, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";

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

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const AIAgentsHub = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>AI Agents Platform | Promptbox</title>
        <meta name="description" content="Discover the 12 best autonomous AI agents of 2025. From no-code builders to enterprise solutions, find the perfect AI agent for your business needs." />
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* Hero Section - Clean, minimal like Stack AI */}
        <section className="py-20 md:py-32 bg-background overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-sm font-mono text-muted-foreground mb-6 tracking-wider uppercase">
                Tokenized Production-Grade AI Agent Platform
              </p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-medium mb-6 text-foreground leading-tight tracking-tight">
                Transform Your Operations with AI Agents
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Automate routine processes and ensure compliance across your organization with AI agents that extract data, retrieve critical knowledge, and generate audit-ready documentation.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Button 
                  size="lg" 
                  className="gap-2 bg-foreground text-background hover:bg-foreground/90 px-8 py-6 text-base transition-all duration-300 hover:shadow-lg"
                >
                  Get a Demo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Case Tabs Section */}
        <section className="py-16 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {useCaseCategories.map((useCase, index) => (
                <motion.div 
                  key={index} 
                  className={`p-6 rounded-lg border border-border bg-background hover:border-foreground/30 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-1 ${index === 0 ? 'border-foreground/50' : ''}`}
                  variants={scaleIn}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="font-semibold text-foreground mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <AnimatedSection className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-medium mb-4 text-foreground tracking-tight">
                Built for Volume
              </h2>
              <p className="text-lg text-muted-foreground">
                Our AI agents are designed to handle complex workflows with reliability and security.
              </p>
            </AnimatedSection>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {capabilities.map((capability, index) => {
                const IconComponent = capability.icon;
                return (
                  <motion.div 
                    key={index} 
                    className="text-center group"
                    variants={fadeInUp}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <motion.div 
                      className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-foreground group-hover:scale-110"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <IconComponent className="w-6 h-6 text-foreground group-hover:text-background transition-colors" />
                    </motion.div>
                    <h3 className="font-semibold text-foreground mb-2">{capability.title}</h3>
                    <p className="text-sm text-muted-foreground">{capability.description}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Agents Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <AnimatedSection className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-medium mb-4 text-foreground tracking-tight">
                Explore Some of Our Best Agents
              </h2>
              <p className="text-lg text-muted-foreground">
                Each agent is designed for specific use cases, from legal document review to autonomous coding.
              </p>
            </AnimatedSection>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {agents.map((agent, index) => {
                const IconComponent = agent.icon;
                return (
                  <motion.div
                    key={agent.id}
                    variants={fadeInUp}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link to={`/platform/ai-agents/${agent.id}`}>
                      <motion.div
                        whileHover={{ y: -4, scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                      <Card className="group p-6 h-full bg-background border-border hover:border-foreground/30 transition-all duration-300 cursor-pointer hover:shadow-lg">
                        <div className="flex items-start gap-4 mb-4">
                          <motion.div 
                            className="p-3 rounded-lg bg-muted transition-all duration-300 group-hover:bg-foreground"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <IconComponent className="w-5 h-5 text-foreground group-hover:text-background transition-colors" />
                          </motion.div>
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
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Features List Section */}
        <section className="py-20 bg-background overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-heading font-medium mb-6 text-foreground tracking-tight">
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
                    <li 
                      key={index} 
                      className="flex items-start gap-3 group"
                    >
                      <CheckCircle2 className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0 transition-colors group-hover:text-primary" />
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <motion.div 
                className="bg-muted rounded-lg aspect-video flex items-center justify-center border border-border overflow-hidden"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <motion.div 
                  className="text-center p-8"
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Platform Demo</p>
                </motion.div>
              </motion.div>
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
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-heading font-medium mb-6 text-background tracking-tight"
                variants={fadeInUp}
              >
                Ready to Build Your AI Agent?
              </motion.h2>
              <motion.p 
                className="text-lg text-background/70 mb-8"
                variants={fadeInUp}
              >
                Start with our platform to create custom autonomous workflows where you control exactly how much independence you want to grant your AI agents.
              </motion.p>
              <motion.div 
                className="flex flex-wrap gap-4 justify-center"
                variants={fadeInUp}
              >
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="gap-2 bg-background text-foreground hover:bg-background/90 px-8 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                >
                  Start Building 
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-background/30 text-background hover:bg-background/10 px-8 transition-all duration-300 hover:scale-105"
                >
                  Talk to Sales
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AIAgentsHub;