import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { 
  Rocket, 
  Zap, 
  Globe, 
  Shield, 
  Users, 
  Coins, 
  Bot,
  CheckCircle2,
  Circle,
  ArrowRight
} from "lucide-react";

interface RoadmapPhase {
  phase: string;
  title: string;
  timeline: string;
  status: "completed" | "in-progress" | "upcoming";
  icon: React.ReactNode;
  items: { text: string; completed: boolean }[];
  color: string;
}

const roadmapData: RoadmapPhase[] = [
  {
    phase: "Phase 1",
    title: "Foundation",
    timeline: "Q4 2024",
    status: "completed",
    icon: <Rocket className="h-6 w-6" />,
    color: "from-emerald-500 to-green-600",
    items: [
      { text: "Core smart contract architecture", completed: true },
      { text: "Bonding curve mechanism v1", completed: true },
      { text: "Base Sepolia testnet deployment", completed: true },
      { text: "Basic agent creation flow", completed: true },
      { text: "PROMPT token integration", completed: true },
    ],
  },
  {
    phase: "Phase 2",
    title: "Platform Launch",
    timeline: "Q1 2025",
    status: "in-progress",
    icon: <Zap className="h-6 w-6" />,
    color: "from-blue-500 to-indigo-600",
    items: [
      { text: "Visual workflow builder", completed: true },
      { text: "Agent marketplace beta", completed: true },
      { text: "Graduation mechanism to DEX", completed: false },
      { text: "LP locking & holder rewards", completed: false },
      { text: "Creator dashboard analytics", completed: false },
    ],
  },
  {
    phase: "Phase 3",
    title: "Ecosystem Growth",
    timeline: "Q2 2025",
    status: "upcoming",
    icon: <Users className="h-6 w-6" />,
    color: "from-purple-500 to-violet-600",
    items: [
      { text: "Multi-chain expansion (Ethereum, Arbitrum)", completed: false },
      { text: "Agent-to-agent collaboration", completed: false },
      { text: "Advanced AI model integrations", completed: false },
      { text: "Community governance launch", completed: false },
      { text: "Developer SDK & API", completed: false },
    ],
  },
  {
    phase: "Phase 4",
    title: "Mainnet & Scale",
    timeline: "Q3 2025",
    status: "upcoming",
    icon: <Globe className="h-6 w-6" />,
    color: "from-orange-500 to-red-600",
    items: [
      { text: "Base Mainnet launch", completed: false },
      { text: "Institutional partnerships", completed: false },
      { text: "Enterprise agent solutions", completed: false },
      { text: "Cross-chain agent bridging", completed: false },
      { text: "Mobile app release", completed: false },
    ],
  },
  {
    phase: "Phase 5",
    title: "Decentralization",
    timeline: "Q4 2025",
    status: "upcoming",
    icon: <Shield className="h-6 w-6" />,
    color: "from-pink-500 to-rose-600",
    items: [
      { text: "Full DAO governance transition", completed: false },
      { text: "Decentralized agent hosting", completed: false },
      { text: "Community treasury management", completed: false },
      { text: "Protocol fee distribution", completed: false },
      { text: "Open-source infrastructure", completed: false },
    ],
  },
];

const StatusBadge = ({ status }: { status: RoadmapPhase["status"] }) => {
  const styles = {
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "in-progress": "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse",
    upcoming: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };

  const labels = {
    completed: "Completed",
    "in-progress": "In Progress",
    upcoming: "Upcoming",
  };

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default function Roadmap() {
  return (
    <>
      <Helmet>
        <title>Roadmap | Promptbox - The Future of AI Agents</title>
        <meta 
          name="description" 
          content="Explore Promptbox's roadmap for building the future of tokenized AI agents. From testnet to mainnet, see our vision unfold." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <p className="text-sm font-mono text-muted-foreground mb-4 tracking-wider uppercase inline-block border-b-2 border-foreground/30 pb-1">
                ROADMAP
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-medium text-foreground mb-6 tracking-tight">
                Building the Future of AI Agents
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From concept to reality — follow our journey as we create the infrastructure 
                for the next generation of tokenized AI agents.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 relative">
          <div className="container mx-auto px-4">
            {/* Central timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent hidden lg:block" />

            <div className="space-y-12 lg:space-y-24">
              {roadmapData.map((phase, index) => (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={`relative grid lg:grid-cols-2 gap-8 lg:gap-16 ${
                    index % 2 === 1 ? "lg:direction-rtl" : ""
                  }`}
                >
                  {/* Timeline node */}
                  <div className="absolute left-1/2 top-8 -translate-x-1/2 hidden lg:flex items-center justify-center">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${phase.color} flex items-center justify-center shadow-lg shadow-primary/20`}>
                      {phase.icon}
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`${index % 2 === 1 ? "lg:col-start-2" : ""}`}>
                    <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${phase.color} flex items-center justify-center lg:hidden`}>
                            {phase.icon}
                          </div>
                          <div>
                            <p className="text-sm font-mono text-muted-foreground">{phase.phase}</p>
                            <h3 className="text-2xl font-heading font-medium text-foreground">{phase.title}</h3>
                          </div>
                        </div>
                        <StatusBadge status={phase.status} />
                      </div>

                      {/* Timeline badge */}
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full mb-6">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{phase.timeline}</span>
                      </div>

                      {/* Items list */}
                      <ul className="space-y-3">
                        {phase.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            {item.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            )}
                            <span className={`text-sm ${item.completed ? "text-foreground" : "text-muted-foreground"}`}>
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Empty column for alternating layout */}
                  <div className={`hidden lg:block ${index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}`} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-6">
                <Bot className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-medium text-foreground mb-6">
                Our Vision
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                We're building the infrastructure for a new economy of autonomous AI agents. 
                Our goal is to make it simple for anyone to create, fund, and deploy AI agents 
                that can operate independently, generate value, and evolve with their communities.
              </p>
              <a 
                href="/create" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 transition-colors"
              >
                Start Building <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
