import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Brain,
  Sparkles,
  Network,
  FileStack,
  BookOpen,
  Wand2,
  Activity,
  Rocket,
  Inbox,
  GitBranch,
  Repeat,
  ShieldCheck,
  Bot,
  Zap,
  Globe2,
  Wallet,
  ArrowRight,
  Check,
  Menu,
  X,
  Layers,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { submitWaitlist } from "@/lib/waitlist";

/* ---------------- Waitlist Form ---------------- */

function WaitlistForm({
  source,
  compact = false,
}: {
  source: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [buildingType, setBuildingType] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await submitWaitlist({
      email,
      name,
      building_type: buildingType,
      notes,
      source,
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setDone(true);
    toast.success(
      res.alreadyJoined
        ? "You're already on the list — we'll be in touch."
        : "You're on the list. We'll notify you when early access opens."
    );
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500">
          <Check className="h-5 w-5 text-black" />
        </div>
        <p className="text-base font-medium text-white">You're on the list.</p>
        <p className="mt-1 text-sm text-white/60">
          We'll notify you when early access opens.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <form
        onSubmit={onSubmit}
        className="flex w-full flex-col gap-2 sm:flex-row"
      >
        <Input
          type="email"
          required
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
          className="h-12 flex-1 border-white/10 bg-white/[0.04] text-white placeholder:text-white/40 backdrop-blur focus-visible:ring-cyan-400"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-12 bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 text-black font-semibold hover:opacity-90"
        >
          {loading ? "Joining…" : "Join the Waitlist"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/60">Email</label>
          <Input
            type="email"
            required
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/40"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/60">Name (optional)</label>
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-white/40"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-white/60">
          What are you building?
        </label>
        <Select value={buildingType} onValueChange={setBuildingType}>
          <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white">
            <SelectValue placeholder="Pick the closest match" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal_brain">Personal second brain</SelectItem>
            <SelectItem value="ai_agent">AI agent</SelectItem>
            <SelectItem value="tokenized_agent">Crypto / tokenized agent</SelectItem>
            <SelectItem value="business_kb">Business knowledge base</SelectItem>
            <SelectItem value="research">Research assistant</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-white/60">
          Tell us what you want to build (optional)
        </label>
        <Textarea
          rows={3}
          placeholder="A trading research agent that remembers theses and tracks markets…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/40"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 text-black font-semibold hover:opacity-90"
      >
        {loading ? "Joining…" : "Join the Promptbox Waitlist"}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
      <p className="text-center text-xs text-white/40">
        For AI builders, creators, researchers, and crypto-native agent teams.
      </p>
    </form>
  );
}

/* ---------------- Brain Graph Hero Visual ---------------- */

function BrainGraphVisual() {
  const nodes = [
    { id: "core", label: "Brain", x: 50, y: 50, r: 22, accent: true },
    { id: "research", label: "Research", x: 12, y: 18 },
    { id: "memory", label: "Memory", x: 88, y: 22 },
    { id: "skills", label: "Skills", x: 92, y: 68 },
    { id: "outputs", label: "Outputs", x: 60, y: 90 },
    { id: "wallet", label: "Wallet", x: 18, y: 86 },
    { id: "proof", label: "Proof Feed", x: 8, y: 56 },
  ];
  const links = nodes.filter((n) => n.id !== "core").map((n) => ({
    x1: 50,
    y1: 50,
    x2: n.x,
    y2: n.y,
    id: n.id,
  }));

  return (
    <div className="relative w-full">
      {/* Glow backdrop */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-60">
        <div className="absolute top-10 left-10 h-48 w-48 rounded-full bg-cyan-500/40" />
        <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-violet-600/40" />
      </div>

      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl p-5 shadow-[0_20px_80px_-20px_rgba(56,189,248,0.35)]">
        {/* Stats header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500">
              <Brain className="h-4 w-4 text-black" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AlphaScout AI</p>
              <p className="text-[11px] text-white/50">Brain status · Growing</p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            ● Live
          </span>
        </div>

        {/* Graph */}
        <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_70%)]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="link" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.7" />
              </linearGradient>
              <radialGradient id="core" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#7c3aed" />
              </radialGradient>
            </defs>

            {links.map((l) => (
              <line
                key={l.id}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke="url(#link)"
                strokeWidth={0.4}
                strokeDasharray="1 1.5"
                className="opacity-70"
              />
            ))}

            {nodes.map((n) => (
              <g key={n.id}>
                {n.accent ? (
                  <>
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.r}
                      fill="url(#core)"
                      opacity={0.25}
                      className="animate-pulse"
                    />
                    <circle cx={n.x} cy={n.y} r={6} fill="url(#core)" />
                  </>
                ) : (
                  <>
                    <circle cx={n.x} cy={n.y} r={2.4} fill="#e2e8f0" />
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={4}
                      fill="none"
                      stroke="#67e8f9"
                      strokeOpacity={0.4}
                      strokeWidth={0.4}
                    />
                  </>
                )}
              </g>
            ))}
          </svg>

          {/* Node labels overlaid as HTML for crispness */}
          {nodes
            .filter((n) => !n.accent)
            .map((n) => (
              <span
                key={n.id}
                className="absolute -translate-x-1/2 translate-y-2 rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/80 backdrop-blur"
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
              >
                {n.label}
              </span>
            ))}

          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            Second Brain
          </span>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { k: "Raw Sources", v: "128" },
            { k: "Wiki Pages", v: "34" },
            { k: "Skills", v: "9" },
            { k: "Health Score", v: "92%" },
            { k: "Proof Events", v: "47" },
            { k: "Token", v: "Optional" },
          ].map((s) => (
            <div
              key={s.k}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
            >
              <p className="text-sm font-semibold text-white">{s.v}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/50">
                {s.k}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Nav ---------------- */

function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <a href="#top" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500">
            <Brain className="h-4 w-4 text-black" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white">
            Promptbox
          </span>
          <span className="ml-1 hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 sm:inline-block">
            V2
          </span>
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-white/70 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <a href="#waitlist">
            <Button className="h-9 bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-semibold hover:opacity-90">
              Join Waitlist
            </Button>
          </a>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-white md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/5 bg-black/80 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-white/80"
              >
                {l.label}
              </a>
            ))}
            <a href="#waitlist" onClick={() => setOpen(false)}>
              <Button className="w-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-semibold">
                Join Waitlist
              </Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------- Sections ---------------- */

const Section = ({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    id={id}
    className={cn("relative mx-auto w-full max-w-7xl px-4 md:px-6", className)}
  >
    {children}
  </section>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 inline-block rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
    {children}
  </p>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
    {children}
  </h2>
);

const Glass = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl",
      className
    )}
  >
    {children}
  </div>
);

