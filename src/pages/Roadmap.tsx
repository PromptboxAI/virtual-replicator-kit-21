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
  ArrowRight,
  TrendingUp,
  Vote,
  Cpu,
  Layers,
  Building2
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
    timeline: "Q3 2025",
    status: "completed",
    icon: <Rocket className="h-6 w-6" />,
    color: "from-emerald-500 to-green-600",
    items: [
      { text: "Core smart contract architecture", completed: true },
      { text: "Bonding curve mechanism v1-v6", completed: true },
      { text: "Base Sepolia testnet deployment", completed: true },
      { text: "Agent creation flow with prebuy", completed: true },
      { text: "Database mode trading (gas-free)", completed: true },
    ],
  },
  {
    phase: "Phase 2",
    title: "V7 & Testnet Token",
    timeline: "Q4 2025",
    status: "completed",
    icon: <Zap className="h-6 w-6" />,
    color: "from-emerald-500 to-green-600",
    items: [
      { text: "V7 bonding curve with optimized pricing", completed: true },
      { text: "Price continuity at graduation (zero price drop)", completed: true },
      { text: "50/50 creator/platform fee split", completed: true },
      { text: "$PROMPT testnet token integration", completed: true },
      { text: "Graduation mechanism to Uniswap V2", completed: true },
      { text: "LP locking (95% locked, 3 years)", completed: true },
      { text: "Holder rewards system (5% at graduation)", completed: true },
      { text: "Team vesting contracts (milestone + time-based)", completed: true },
    ],
  },
  {
    phase: "Phase 3",
    title: "Mainnet & Creator Economy",
    timeline: "Q1 2026",
    status: "in-progress",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "from-blue-500 to-indigo-600",
    items: [
      { text: "$PROMPT stealth launch on Base Mainnet", completed: false },
      { text: "Base Mainnet smart contract deployment", completed: false },
      { text: "Mainnet graduation to Uniswap", completed: false },
      { text: "Creator revenue dashboard & analytics", completed: false },
      { text: "Automated fee payout system", completed: false },
      { text: "Agent performance metrics & insights", completed: false },
      { text: "Featured agent listings & spotlight", completed: false },
      { text: "Social integrations (Twitter/X, Discord)", completed: false },
      { text: "Creator marketing toolkit", completed: false },
    ],
  },
  {
    phase: "Phase 4",
    title: "Holder Benefits & Staking",
    timeline: "Q2 2026",
    status: "upcoming",
    icon: <Coins className="h-6 w-6" />,
    color: "from-purple-500 to-violet-600",
    items: [
      { text: "PROMPT staking protocol launch", completed: false },
      { text: "Platform fee sharing for stakers", completed: false },
      { text: "Tiered holder benefits (Bronze/Silver/Gold/Diamond)", completed: false },
      { text: "Exclusive early access to new agents", completed: false },
      { text: "Holder airdrops & rewards program", completed: false },
      { text: "Loyalty multipliers for long-term holders", completed: false },
    ],
  },
  {
    phase: "Phase 5",
    title: "Governance & Community",
    timeline: "Q2-Q3 2026",
    status: "upcoming",
    icon: <Vote className="h-6 w-6" />,
    color: "from-orange-500 to-amber-600",
    items: [
      { text: "Governance token mechanics", completed: false },
      { text: "Community voting on platform decisions", completed: false },
      { text: "Proposal submission system", completed: false },
      { text: "Agent curation voting (community picks)", completed: false },
      { text: "Grant program for builders", completed: false },
      { text: "Ambassador & contributor rewards", completed: false },
    ],
  },
  {
    phase: "Phase 6",
    title: "AI & Integration Expansion",
    timeline: "Q3 2026",
    status: "upcoming",
    icon: <Cpu className="h-6 w-6" />,
    color: "from-cyan-500 to-teal-600",
    items: [
      { text: "Advanced AI model integrations (OpenAI, Anthropic, etc.)", completed: false },
      { text: "Agent-to-agent collaboration framework", completed: false },
      { text: "DeFi protocol integrations", completed: false },
      { text: "Developer SDK & API release", completed: false },
      { text: "Webhook & automation support", completed: false },
    ],
  },
  {
    phase: "Phase 7",
    title: "Multi-Chain Expansion",
    timeline: "Q4 2026",
    status: "upcoming",
    icon: <Layers className="h-6 w-6" />,
    color: "from-indigo-500 to-purple-600",
    items: [
      { text: "Arbitrum deployment", completed: false },
      { text: "Optimism deployment", completed: false },
      { text: "Cross-chain agent bridging", completed: false },
      { text: "Unified liquidity across chains", completed: false },
      { text: "Chain-agnostic agent creation", completed: false },
    ],
  },
  {
    phase: "Phase 8",
    title: "Scale & Enterprise",
    timeline: "Q1 2027",
    status: "upcoming",
    icon: <Building2 className="h-6 w-6" />,
    color: "from-rose-500 to-pink-600",
    items: [
      { text: "Mobile app release (iOS/Android)", completed: false },
      { text: "Enterprise agent solutions", completed: false },
      { text: "White-label platform options", completed: false },
      { text: "Institutional partnerships", completed: false },
      { text: "Launchpad partner integrations", completed: false },
    ],
  },
  {
    phase: "Phase 9",
    title: "Full Decentralization",
    timeline: "Q2 2027+",
    status: "upcoming",
    icon: <Shield className="h-6 w-6" />,
    color: "from-zinc-500 to-slate-600",
    items: [
      { text: "Full DAO governance transition", completed: false },
      { text: "Decentralized agent hosting", completed: false },
      { text: "Community treasury management", completed: false },
      { text: "Protocol fee distribution automation", completed: false },
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
                From Token Launchpad to Agent Economy
              </h1>
              <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                See how Promptbox is rolling out the rails for tokenized AI agents, micro-SaaS workflows, and the communities that back them.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 relative">
          <div className="container mx-auto px-4">
            {/* Central timeline dashed line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-border hidden lg:block" />

            <div className="space-y-12 lg:space-y-24">
              {roadmapData.map((phase, index) => (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  viewport={{ once: true, margin: "0px" }}
                  className={`relative grid lg:grid-cols-2 gap-8 lg:gap-16 ${
                    index % 2 === 1 ? "lg:direction-rtl" : ""
                  }`}
                >
                  {/* Timeline node */}
                  <div className="absolute left-1/2 top-8 -translate-x-1/2 hidden lg:flex items-center justify-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                      phase.status === "completed" 
                        ? "bg-foreground text-background shadow-foreground/20" 
                        : `bg-gradient-to-br ${phase.color} shadow-primary/20`
                    }`}>
                      {phase.icon}
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`${index % 2 === 1 ? "lg:col-start-2" : ""}`}>
                    <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center lg:hidden ${
                            phase.status === "completed"
                              ? "bg-foreground text-background"
                              : `bg-gradient-to-br ${phase.color}`
                          }`}>
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
        <section className="py-16 relative overflow-hidden">
          {/* Black background with layered microdots */}
          <div className="absolute inset-0 bg-foreground" />
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--background) / 0.08) 1px, transparent 1px)',
              backgroundSize: '8px 8px',
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--background) / 0.05) 0.8px, transparent 0.8px)',
              backgroundSize: '12px 12px',
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--background) / 0.03) 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background mb-6">
                <Bot className="h-8 w-8 text-foreground" />
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-medium text-background mb-6">
                Our Vision
              </h2>
              <p className="text-lg text-background mb-8 leading-relaxed">
                We're building the infrastructure for a new economy of autonomous AI agents. 
                Our goal is to make it simple for anyone to create, fund, and deploy AI agents 
                that can operate independently, generate value, and evolve with their communities.
              </p>
              <a 
                href="/create" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-background text-foreground rounded-full font-medium hover:bg-background/90 transition-colors"
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
