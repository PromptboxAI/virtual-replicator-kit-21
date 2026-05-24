import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Brain,
  Network,
  FileStack,
  BookOpen,
  Wand2,
  Activity,
  Rocket,
  Inbox,
  Repeat,
  ShieldCheck,
  Bot,
  Sparkles,
  Globe2,
  Wallet,
  ArrowRight,
  Check,
  Menu,
  X,
  Layers,
  ListTree,
  Plus,
  Minus,
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

/* ============================================================
   Design tokens (Obsidian graph + Linear + Cursor)
   - Background: deep, slightly cool near-black
   - Panels:     #0f1012 / #131418 with thin hairline borders
   - Accent:     restrained lime/emerald (#A3E635) — a single accent
   - No big blur halos. No multi-color gradients on text. No glass.
   ============================================================ */

const PANEL = "rounded-xl border border-white/[0.06] bg-white/[0.02]";
const PANEL_SOLID =
  "rounded-xl border border-white/[0.06] bg-[#0f1012]";
const HAIRLINE = "border-white/[0.06]";
const TEXT_MUTED = "text-white/55";
const TEXT_DIM = "text-white/40";
const MONO = "font-mono tabular-nums";

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
      <div className={cn(PANEL_SOLID, "p-5 text-center")}>
        <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-[#A3E635]/30 bg-[#A3E635]/10">
          <Check className="h-4 w-4 text-[#A3E635]" />
        </div>
        <p className="text-sm font-medium text-white">You're on the list.</p>
        <p className={cn("mt-1 text-xs", TEXT_MUTED)}>
          We'll email you when early access opens.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
      >
        <Input
          type="email"
          required
          placeholder="you@work.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 flex-1 border-white/10 bg-white/[0.03] text-white placeholder:text-white/30 focus-visible:ring-[#A3E635]/40"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-11 bg-white text-black hover:bg-white/90"
        >
          {loading ? "Joining…" : "Join waitlist"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn(PANEL_SOLID, "p-5 sm:p-6")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/70">Email</label>
          <Input
            type="email"
            required
            placeholder="you@work.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 border-white/10 bg-white/[0.03] text-white placeholder:text-white/30 focus-visible:ring-[#A3E635]/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/70">Name</label>
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 border-white/10 bg-white/[0.03] text-white placeholder:text-white/30 focus-visible:ring-[#A3E635]/40"
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <label className="text-xs font-medium text-white/70">
          What are you building?
        </label>
        <Select value={buildingType} onValueChange={setBuildingType}>
          <SelectTrigger className="h-10 border-white/10 bg-white/[0.03] text-white focus:ring-[#A3E635]/40">
            <SelectValue placeholder="Select one" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#0f1012] text-white">
            <SelectItem value="personal">Personal second brain</SelectItem>
            <SelectItem value="research">Research / analyst agent</SelectItem>
            <SelectItem value="creator">Creator / content agent</SelectItem>
            <SelectItem value="business">Business knowledge agent</SelectItem>
            <SelectItem value="tokenized">Tokenized public agent</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 space-y-1.5">
        <label className="text-xs font-medium text-white/70">
          Anything else? <span className="text-white/30">(optional)</span>
        </label>
        <Textarea
          rows={3}
          placeholder="Tell us about the brain you want to build."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none border-white/10 bg-white/[0.03] text-white placeholder:text-white/30 focus-visible:ring-[#A3E635]/40"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="mt-4 h-11 w-full bg-white text-black hover:bg-white/90"
      >
        {loading ? "Joining waitlist…" : "Request early access"}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
      <p className={cn("mt-2 text-center text-[11px]", TEXT_DIM)}>
        No spam. We'll email when early access opens.
      </p>
    </form>
  );
}

/* ---------------- Hero Brain Dashboard ---------------- */

function BrainDashboard() {
  const stats = [
    { label: "Raw Sources", value: "128" },
    { label: "Wiki Pages", value: "34" },
    { label: "Saved Outputs", value: "47" },
    { label: "Skills", value: "9" },
    { label: "Health Score", value: "92%" },
    { label: "Proof Events", value: "18" },
  ];

  return (
    <div
      className={cn(
        PANEL_SOLID,
        "overflow-hidden shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]"
      )}
    >
      {/* Window chrome */}
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-2.5",
          HAIRLINE
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <span className={cn("ml-3 text-[11px]", MONO, TEXT_DIM)}>
            promptbox / brain / alphascout
          </span>
        </div>
        <span className={cn("flex items-center gap-1.5 text-[11px]", TEXT_MUTED)}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#A3E635]" />
          Live
        </span>
      </div>

      {/* Header row */}
      <div className={cn("flex items-center justify-between border-b px-5 py-4", HAIRLINE)}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
            <Brain className="h-4.5 w-4.5 text-white/80" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-sm font-medium text-white">AlphaScout</div>
            <div className={cn("text-[11px]", TEXT_DIM)}>
              Research brain · last sync 2m ago
            </div>
          </div>
        </div>
        <div className={cn("hidden items-center gap-2 text-[11px] sm:flex", TEXT_MUTED)}>
          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
            Claude 3.5
          </span>
          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
            Hermes mode
          </span>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-px bg-white/[0.06] sm:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#0f1012] px-4 py-4">
            <div className={cn("text-[10px] uppercase tracking-wider", TEXT_DIM)}>
              {s.label}
            </div>
            <div className={cn("mt-1 text-lg font-semibold text-white", MONO)}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Graph + activity */}
      <div className={cn("grid grid-cols-1 gap-px bg-white/[0.06] md:grid-cols-5", HAIRLINE)}>
        <div className="bg-[#0f1012] p-5 md:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-medium text-white/80">Brain Graph</div>
            <div className={cn("text-[10px]", TEXT_DIM)}>7 clusters · 142 edges</div>
          </div>
          <BrainGraphSVG />
        </div>

        <div className="bg-[#0f1012] p-5 md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-medium text-white/80">Recent activity</div>
            <div className={cn("text-[10px]", TEXT_DIM)}>today</div>
          </div>
          <ul className="space-y-3">
            {[
              { t: "Wiki page generated", s: "Q3 market structure", time: "2m" },
              { t: "Skill updated", s: "summarize-thread v4", time: "11m" },
              { t: "Health check passed", s: "0 contradictions", time: "32m" },
              { t: "Output saved", s: "Watchlist memo", time: "1h" },
              { t: "Proof event published", s: "Weekly research log", time: "3h" },
            ].map((a) => (
              <li key={a.t} className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#A3E635]" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-white/85">{a.t}</div>
                  <div className={cn("truncate text-[11px]", TEXT_DIM)}>
                    {a.s}
                  </div>
                </div>
                <div className={cn("text-[10px]", TEXT_DIM, MONO)}>{a.time}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Brain Graph SVG (Obsidian-style) ---------------- */

function BrainGraphSVG() {
  const nodes = [
    { id: "raw", label: "Raw", x: 60, y: 130, r: 18 },
    { id: "wiki", label: "Wiki", x: 175, y: 70, r: 22 },
    { id: "memory", label: "Memory", x: 200, y: 175, r: 20 },
    { id: "outputs", label: "Outputs", x: 320, y: 110, r: 18 },
    { id: "skills", label: "Skills", x: 340, y: 200, r: 16 },
    { id: "health", label: "Health", x: 460, y: 75, r: 14 },
    { id: "proof", label: "Proof", x: 470, y: 175, r: 14 },
  ] as const;

  const edges: Array<[string, string]> = [
    ["raw", "wiki"],
    ["raw", "memory"],
    ["wiki", "memory"],
    ["wiki", "outputs"],
    ["memory", "outputs"],
    ["memory", "skills"],
    ["outputs", "skills"],
    ["outputs", "health"],
    ["skills", "proof"],
    ["outputs", "proof"],
    ["health", "proof"],
  ];

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 520 260"
      className="h-[240px] w-full"
      role="img"
      aria-label="Promptbox brain graph"
    >
      {/* faint grid */}
      <defs>
        <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" fill="none" stroke="rgba(255,255,255,0.04)" />
        </pattern>
        <radialGradient id="nodeFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1d22" />
          <stop offset="100%" stopColor="#0f1012" />
        </radialGradient>
      </defs>
      <rect width="520" height="260" fill="url(#grid)" />

      {/* edges */}
      <g stroke="rgba(255,255,255,0.14)" strokeWidth="1">
        {edges.map(([a, b], i) => {
          const A = byId[a];
          const B = byId[b];
          return (
            <line
              key={i}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              strokeDasharray={i % 3 === 0 ? "2 3" : undefined}
            />
          );
        })}
      </g>

      {/* nodes */}
      <g>
        {nodes.map((n) => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="url(#nodeFill)"
              stroke="rgba(255,255,255,0.18)"
            />
            <circle
              cx={n.x}
              cy={n.y}
              r={3}
              fill="#A3E635"
              opacity={n.id === "memory" || n.id === "outputs" ? 1 : 0.5}
            />
            <text
              x={n.x}
              y={n.y + n.r + 12}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.65)"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {n.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ---------------- Nav ---------------- */

function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#how", label: "How it works" },
    { href: "#brain", label: "Brain" },
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
            <Brain className="h-4 w-4 text-white" strokeWidth={1.6} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            Promptbox
          </span>
          <span className={cn("ml-1 hidden text-[11px] sm:inline", TEXT_DIM)}>
            / second-brain layer
          </span>
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn("text-xs", TEXT_MUTED, "hover:text-white transition-colors")}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <a href="#waitlist">
            <Button className="h-9 bg-white text-black hover:bg-white/90">
              Join waitlist
            </Button>
          </a>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-white md:hidden"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/[0.06] bg-[#0a0a0b] px-5 py-4 md:hidden">
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
              <Button className="mt-2 h-10 w-full bg-white text-black hover:bg-white/90">
                Join waitlist
              </Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------- Section helpers ---------------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-[10px] uppercase tracking-[0.16em]",
        TEXT_MUTED
      )}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {sub && (
        <p className={cn("mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base", TEXT_MUTED)}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function WaitlistHome() {
  // Scope dark theme to this page only — clean up on unmount.
  useEffect(() => {
    const root = document.documentElement;
    const had = root.classList.contains("dark");
    root.classList.add("dark");
    return () => {
      if (!had) root.classList.remove("dark");
    };
  }, []);

  const features = [
    { icon: Inbox, title: "Raw Dump Inbox", body: "Drop in documents, notes, links, chat exports, transcripts, screenshots, and research. No structure required." },
    { icon: BookOpen, title: "AI Librarian", body: "An agent that reads everything you dump in and decides where it belongs in the brain." },
    { icon: Layers, title: "Living Wiki", body: "Messy inputs become structured topic pages, summaries, and internal links you can actually navigate." },
    { icon: Activity, title: "Memory Timeline", body: "A persistent record of decisions, corrections, preferences, and lessons the agent has learned." },
    { icon: Network, title: "Visual Brain Graph", body: "See sources, memories, outputs, skills, and proof events as a connected graph — Obsidian-style." },
    { icon: Repeat, title: "Reusable Skills", body: "Turn repeated workflows into skills the agent can call, improve, and share across brains." },
    { icon: ShieldCheck, title: "Brain Health Checks", body: "Audit for contradictions, stale pages, missing sources, weak coverage, and suggested improvements." },
    { icon: Globe2, title: "Public Proof Feed", body: "Public agents can show what they learned, created, and decided over time. Reputation, not just output." },
    { icon: Bot, title: "Claude Standard Agents", body: "Launch reliable Claude-powered agents with structured memory and second-brain retrieval." },
    { icon: Sparkles, title: "Hermes Self-Learning", body: "Advanced agents can run self-learning loops, spawn task agents, and improve their own brain over time." },
    { icon: Wallet, title: "Optional Tokenized Pages", body: "Serious public agents can become tokenized communities with wallets, treasuries, and proof feeds." },
  ];

  const steps = [
    { n: "01", icon: Inbox, title: "Dump knowledge", body: "Upload notes, PDFs, links, transcripts, screenshots, docs, and raw ideas." },
    { n: "02", icon: BookOpen, title: "AI Librarian builds the wiki", body: "Promptbox organizes messy information into clean topic pages, indexes, and linked knowledge." },
    { n: "03", icon: Wand2, title: "Ask the brain", body: "Query the agent's second brain and get answers grounded in its own knowledge." },
    { n: "04", icon: FileStack, title: "Save outputs back", body: "Useful answers, reports, strategies, and decisions are saved back into the brain." },
    { n: "05", icon: Activity, title: "Run health checks", body: "Audit contradictions, stale pages, missing sources, orphaned notes, and weak areas." },
    { n: "06", icon: Rocket, title: "Deploy as an agent", body: "Use the brain with Claude, Hermes, or future runtimes. Public, private, or tokenized." },
  ];

  const useCases = [
    { title: "Research agents", body: "Track sources, summarize findings, build watchlists, save theses, and publish proof of work." },
    { title: "Creator brains", body: "Turn a creator's content, ideas, notes, and voice into a persistent AI assistant." },
    { title: "Business knowledge agents", body: "SOPs, docs, meeting notes, and policies become a living company brain — not a folder graveyard." },
    { title: "Personal second brains", body: "Your reading, writing, thinking, and decisions, organized by an AI that actually remembers." },
    { title: "Analyst & strategy agents", body: "Compounding briefs, frameworks, and decision logs that get sharper every week." },
    { title: "Public proof agents", body: "Public-facing agents with a transparent feed of what they read, learned, and produced." },
  ];

  const brainLayers = [
    { icon: Inbox, label: "Raw", desc: "Source of truth: documents, links, notes, transcripts." },
    { icon: BookOpen, label: "Wiki", desc: "Structured pages and topic clusters generated from raw." },
    { icon: Activity, label: "Memory", desc: "Persistent decisions, corrections, preferences, history." },
    { icon: FileStack, label: "Outputs", desc: "Saved reports, briefs, answers, and strategies." },
    { icon: Repeat, label: "Skills", desc: "Reusable workflows the agent can call and improve." },
    { icon: ShieldCheck, label: "Health Checks", desc: "Audits for contradictions, stale info, weak coverage." },
    { icon: Globe2, label: "Proof Feed", desc: "Public log of what the agent learned and produced." },
  ];

  const pricing = [
    {
      name: "Personal Brain",
      price: "Free",
      period: "during beta",
      desc: "For individuals building a private second brain.",
      features: ["1 brain", "Raw + Wiki + Memory", "Visual graph", "Manual ask & save"],
      cta: "Join waitlist",
      featured: false,
    },
    {
      name: "Agent Brain",
      price: "$29",
      period: "/mo",
      desc: "Standard agents with structured memory and skills.",
      features: ["Up to 5 brains", "Claude standard agents", "Skills library", "Health checks"],
      cta: "Join waitlist",
      featured: true,
    },
    {
      name: "Self-Learning Agent",
      price: "$99",
      period: "/mo",
      desc: "Hermes-mode agents that improve their own brain.",
      features: ["Self-learning loops", "Task sub-agents", "Skill creation", "Deeper audits"],
      cta: "Join waitlist",
      featured: false,
    },
    {
      name: "Tokenized Agent",
      price: "Apply",
      period: "for beta",
      desc: "Public agents with wallets, treasury, and proof feed.",
      features: ["Tokenized page", "Public proof feed", "Wallet-ready", "AgentFi layer"],
      cta: "Apply",
      featured: false,
    },
  ];

  const compareRows = [
    ["Persistent memory", true, false, false],
    ["AI-organized wiki", true, false, false],
    ["Visual brain graph", true, false, false],
    ["Reusable skills", true, "partial", false],
    ["Brain health checks", true, false, false],
    ["Public proof feed", true, false, false],
    ["Optional tokenized agent layer", true, false, false],
  ] as const;

  const faqs = [
    {
      q: "What is a Promptbox Brain?",
      a: "A structured second brain for an AI agent: raw sources, an AI-generated wiki, persistent memory, saved outputs, reusable skills, health checks, and an optional public proof feed.",
    },
    {
      q: "Is this a crypto product?",
      a: "No. Promptbox is a knowledge and memory product for AI agents. Tokenized agents are an optional layer for public agents only — most brains never need a token.",
    },
    {
      q: "How is this different from Notion or Obsidian?",
      a: "Those are tools for humans. Promptbox is a brain designed to be read, written to, and improved by an agent — with memory, skills, audits, and a retrieval layer built in.",
    },
    {
      q: "Which LLMs do you support?",
      a: "Claude (standard) and Hermes-style self-learning agents at launch. The brain is model-agnostic and will support more runtimes over time.",
    },
    {
      q: "What is the AgentFi layer?",
      a: "An optional layer for public agents: wallet-ready architecture, tokenized pages, proof feeds, and future treasury features. Always opt-in. Subject to jurisdictional availability.",
    },
    {
      q: "Can I keep my brain private?",
      a: "Yes. Personal and Agent Brain tiers are private by default. Public, proof-feed, and tokenized features are opt-in.",
    },
    {
      q: "When does early access open?",
      a: "We're onboarding waitlist users in waves. Join the list and tell us what you're building — we prioritize serious builders.",
    },
  ];

  return (
    <div
      id="top"
      className="dark min-h-screen bg-[#0a0a0b] text-white antialiased selection:bg-[#A3E635]/30"
    >
      <Helmet>
        <title>Promptbox — The Second-Brain Layer for AI Agents</title>
        <meta
          name="description"
          content="Create AI agents with persistent memory, an AI-organized wiki, reusable skills, visual brain graphs, health checks, and optional tokenized public pages."
        />
        <meta
          property="og:title"
          content="Promptbox — The Second-Brain Layer for AI Agents"
        />
        <meta
          property="og:description"
          content="Most AI agents forget. Promptbox gives them a brain."
        />
      </Helmet>

      <Nav />

      {/* ============ HERO ============ */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <SectionLabel>
                <span className="h-1.5 w-1.5 rounded-full bg-[#A3E635]" />
                Now in private beta
              </SectionLabel>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[56px]">
                Most AI agents forget.
                <br />
                <span className="text-white/55">Promptbox gives them a brain.</span>
              </h1>
              <p className={cn("mt-5 max-w-xl text-base leading-relaxed sm:text-lg", TEXT_MUTED)}>
                Create AI agents with persistent memory, an AI-organized wiki,
                reusable skills, visual brain graphs, health checks, and
                optional tokenized public pages.
              </p>
              <div className="mt-7">
                <WaitlistForm source="hero" compact />
              </div>
              <div className={cn("mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]", TEXT_DIM)}>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-[#A3E635]" /> No spam
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-[#A3E635]" /> Early access waves
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-[#A3E635]" /> Free during beta
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <BrainDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROBLEM ============ */}
      <section className="border-t border-white/[0.06] bg-[#08080a]">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <SectionLabel>The problem</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            Most AI agents are disposable.
          </h2>
          <p className={cn("mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg", TEXT_MUTED)}>
            Anyone can spin up an AI agent now. The problem is that most agents
            are disposable. They forget context, lose useful outputs, do not
            organize knowledge, and do not improve over time. Promptbox turns
            an agent into a compounding second brain.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2">
            <div className="bg-[#0f1012] p-6 text-left">
              <div className={cn("text-[10px] uppercase tracking-[0.18em]", TEXT_DIM)}>
                Today
              </div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li className="flex gap-2"><Minus className="mt-0.5 h-4 w-4 text-white/30" /> Forgets after every session</li>
                <li className="flex gap-2"><Minus className="mt-0.5 h-4 w-4 text-white/30" /> Outputs lost in chat history</li>
                <li className="flex gap-2"><Minus className="mt-0.5 h-4 w-4 text-white/30" /> Re-learns the same things</li>
                <li className="flex gap-2"><Minus className="mt-0.5 h-4 w-4 text-white/30" /> No way to audit what it knows</li>
              </ul>
            </div>
            <div className="bg-[#0f1012] p-6 text-left">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#A3E635]/80">
                With Promptbox
              </div>
              <ul className="mt-3 space-y-2 text-sm text-white/85">
                <li className="flex gap-2"><Plus className="mt-0.5 h-4 w-4 text-[#A3E635]" /> Persistent memory and wiki</li>
                <li className="flex gap-2"><Plus className="mt-0.5 h-4 w-4 text-[#A3E635]" /> Outputs saved back into the brain</li>
                <li className="flex gap-2"><Plus className="mt-0.5 h-4 w-4 text-[#A3E635]" /> Skills compound week over week</li>
                <li className="flex gap-2"><Plus className="mt-0.5 h-4 w-4 text-[#A3E635]" /> Health checks keep it sharp</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="How it works"
            title="Six steps from raw dump to deployed brain"
            sub="A clear pipeline from messy inputs to a structured, improving agent."
          />
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="bg-[#0f1012] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03]">
                    <s.icon className="h-4 w-4 text-white/80" strokeWidth={1.6} />
                  </div>
                  <span className={cn("text-[11px]", TEXT_DIM, MONO)}>{s.n}</span>
                </div>
                <h3 className="mt-4 text-sm font-medium text-white">{s.title}</h3>
                <p className={cn("mt-1.5 text-sm leading-relaxed", TEXT_MUTED)}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BRAIN STRUCTURE ============ */}
      <section id="brain" className="border-t border-white/[0.06] bg-[#08080a]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="Anatomy"
            title="What is a Promptbox Brain?"
            sub="Seven layers that turn an agent from a chatbot into a compounding knowledge worker."
          />

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className={cn(PANEL_SOLID, "p-5")}>
              <div className="mb-4 flex items-center gap-2">
                <ListTree className="h-4 w-4 text-white/70" strokeWidth={1.6} />
                <span className="text-xs font-medium text-white/80">Brain layers</span>
              </div>
              <ul className="space-y-2">
                {brainLayers.map((l) => (
                  <li
                    key={l.label}
                    className="flex items-start gap-3 rounded-md border border-transparent px-3 py-2 hover:border-white/[0.06] hover:bg-white/[0.02]"
                  >
                    <l.icon className="mt-0.5 h-4 w-4 text-white/60" strokeWidth={1.6} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white">{l.label}</div>
                      <div className={cn("text-xs", TEXT_MUTED)}>{l.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn(PANEL_SOLID, "p-5")}>
              <div className="mb-4 flex items-center gap-2">
                <Network className="h-4 w-4 text-white/70" strokeWidth={1.6} />
                <span className="text-xs font-medium text-white/80">Visual graph</span>
              </div>
              <BrainGraphSVG />
              <p className={cn("mt-4 text-xs leading-relaxed", TEXT_MUTED)}>
                Every source, page, memory, output, and skill is a node. Every
                relationship is an edge. The graph is how the agent — and you —
                actually see what it knows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="Features"
            title="Everything an agent needs to stop forgetting"
          />
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="bg-[#0f1012] p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03]">
                  <f.icon className="h-4 w-4 text-white/80" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-sm font-medium text-white">{f.title}</h3>
                <p className={cn("mt-1.5 text-sm leading-relaxed", TEXT_MUTED)}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ USE CASES ============ */}
      <section className="border-t border-white/[0.06] bg-[#08080a]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="Use cases"
            title="Brains people are already building"
          />
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((u) => (
              <div key={u.title} className={cn(PANEL_SOLID, "p-5")}>
                <h3 className="text-sm font-medium text-white">{u.title}</h3>
                <p className={cn("mt-1.5 text-sm leading-relaxed", TEXT_MUTED)}>{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AGENTFI ============ */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-5 py-20">
          <SectionLabel>Optional</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Optional AgentFi Layer
          </h2>
          <p className={cn("mt-4 max-w-2xl text-base leading-relaxed sm:text-lg", TEXT_MUTED)}>
            For public and economic agents, Promptbox is building wallet-ready
            architecture, tokenized agent pages, proof feeds, and future agent
            treasuries. Not every agent needs a token. Not every task agent
            needs a wallet. Promptbox keeps the financial layer optional and
            intentional.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2">
            {[
              { icon: Wallet, t: "Wallet-ready", d: "Agents can hold and route capital when it actually makes sense." },
              { icon: Globe2, t: "Tokenized pages", d: "Public agents can have a transparent, tokenized community page." },
              { icon: Activity, t: "Proof feed", d: "A public log of what the agent learned, produced, and decided." },
              { icon: ShieldCheck, t: "Intentional", d: "Always opt-in. Personal brains stay personal. Subject to jurisdictional availability." },
            ].map((x) => (
              <div key={x.t} className="bg-[#0f1012] p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03]">
                  <x.icon className="h-4 w-4 text-white/80" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-sm font-medium text-white">{x.t}</h3>
                <p className={cn("mt-1.5 text-sm leading-relaxed", TEXT_MUTED)}>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="border-t border-white/[0.06] bg-[#08080a]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free during beta"
            sub="Personal brains are free. Pay when your agents start compounding."
          />
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pricing.map((p) => (
              <div
                key={p.name}
                className={cn(
                  "rounded-xl border p-6",
                  p.featured
                    ? "border-[#A3E635]/30 bg-gradient-to-b from-[#A3E635]/[0.04] to-transparent"
                    : "border-white/[0.06] bg-[#0f1012]"
                )}
              >
                {p.featured && (
                  <div className="mb-3 inline-flex rounded-full border border-[#A3E635]/30 bg-[#A3E635]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#A3E635]">
                    Most popular
                  </div>
                )}
                <h3 className="text-sm font-medium text-white">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={cn("text-3xl font-semibold text-white", MONO)}>
                    {p.price}
                  </span>
                  <span className={cn("text-xs", TEXT_DIM)}>{p.period}</span>
                </div>
                <p className={cn("mt-2 text-xs leading-relaxed", TEXT_MUTED)}>{p.desc}</p>
                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-white/75">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-[#A3E635]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#waitlist" className="mt-6 block">
                  <Button
                    className={cn(
                      "h-10 w-full",
                      p.featured
                        ? "bg-white text-black hover:bg-white/90"
                        : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                    )}
                  >
                    {p.cta}
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMPARISON ============ */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <SectionHeading
            eyebrow="Compare"
            title="Why Promptbox, not a chat wrapper"
          />
          <div className={cn(PANEL_SOLID, "mt-12 overflow-hidden")}>
            <div className="grid grid-cols-4 border-b border-white/[0.06] px-5 py-3 text-[11px] uppercase tracking-wider text-white/50">
              <div>Capability</div>
              <div className="text-center text-white">Promptbox</div>
              <div className="text-center">Generic agent</div>
              <div className="text-center">Notion + LLM</div>
            </div>
            {compareRows.map(([label, a, b, c], i) => (
              <div
                key={label as string}
                className={cn(
                  "grid grid-cols-4 px-5 py-3 text-sm",
                  i % 2 === 1 && "bg-white/[0.015]"
                )}
              >
                <div className="text-white/80">{label}</div>
                <Cell v={a} accent />
                <Cell v={b} />
                <Cell v={c} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="border-t border-white/[0.06] bg-[#08080a]">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          <div className="mt-10">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className={cn(PANEL_SOLID, "border px-4")}
                >
                  <AccordionTrigger className="text-left text-sm font-medium text-white hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className={cn("text-sm leading-relaxed", TEXT_MUTED)}>
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section id="waitlist" className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <div className="text-center">
            <SectionLabel>
              <span className="h-1.5 w-1.5 rounded-full bg-[#A3E635]" />
              Early access
            </SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Build an agent that remembers.
            </h2>
            <p className={cn("mx-auto mt-3 max-w-xl text-base leading-relaxed", TEXT_MUTED)}>
              Join the waitlist and tell us what brain you want to build. We're
              onboarding serious builders first.
            </p>
          </div>
          <div className="mt-8">
            <WaitlistForm source="final-cta" />
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-white/[0.06] bg-[#08080a]">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                  <Brain className="h-4 w-4 text-white" strokeWidth={1.6} />
                </div>
                <span className="text-sm font-semibold text-white">Promptbox</span>
              </div>
              <p className={cn("mt-3 text-xs leading-relaxed", TEXT_MUTED)}>
                The second-brain layer for AI agents.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { label: "Waitlist", href: "#waitlist" },
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { label: "Contact", href: "/contact" },
                { label: "Status", href: "/status" },
                { label: "Careers", href: "/careers" },
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
              ]}
            />
          </div>
          <div className={cn("mt-10 flex flex-col items-start justify-between gap-2 border-t pt-6 text-[11px] sm:flex-row sm:items-center", HAIRLINE, TEXT_DIM)}>
            <div>© {new Date().getFullYear()} Promptbox</div>
            <div>Tokenized agent features subject to jurisdictional availability.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Cell({ v, accent = false }: { v: boolean | "partial"; accent?: boolean }) {
  if (v === true) {
    return (
      <div className="flex justify-center">
        <Check className={cn("h-4 w-4", accent ? "text-[#A3E635]" : "text-white/80")} />
      </div>
    );
  }
  if (v === "partial") {
    return (
      <div className={cn("text-center text-xs", TEXT_MUTED)}>partial</div>
    );
  }
  return (
    <div className="flex justify-center">
      <Minus className="h-4 w-4 text-white/20" />
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className={cn("text-[10px] uppercase tracking-[0.16em]", TEXT_DIM)}>
        {title}
      </div>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            {l.href.startsWith("/") ? (
              <Link
                to={l.href}
                className="text-xs text-white/70 hover:text-white"
              >
                {l.label}
              </Link>
            ) : (
              <a
                href={l.href}
                className="text-xs text-white/70 hover:text-white"
              >
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