/* ---------------- Page ---------------- */

export default function WaitlistHome() {
  // Force dark theme on this page
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      // leave dark on — homepage owns the theme
    };
  }, []);

  const features = [
    { icon: Inbox, title: "Raw Dump Inbox", body: "Drop in anything: documents, notes, URLs, chat exports, screenshots, meeting transcripts, PDFs, and research." },
    { icon: BookOpen, title: "AI-Generated Wiki", body: "Promptbox turns messy inputs into structured pages, topic clusters, summaries, and internal links." },
    { icon: Network, title: "Visual Brain Graph", body: "See your agent's knowledge as a living graph of sources, memories, outputs, skills, and decisions." },
    { icon: Brain, title: "Persistent Memory", body: "Agents remember corrections, preferences, decisions, task history, lessons learned, and important context." },
    { icon: Repeat, title: "Reusable Skills", body: "Turn repeated workflows into agent skills that can be reused, improved, and shared." },
    { icon: ShieldCheck, title: "Brain Health Checks", body: "Audit the brain for contradictions, stale information, missing sources, weak coverage, and suggested improvements." },
    { icon: Bot, title: "Claude Standard Agents", body: "Launch reliable Claude-powered agents with structured memory and second-brain retrieval." },
    { icon: Sparkles, title: "Hermes Self-Learning Mode", body: "Advanced agents can use Hermes-style self-learning loops, task agents, skill creation, and deeper memory improvement." },
    { icon: Globe2, title: "Public Proof Feed", body: "Public agents can show what they learned, created, updated, proposed, or executed over time." },
    { icon: Wallet, title: "Optional Tokenized Agents", body: "Turn serious public agents into tokenized communities with future wallet, treasury, and AgentFi features." },
  ];

  const steps = [
    { n: 1, icon: Inbox, title: "Dump Knowledge", body: "Upload notes, PDFs, links, transcripts, screenshots, docs, and raw ideas." },
    { n: 2, icon: BookOpen, title: "AI Librarian Builds the Wiki", body: "Promptbox organizes messy information into clean topic pages, indexes, and linked knowledge." },
    { n: 3, icon: Wand2, title: "Ask the Brain", body: "Query the agent's second brain and get answers grounded in its own knowledge." },
    { n: 4, icon: FileStack, title: "Save Outputs Back", body: "Useful answers, reports, strategies, and decisions are saved back into the brain." },
    { n: 5, icon: Activity, title: "Run Health Checks", body: "Promptbox audits contradictions, stale pages, missing sources, orphaned notes, and weak areas." },
    { n: 6, icon: Rocket, title: "Deploy as an Agent", body: "Use the brain with Claude, Hermes, or future agent runtimes. Public, private, or tokenized." },
  ];

  const useCases = [
    { title: "Crypto Research Agents", body: "Track markets, summarize sources, build watchlists, save theses, and publish proof-of-work." },
    { title: "Creator Brains", body: "Turn a creator's content, ideas, notes, and voice into a persistent AI assistant." },
    { title: "Business Knowledge Agents", body: "Upload SOPs, docs, meeting notes, policies, and internal knowledge to create a living company brain." },
    { title: "Trading Assistants", body: "Create agents that research, propose, and document trading ideas with clear memory and risk rules." },
    { title: "Expert Assistants", body: "Turn specialized knowledge into an agent that can answer, draft, research, and improve over time." },
    { title: "Community Agents", body: "Give communities an agent that remembers decisions, summarizes activity, and maintains a public knowledge base." },
  ];

  const tiers = [
    {
      name: "Personal Brain",
      price: "Free during beta",
      desc: "For individuals building a private second brain for research, projects, or personal knowledge.",
      cta: "Join Free Beta",
      includes: [
        "1 private brain",
        "Raw dump inbox",
        "AI-generated wiki",
        "Basic graph view",
        "Limited monthly brain builds",
        "Claude-powered Q&A",
      ],
    },
    {
      name: "Agent Brain",
      price: "From $29/mo",
      desc: "For creators and builders turning a second brain into a working AI agent.",
      cta: "Join Waitlist",
      featured: true,
      includes: [
        "Everything in Personal Brain",
        "Agent profile",
        "Persistent memory",
        "Saved outputs",
        "Skills",
        "Manual health checks",
        "Public or private agent page",
        "Higher usage limits",
      ],
    },
    {
      name: "Self-Learning Agent",
      price: "From $99/mo",
      desc: "For advanced users building Claude/Hermes-powered agents that improve over time.",
      cta: "Request Early Access",
      includes: [
        "Everything in Agent Brain",
        "Hermes self-learning mode",
        "Recurring health checks",
        "Advanced graph view",
        "Skill creation workflows",
        "Proof feed",
        "Scheduled agent tasks",
        "Priority runtime capacity",
      ],
    },
    {
      name: "Tokenized Agent",
      price: "Custom / Coming Soon",
      desc: "For public agents, crypto-native builders, and agent teams that want tokenization, wallet-ready architecture, and market-facing proof-of-work.",
      cta: "Apply for Tokenized Beta",
      includes: [
        "Public agent page",
        "Token-ready profile",
        "Public brain preview",
        "Proof-of-work feed",
        "Wallet-ready agent identity",
        "Future AgentFi features",
        "Agent treasury architecture",
        "Launch support",
      ],
    },
  ];

  const agentfi = [
    { icon: Wallet, title: "Agent Wallets", body: "Persistent economic agents can be wallet-ready." },
    { icon: Layers, title: "Agent Treasuries", body: "Future support for revenue, balances, and operating capital." },
    { icon: Sparkles, title: "Agent Tokens", body: "Optional tokenized communities around public agents." },
    { icon: ShieldCheck, title: "Proof Before Markets", body: "Public logs show what an agent knows, does, and improves before financial layers matter." },
  ];

  const comparison = [
    { row: "Memory", chatbot: "Session-based", workflow: "Task-based", promptbox: "Persistent second brain" },
    { row: "Knowledge", chatbot: "User repeats context", workflow: "Manual setup", promptbox: "AI-organized raw dump + wiki" },
    { row: "Improvement", chatbot: "Limited", workflow: "Manual edits", promptbox: "Outputs, health checks, skills, memory" },
    { row: "Visualization", chatbot: "None", workflow: "Nodes", promptbox: "Living brain graph" },
    { row: "Agent Identity", chatbot: "Conversation", workflow: "Automation", promptbox: "Persistent agent profile" },
    { row: "Tokenization", chatbot: "No", workflow: "No", promptbox: "Optional public agent / token layer" },
  ];

  const faqs = [
    {
      q: "Is Promptbox an AI agent builder?",
      a: "Promptbox is not a generic drag-and-drop agent builder. It is the second-brain layer for AI agents. You can use it to create agents, but the core product is persistent memory, organized knowledge, skills, health checks, and proof-of-work.",
    },
    {
      q: "Does Promptbox use Claude or Hermes?",
      a: "The MVP will support Claude-powered standard agents. Hermes-style self-learning agents are planned for advanced users who want deeper memory loops, skills, and autonomous improvement.",
    },
    {
      q: "Is this built on Obsidian?",
      a: "No. Promptbox is inspired by Obsidian-style linked knowledge, but it is built as a hosted, agent-native second brain with accounts, permissions, public/private knowledge, AI-managed wikis, and agent runtimes.",
    },
    {
      q: "Do I need to launch a token?",
      a: "No. Tokenization is optional. You can build private brains, public agents, or tokenized agents depending on your use case.",
    },
    {
      q: "What makes this different from uploading docs to a chatbot?",
      a: "Promptbox does not just retrieve documents. It organizes raw knowledge into a living wiki, saves useful outputs back into the brain, tracks memory and decisions, audits the brain for gaps, and visualizes the knowledge graph.",
    },
    {
      q: "Will agents have wallets?",
      a: "Only economic agents need wallets. Temporary task agents do not. Promptbox is building wallet-ready architecture for future agent treasuries, tokenized agents, and AgentFi use cases.",
    },
    {
      q: "When will tokenized agents launch?",
      a: "Tokenized agent features are planned for later beta phases. Early access will focus first on the second brain, agent memory, visual graph, and Claude-powered agents.",
    },
  ];

  return (
    <div id="top" className="dark min-h-screen bg-[#05060a] text-white antialiased">
      <Helmet>
        <title>Promptbox — The Second-Brain Layer for AI Agents</title>
        <meta
          name="description"
          content="Promptbox helps creators launch AI agents with persistent memory, organized knowledge, visual brain graphs, reusable skills, and optional tokenized rails. Join the V2 waitlist."
        />
        <link rel="canonical" href="https://promptbox.com/" />
      </Helmet>

      {/* Global ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.18),transparent)]" />
        <div className="absolute top-1/3 -left-32 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.18),transparent)]" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,6,10,0)_0%,rgba(5,6,10,0.6)_60%,#05060a_100%)]" />
      </div>

      <Nav />

      {/* HERO */}
      <Section className="pt-14 pb-24 md:pt-24 md:pb-32">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                V2 Waitlist Now Open
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/70">
                Second brains for AI agents
              </span>
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Build the{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                Second Brain
              </span>{" "}
              for Your AI Agent
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/70 md:text-lg">
              Promptbox helps creators launch AI agents with persistent memory,
              organized knowledge, visual brain graphs, reusable skills, public
              proof-of-work, and optional tokenized financial rails.
            </p>

            <div id="waitlist-hero" className="mt-7 max-w-xl">
              <WaitlistForm source="hero" compact />
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
                <span>For AI builders, creators, researchers, and crypto-native agent teams.</span>
              </div>
              <div className="mt-4 flex gap-3">
                <a href="#how">
                  <Button variant="outline" className="border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]">
                    See How It Works
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <div className="lg:pl-8">
            <BrainGraphVisual />
          </div>
        </div>
      </Section>

      {/* POSITIONING */}
      <Section className="py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>The Pivot</SectionLabel>
          <SectionHeading>
            Most AI agents are disposable. Promptbox makes them compound.
          </SectionHeading>
          <p className="mx-auto mt-5 max-w-2xl text-white/70">
            Today, anyone can create an AI agent. The problem is that most
            agents forget, reset, lose context, and never become a durable
            asset. Promptbox gives every agent a structured second brain that
            captures knowledge, organizes it into a living wiki, saves useful
            outputs, tracks decisions, and improves through recurring health
            checks.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { icon: Brain, title: "Remember", body: "Agents retain files, notes, decisions, outputs, and corrections." },
            { icon: BookOpen, title: "Organize", body: "Raw knowledge becomes a structured AI-managed wiki." },
            { icon: Activity, title: "Improve", body: "Health checks find gaps, contradictions, stale information, and new opportunities." },
          ].map((c) => (
            <Glass key={c.title} className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 border border-white/10">
                <c.icon className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-sm text-white/65">{c.body}</p>
            </Glass>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how" className="py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>How It Works</SectionLabel>
          <SectionHeading>From raw dump to deployed agent</SectionHeading>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => (
            <Glass key={s.n} className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-xs font-semibold text-cyan-300">
                  {s.n}
                </span>
                <s.icon className="h-5 w-5 text-white/70" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-white/65">{s.body}</p>
            </Glass>
          ))}
        </div>
      </Section>

      {/* FEATURES */}
      <Section id="features" className="py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Features</SectionLabel>
          <SectionHeading>An operating system for agent knowledge</SectionHeading>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f) => (
            <Glass
              key={f.title}
              className="group p-5 transition hover:border-cyan-400/30 hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.4)]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 border border-white/10">
                <f.icon className="h-4 w-4 text-cyan-300" />
              </div>
              <h3 className="text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-white/60">{f.body}</p>
            </Glass>
          ))}
        </div>
      </Section>

      {/* WHAT IS A BRAIN */}
      <Section className="py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionLabel>The Promptbox Brain</SectionLabel>
            <SectionHeading>What is a Promptbox Brain?</SectionHeading>
            <p className="mt-5 max-w-xl text-white/70">
              A Promptbox Brain is an AI-managed knowledge system attached to an
              agent. It contains raw sources, organized wiki pages, saved
              outputs, memory, skills, decisions, and health checks. The brain
              gets more valuable the more it is used.
            </p>
            <p className="mt-4 text-sm text-white/50">
              Obsidian-inspired. Agent-native. Built for hosted AI products.
            </p>
          </div>
          <Glass className="p-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <GitBranch className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold text-white">Promptbox Brain</p>
            </div>
            <ul className="mt-4 space-y-2 font-mono text-sm">
              {[
                { name: "Raw", desc: "PDFs, notes, links, transcripts" },
                { name: "Wiki", desc: "AI-organized topic pages" },
                { name: "Outputs", desc: "Saved answers, reports, decisions" },
                { name: "Memory", desc: "Corrections, preferences, lessons" },
                { name: "Skills", desc: "Reusable agent workflows" },
                { name: "Health Checks", desc: "Audits, gaps, contradictions" },
                { name: "Proof Feed", desc: "Public log of agent work" },
              ].map((f) => (
                <li
                  key={f.name}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-white/90">
                    <span className="text-cyan-300">/</span>
                    {f.name}
                  </span>
                  <span className="text-xs text-white/45">{f.desc}</span>
                </li>
              ))}
            </ul>
          </Glass>
        </div>
      </Section>

      {/* USE CASES */}
      <Section className="py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Use Cases</SectionLabel>
          <SectionHeading>Built for agents that need memory</SectionHeading>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((u) => (
            <Glass key={u.title} className="p-6">
              <h3 className="text-base font-semibold text-white">{u.title}</h3>
              <p className="mt-2 text-sm text-white/65">{u.body}</p>
            </Glass>
          ))}
        </div>
      </Section>

      {/* AGENTFI */}
      <Section className="py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>AgentFi</SectionLabel>
          <SectionHeading>Optional AgentFi Layer</SectionHeading>
          <p className="mt-5 text-white/70">
            Promptbox is building toward a future where serious agents can hold
            wallets, receive revenue, pay for tools, trade approved assets, and
            participate in agent-to-agent markets. The MVP starts with
            wallet-ready architecture, public proof feeds, and tokenized agent
            pages — without requiring every agent to launch a token.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agentfi.map((c) => (
            <Glass key={c.title} className="p-6">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400/20 to-cyan-400/20 border border-white/10">
                <c.icon className="h-4 w-4 text-violet-300" />
              </div>
              <h3 className="text-base font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-sm text-white/65">{c.body}</p>
            </Glass>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-white/40">
          Tokenization and financial features will be rolled out carefully and
          may vary by jurisdiction.
        </p>
      </Section>

      {/* PRICING */}
      <Section id="pricing" className="py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Early Access</SectionLabel>
          <SectionHeading>Waitlist pricing</SectionHeading>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-gradient-to-br p-6 backdrop-blur-xl",
                t.featured
                  ? "border-cyan-400/40 from-cyan-400/[0.08] to-violet-500/[0.06] shadow-[0_0_60px_-20px_rgba(34,211,238,0.5)]"
                  : "border-white/10 from-white/[0.05] to-white/[0.02]"
              )}
            >
              {t.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-black">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{t.name}</h3>
              <p className="mt-1 text-sm text-white/55">{t.desc}</p>
              <p className="mt-4 text-2xl font-semibold text-white">{t.price}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-white/70">
                {t.includes.map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <a href="#waitlist" className="mt-6 block">
                <Button
                  className={cn(
                    "w-full",
                    t.featured
                      ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-semibold hover:opacity-90"
                      : "bg-white/10 text-white hover:bg-white/15"
                  )}
                >
                  {t.cta}
                </Button>
              </a>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-white/40">
          Pricing is early-access guidance and may change before public launch.
        </p>
      </Section>

      {/* COMPARISON */}
      <Section className="py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Comparison</SectionLabel>
          <SectionHeading>
            Not another chatbot. Not another workflow builder.
          </SectionHeading>
        </div>
        <Glass className="mt-10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
                  <th className="p-4 font-medium"></th>
                  <th className="p-4 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <Bot className="h-3.5 w-3.5" /> Generic Chatbot
                    </span>
                  </th>
                  <th className="p-4 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <Workflow className="h-3.5 w-3.5" /> Workflow Builder
                    </span>
                  </th>
                  <th className="p-4 font-medium text-cyan-300">
                    <span className="inline-flex items-center gap-2">
                      <Brain className="h-3.5 w-3.5" /> Promptbox
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr
                    key={row.row}
                    className={cn(
                      "border-b border-white/5 text-white/80",
                      i === comparison.length - 1 && "border-b-0"
                    )}
                  >
                    <td className="p-4 font-medium text-white">{row.row}</td>
                    <td className="p-4 text-white/55">{row.chatbot}</td>
                    <td className="p-4 text-white/55">{row.workflow}</td>
                    <td className="p-4 text-white">{row.promptbox}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Glass>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <SectionLabel>FAQ</SectionLabel>
            <SectionHeading>Common questions</SectionHeading>
          </div>
          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 backdrop-blur"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/65">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* FINAL CTA + FORM */}
      <Section id="waitlist" className="py-24">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionLabel>Join V2</SectionLabel>
            <SectionHeading>
              Build the brain before the agent becomes valuable.
            </SectionHeading>
            <p className="mt-5 max-w-xl text-white/70">
              The next wave of AI agents will not win because they have better
              prompts. They will win because they remember, learn, organize,
              and prove their work over time.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Zap className="h-4 w-4 text-cyan-300" />
              <span className="text-sm text-white/60">
                Early access opens in waves. Founders get priority.
              </span>
            </div>
          </div>
          <WaitlistForm source="footer" />
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500">
                <Brain className="h-4 w-4 text-black" />
              </div>
              <span className="text-base font-semibold tracking-tight text-white">
                Promptbox
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-white/55">
              The second-brain layer for AI agents.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
              Product
            </p>
            <ul className="space-y-2 text-sm text-white/65">
              <li><a href="#waitlist" className="hover:text-white">Waitlist</a></li>
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
              Company
            </p>
            <ul className="space-y-2 text-sm text-white/65">
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 px-4 py-5 text-center text-xs text-white/35 md:px-6">
          © {new Date().getFullYear()} Promptbox. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
