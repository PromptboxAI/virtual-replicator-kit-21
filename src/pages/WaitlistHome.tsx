import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { submitWaitlist } from "@/lib/waitlist";

/* =============================================================
   Promptbox /waitlist — second-brain layer for AI agents
   Self-contained: dark theme scoped via <style> + .dark on <html>
   ============================================================= */

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif&display=swap');

html.pb-waitlist-root { scroll-behavior: smooth; color-scheme: dark; }
html.pb-waitlist-root, html.pb-waitlist-root body { background:#06070b; color:#e7e9ef; }
.pb-waitlist { font-family:'Geist',ui-sans-serif,system-ui,sans-serif; font-feature-settings:'ss01','cv11'; -webkit-font-smoothing:antialiased; }
.pb-waitlist .font-display { font-family:'Geist',ui-sans-serif,system-ui; letter-spacing:-0.025em; }
.pb-waitlist .mono { font-family:'JetBrains Mono',ui-monospace,monospace; }
.pb-waitlist .font-serif { font-family:'Instrument Serif',ui-serif,Georgia; }

.pb-waitlist .bg-mesh {
  background:
    radial-gradient(60rem 30rem at 80% -10%, rgba(122,92,255,0.18), transparent 60%),
    radial-gradient(50rem 28rem at 10% 10%, rgba(54,200,238,0.12), transparent 60%),
    radial-gradient(40rem 20rem at 50% 100%, rgba(122,92,255,0.10), transparent 70%),
    #06070b;
}
.pb-waitlist .grid-noise {
  background-image:
    linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(80% 60% at 50% 30%, #000 30%, transparent 75%);
          mask-image: radial-gradient(80% 60% at 50% 30%, #000 30%, transparent 75%);
}

.pb-waitlist .glass {
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015));
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(14px);
}
.pb-waitlist .glass-strong {
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(20px);
}

.pb-waitlist .grad-text {
  background: linear-gradient(100deg,#fff 0%,#c8d4ff 35%,#5ee0ff 60%,#b59cff 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.pb-waitlist .grad-text-soft {
  background: linear-gradient(100deg,#fff 0%,#c0c8db 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

.pb-waitlist .btn-primary {
  background: linear-gradient(180deg,#6fe0ff 0%,#4cb6ff 100%);
  color:#04111a;
  box-shadow: 0 1px 0 rgba(255,255,255,0.6) inset, 0 0 0 1px rgba(255,255,255,0.15), 0 12px 40px -10px rgba(76,182,255,0.6);
  transition: transform .15s ease, filter .2s ease;
}
.pb-waitlist .btn-primary:hover { transform: translateY(-1px); filter: brightness(1.05); }
.pb-waitlist .btn-ghost {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  color:#e7e9ef;
}
.pb-waitlist .btn-ghost:hover { background: rgba(255,255,255,0.07); }

.pb-waitlist .chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  color:#c2c8d6; font-size: 12px;
  font-family:'JetBrains Mono',ui-monospace,monospace;
}
.pb-waitlist .chip .dot { width:6px; height:6px; border-radius:999px; background:#5ee0ff; box-shadow:0 0 12px #5ee0ff; }

@keyframes pb-pulse-dot { 0%,100%{box-shadow:0 0 0 0 rgba(94,224,255,0.7);} 50%{box-shadow:0 0 0 6px rgba(94,224,255,0);} }
.pb-waitlist .pulse-dot { animation: pb-pulse-dot 2.2s ease-in-out infinite; }

@keyframes pb-marquee { from{transform:translateX(0);} to{transform:translateX(-50%);} }
@keyframes pb-dash { to { stroke-dashoffset: -200; } }
.pb-waitlist .flowline { stroke-dasharray: 4 8; animation: pb-dash 6s linear infinite; }
@keyframes pb-nodepulse { 0%,100%{opacity:.9; transform:scale(1);} 50%{opacity:1; transform:scale(1.04);} }
.pb-waitlist .nodepulse { animation: pb-nodepulse 3.4s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }

.pb-waitlist .input {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.10);
  color:#e7e9ef; border-radius: 10px;
  padding: 12px 14px; font-size: 14px; width: 100%;
  transition: border-color .2s, background .2s, box-shadow .2s;
}
.pb-waitlist .input:focus { outline:none; border-color: rgba(94,224,255,0.5); background: rgba(255,255,255,0.05); box-shadow: 0 0 0 4px rgba(94,224,255,0.10); }
.pb-waitlist .input::placeholder { color:#6b7388; }
.pb-waitlist select.input {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%237b8398' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px;
}

.pb-waitlist .tier-featured {
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(94,224,255,0.10), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid rgba(94,224,255,0.30);
  box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 30px 80px -30px rgba(94,224,255,0.35);
}

.pb-waitlist details[open] .faq-icon { transform: rotate(45deg); }
.pb-waitlist .faq-icon { transition: transform .2s ease; }

.pb-waitlist .reveal { opacity: 0; transform: translateY(14px); transition: opacity .8s ease, transform .8s ease; }
.pb-waitlist .reveal.in { opacity: 1; transform: translateY(0); }

.pb-waitlist .nav-link { position: relative; }
.pb-waitlist .nav-link::after {
  content:""; position:absolute; left:0; right:0; bottom:-6px; height:1px;
  background: linear-gradient(90deg,#5ee0ff,#9a7cff);
  transform: scaleX(0); transform-origin:left; transition: transform .25s ease;
}
.pb-waitlist .nav-link:hover::after { transform: scaleX(1); }

/* Custom color utilities (cy/vi/ink palette) */
.pb-waitlist .text-cy-400 { color:#5ee0ff; }
.pb-waitlist .text-cy-400\\/60 { color: rgba(94,224,255,0.6); }
.pb-waitlist .text-vi-400 { color:#b59cff; }
.pb-waitlist .bg-cy-400 { background-color:#5ee0ff; }
.pb-waitlist .bg-cy-400\\/15 { background-color: rgba(94,224,255,0.15); }
.pb-waitlist .bg-vi-400 { background-color:#b59cff; }
.pb-waitlist .ring-cy-400\\/30 { --tw-ring-color: rgba(94,224,255,0.3); box-shadow: 0 0 0 1px rgba(94,224,255,0.3); }
.pb-waitlist .border-cy-400\\/30 { border-color: rgba(94,224,255,0.3); }
.pb-waitlist .border-vi-400\\/30 { border-color: rgba(181,156,255,0.3); }
.pb-waitlist .border-white\\/8 { border-color: rgba(255,255,255,0.08); }
.pb-waitlist .divide-white\\/8 > :not([hidden]) ~ :not([hidden]) { border-color: rgba(255,255,255,0.08); }
.pb-waitlist .divide-white\\/5 > :not([hidden]) ~ :not([hidden]) { border-top: 1px solid rgba(255,255,255,0.05); }
.pb-waitlist .from-ink-950 { --tw-gradient-from:#06070b var(--tw-gradient-from-position); --tw-gradient-to: rgba(6,7,11,0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
`;

/* ------------------------------ Icons ------------------------------ */
const Icon = ({ name, className = "w-5 h-5", stroke = 1.5 }: any) => {
  const common: any = {
    className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (name) {
    case "brain": return (<svg {...common}><path d="M9 4.5a2.5 2.5 0 0 0-5 0v0a2.5 2.5 0 0 0-2 4.5 2.5 2.5 0 0 0 0 5A2.5 2.5 0 0 0 4 19a2.5 2.5 0 0 0 5 .5V4.5Z"/><path d="M15 4.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 2 4.5 2.5 2.5 0 0 1 0 5 2.5 2.5 0 0 1-2 5 2.5 2.5 0 0 1-5 .5V4.5Z"/><path d="M9 9h2M13 9h2M9 14h2M13 14h2"/></svg>);
    case "graph": return (<svg {...common}><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="12" r="2.5"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M7 7l3.5 3.5M17 7l-3.5 3.5M10.5 13.5L7.5 17.5M13.5 13.5l3.2 4"/></svg>);
    case "spark": return (<svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>);
    case "shield": return (<svg {...common}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>);
    case "wallet": return (<svg {...common}><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M16 12.5h3M3 9h13a2 2 0 0 0 2-2V6"/></svg>);
    case "doc": return (<svg {...common}><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6M10 9h2"/></svg>);
    case "wand": return (<svg {...common}><path d="m4 20 12-12M14 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/><path d="M19 14l.6 1.6L21 16l-1.4.4L19 18l-.6-1.6L17 16l1.4-.4z"/></svg>);
    case "pulse": return (<svg {...common}><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>);
    case "loop": return (<svg {...common}><path d="M4 8a6 6 0 0 1 10-3l2 2M20 16a6 6 0 0 1-10 3l-2-2"/><path d="m14 5 2 2 2-2M10 19l-2-2-2 2"/></svg>);
    case "skill": return (<svg {...common}><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8l5.5-.8z"/></svg>);
    case "feed": return (<svg {...common}><path d="M4 4v16h16"/><path d="M8 16l3-4 3 2 4-6"/></svg>);
    case "lock": return (<svg {...common}><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>);
    case "coin": return (<svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9 9h4.5a2 2 0 0 1 0 4H9m0 0h5a2 2 0 0 1 0 4H9m3-10v12"/></svg>);
    case "users": return (<svg {...common}><circle cx="9" cy="9" r="3"/><path d="M3 19a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M21 19a6 6 0 0 0-4-5.7"/></svg>);
    case "search": return (<svg {...common}><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/></svg>);
    case "code": return (<svg {...common}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></svg>);
    case "chart": return (<svg {...common}><path d="M4 4v16h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></svg>);
    case "folder": return (<svg {...common}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>);
    case "check": return (<svg {...common}><path d="m5 12 4 4L19 7"/></svg>);
    case "x": return (<svg {...common}><path d="M6 6l12 12M18 6 6 18"/></svg>);
    case "arrow": return (<svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>);
    case "plus": return (<svg {...common}><path d="M12 5v14M5 12h14"/></svg>);
    case "menu": return (<svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>);
    case "dash": return (<svg {...common}><path d="M5 12h14"/></svg>);
    case "logo": return (
      <svg viewBox="0 0 28 28" className={className} fill="none">
        <defs>
          <linearGradient id="pb-lg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5ee0ff"/><stop offset="1" stopColor="#9a7cff"/>
          </linearGradient>
        </defs>
        <rect x="2.5" y="2.5" width="23" height="23" rx="7" stroke="url(#pb-lg1)" strokeWidth="1.6"/>
        <path d="M9 9h6.5a3.5 3.5 0 0 1 0 7H11v3" stroke="url(#pb-lg1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="19" cy="12.5" r="1.2" fill="#5ee0ff"/>
      </svg>
    );
    default: return null;
  }
};

/* ------------------------------ Building blocks ------------------------------ */
const Chip = ({ children, dot = true, tone = "cyan" }: any) => (
  <span className="chip">
    {dot && <span className="dot" style={{ background: tone === "violet" ? "#b59cff" : "#5ee0ff", boxShadow: `0 0 12px ${tone === "violet" ? "#b59cff" : "#5ee0ff"}` }} />}
    <span className="text-[11px] tracking-[0.12em] uppercase">{children}</span>
  </span>
);

const SectionLabel = ({ index, children }: any) => (
  <div className="flex items-center gap-3 text-[11px] mono tracking-[0.2em] uppercase text-white/40">
    <span className="text-cy-400">{index}</span>
    <span className="h-px w-8 bg-white/15" />
    <span>{children}</span>
  </div>
);

const Btn = ({ variant = "primary", className = "", children, as: Cmp = "button", ...rest }: any) => {
  const base = "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium tracking-tight";
  const cls = variant === "primary" ? `${base} btn-primary` : `${base} btn-ghost`;
  return <Cmp className={`${cls} ${className}`} {...rest}>{children}</Cmp>;
};

/* ------------------------------ Waitlist form ------------------------------ */
const WaitlistForm = ({ compact = false, idPrefix = "wl" }: any) => {
  const [state, setState] = useState({ email: "", name: "", role: "AI agent", note: "" });
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [err, setErr] = useState("");

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) { setErr("Enter a valid email."); return; }
    setStatus("loading");
    const res = await submitWaitlist({
      email: state.email, name: state.name,
      building_type: state.role, notes: state.note, source: "waitlist",
    });
    if (res.ok) setStatus("success");
    else { setStatus("error"); setErr(res.error || "Something went wrong."); }
  };

  if (status === "success") {
    return (
      <div className="glass rounded-2xl p-5 flex items-start gap-3">
        <div className="mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-cy-400/15 text-cy-400 ring-cy-400/30">
          <Icon name="check" className="w-4 h-4" stroke={2} />
        </div>
        <div>
          <div className="text-white text-sm font-medium">You're on the list.</div>
          <div className="text-white/55 text-sm mt-1">We'll notify you when early access opens. Watch your inbox for an invite to the V2 beta.</div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 w-full">
        <div className="relative flex-1">
          <input id={`${idPrefix}-email`} type="email" placeholder="you@company.com"
            value={state.email} onChange={(e) => setState({ ...state, email: e.target.value })}
            className="input" autoComplete="email" />
        </div>
        <Btn type="submit" className="shrink-0 whitespace-nowrap">
          {status === "loading" ? "Joining…" : "Join the Waitlist"}
          <Icon name="arrow" className="w-4 h-4" stroke={2} />
        </Btn>
        {err && <div className="text-xs text-rose-300 mt-1 sm:mt-0 sm:ml-2 self-center">{err}</div>}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass-strong rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cy-400 pulse-dot" />
          <span className="mono text-[11px] tracking-[0.2em] uppercase text-white/60">Waitlist · V2 Beta</span>
        </div>
        <span className="mono text-[11px] text-white/35">limited spots / day</span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-email`} className="mono text-[10px] tracking-[0.18em] uppercase text-white/45">Email</label>
        <input id={`${idPrefix}-email`} type="email" placeholder="you@company.com" className="input" value={state.email} onChange={(e) => setState({ ...state, email: e.target.value })} autoComplete="email" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-name`} className="mono text-[10px] tracking-[0.18em] uppercase text-white/45">Name</label>
        <input id={`${idPrefix}-name`} type="text" placeholder="Ada Lovelace" className="input" value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} autoComplete="name" />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor={`${idPrefix}-role`} className="mono text-[10px] tracking-[0.18em] uppercase text-white/45">What are you building?</label>
        <select id={`${idPrefix}-role`} className="input" value={state.role} onChange={(e) => setState({ ...state, role: e.target.value })}>
          <option>Personal second brain</option>
          <option>AI agent</option>
          <option>Crypto/tokenized agent</option>
          <option>Business knowledge base</option>
          <option>Research assistant</option>
          <option>Other</option>
        </select>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor={`${idPrefix}-note`} className="mono text-[10px] tracking-[0.18em] uppercase text-white/45">Tell us what kind of agent or brain you want to build <span className="text-white/30 normal-case">— optional</span></label>
        <textarea id={`${idPrefix}-note`} rows={3} placeholder="A crypto research agent that tracks 12 chains, summarizes governance forums, and ships a weekly thesis…" className="input resize-none" value={state.note} onChange={(e) => setState({ ...state, note: e.target.value })} />
      </div>
      <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
        <Btn type="submit" className="w-full sm:w-auto">
          {status === "loading" ? "Joining…" : "Join the Promptbox Waitlist"}
          <Icon name="arrow" className="w-4 h-4" stroke={2} />
        </Btn>
        <div className="text-[12px] text-white/45">No spam. No selling. Invites in waves as runtime capacity opens.</div>
      </div>
      {err && <div className="sm:col-span-2 text-xs text-rose-300">{err}</div>}
    </form>
  );
};

/* ------------------------------ Cards ------------------------------ */
const FeatureCard = ({ icon, title, desc, accent = "cyan", index }: any) => {
  const tone = accent === "violet"
    ? { ring: "rgba(154,124,255,0.35)", glow: "rgba(154,124,255,0.18)", text: "#b59cff" }
    : { ring: "rgba(94,224,255,0.35)", glow: "rgba(94,224,255,0.16)", text: "#5ee0ff" };
  return (
    <div className="group relative glass rounded-2xl p-5 sm:p-6 overflow-hidden h-full">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
           style={{ background: `radial-gradient(40rem 20rem at 0% 0%, ${tone.glow}, transparent 50%)` }} />
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${tone.ring}`, color: tone.text }}>
          <Icon name={icon} className="w-5 h-5" />
        </div>
        <span className="mono text-[10px] tracking-[0.18em] text-white/30">{index}</span>
      </div>
      <h3 className="mt-5 text-[17px] font-medium text-white tracking-tight">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{desc}</p>
    </div>
  );
};

const PricingCard = ({ tier, price, sub, desc, features, cta, featured = false, badge }: any) => (
  <div className={`relative rounded-2xl p-6 sm:p-7 flex flex-col h-full ${featured ? "tier-featured" : "glass"}`}>
    {badge && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 mono text-[10px] tracking-[0.18em] uppercase px-3 py-1 rounded-full"
           style={{ background: "linear-gradient(180deg,#5ee0ff,#9a7cff)", color: "#06070b" }}>{badge}</div>
    )}
    <div className="flex items-baseline justify-between">
      <div className="text-white text-[15px] font-medium tracking-tight">{tier}</div>
      <div className="mono text-[10px] text-white/35 tracking-[0.18em] uppercase">Early Access</div>
    </div>
    <div className="mt-4 flex items-baseline gap-2">
      <div className={`text-[28px] font-semibold tracking-tight ${featured ? "grad-text" : "text-white"}`}>{price}</div>
      {sub && <div className="text-[12px] text-white/45">{sub}</div>}
    </div>
    <p className="mt-3 text-[13px] leading-relaxed text-white/55">{desc}</p>
    <ul className="mt-5 space-y-2.5">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-white/75">
          <span className="mt-[3px] inline-flex w-4 h-4 rounded-full items-center justify-center" style={{ background: featured ? "rgba(94,224,255,0.18)" : "rgba(255,255,255,0.06)", color: featured ? "#5ee0ff" : "#a8b0c2" }}>
            <Icon name="check" className="w-3 h-3" stroke={2.5} />
          </span>
          {f}
        </li>
      ))}
    </ul>
    <div className="mt-7 pt-5 border-t border-white/8">
      <Btn variant={featured ? "primary" : "ghost"} className="w-full">
        {cta}<Icon name="arrow" className="w-4 h-4" stroke={2} />
      </Btn>
    </div>
  </div>
);

const HowItWorksStep = ({ n, title, desc, icon, accent }: any) => (
  <div className="relative glass rounded-2xl p-5 sm:p-6 h-full">
    <div className="flex items-start gap-4">
      <div className="shrink-0">
        <div className="mono text-[10px] tracking-[0.2em] text-white/40">STEP</div>
        <div className="font-serif text-[40px] leading-none mt-1" style={{ color: accent === "violet" ? "#b59cff" : "#5ee0ff" }}>{String(n).padStart(2,"0")}</div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-white/60"><Icon name={icon} className="w-4 h-4"/></span>
          <h3 className="text-white text-[16px] font-medium tracking-tight">{title}</h3>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{desc}</p>
      </div>
    </div>
  </div>
);

const UseCaseCard = ({ icon, title, desc, tag }: any) => (
  <div className="relative glass rounded-2xl p-5 sm:p-6 h-full">
    <div className="flex items-center justify-between">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/10 text-cy-400">
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <span className="mono text-[10px] tracking-[0.18em] text-white/35 uppercase">{tag}</span>
    </div>
    <h3 className="mt-4 text-white text-[15.5px] font-medium tracking-tight">{title}</h3>
    <p className="mt-2 text-[13px] leading-relaxed text-white/55">{desc}</p>
  </div>
);

const FAQItem = ({ q, a }: any) => (
  <details className="group glass rounded-xl p-5 open:bg-white/[0.04]">
    <summary className="list-none flex items-start justify-between gap-6 cursor-pointer">
      <span className="text-white text-[15px] font-medium tracking-tight">{q}</span>
      <span className="faq-icon shrink-0 mt-1 w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 text-white/70">
        <Icon name="plus" className="w-3.5 h-3.5" stroke={2} />
      </span>
    </summary>
    <p className="mt-3 text-[13.5px] leading-relaxed text-white/60 max-w-3xl">{a}</p>
  </details>
);

/* ------------------------------ Nav ------------------------------ */
const TopNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-4"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className={`flex items-center justify-between rounded-2xl px-3 sm:px-4 py-2.5 transition-all duration-300 ${scrolled ? "glass-strong shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)]" : "border border-transparent"}`}>
          <a href="#top" className="flex items-center gap-2.5 pl-1">
            <Icon name="logo" className="w-7 h-7" />
            <span className="text-white text-[15px] font-semibold tracking-tight">Promptbox</span>
            <span className="hidden sm:inline mono text-[10px] tracking-[0.18em] text-white/40 ml-2 border-l border-white/10 pl-3">V2</span>
          </a>
          <div className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="nav-link text-[13.5px] text-white/65 hover:text-white">{l.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <a href="#waitlist-top" className="hidden sm:inline-flex btn-primary text-[13px] font-medium px-4 py-2 rounded-xl">Join Waitlist</a>
            <button onClick={() => setOpen(v => !v)} className="md:hidden w-9 h-9 rounded-lg border border-white/10 bg-white/[0.04] text-white/80 flex items-center justify-center" aria-label="Toggle menu">
              <Icon name={open ? "x" : "menu"} className="w-4 h-4" stroke={2} />
            </button>
          </div>
        </nav>
        {open && (
          <div className="md:hidden mt-2 glass-strong rounded-2xl p-3 flex flex-col">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-3 py-2 text-[14px] text-white/75 hover:text-white">{l.label}</a>
            ))}
            <a href="#waitlist-top" onClick={() => setOpen(false)} className="mt-1 btn-primary text-[13px] font-medium px-4 py-2.5 rounded-xl text-center">Join Waitlist</a>
          </div>
        )}
      </div>
    </header>
  );
};

/* ------------------------------ Reveal ------------------------------ */
const Reveal = ({ children, className = "", delay = 0 }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.style.transitionDelay = delay + "ms";
        el.classList.add("in");
        io.disconnect();
      }
    }, { rootMargin: "-50px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
};

/* ------------------------------ Visuals ------------------------------ */
const BrainGraphVisual = ({ animated = true, dense = false, className = "" }: any) => {
  const nodes = dense ? [
    { id: "core", label: "Brain", x: 300, y: 200, r: 22, kind: "core" },
    { id: "raw", label: "Raw Sources", x: 110, y: 90, r: 16, kind: "data" },
    { id: "wiki", label: "Wiki", x: 480, y: 90, r: 16, kind: "data" },
    { id: "mem", label: "Memory", x: 90, y: 230, r: 14, kind: "data" },
    { id: "skills", label: "Skills", x: 510, y: 220, r: 14, kind: "skill" },
    { id: "out", label: "Outputs", x: 165, y: 340, r: 14, kind: "data" },
    { id: "proof", label: "Proof Feed", x: 440, y: 340, r: 14, kind: "proof" },
    { id: "wallet", label: "Wallet", x: 300, y: 380, r: 12, kind: "fi" },
    { id: "health", label: "Health Checks", x: 300, y: 60, r: 12, kind: "skill" },
    { id: "claude", label: "Claude Runtime", x: 590, y: 290, r: 11, kind: "skill" },
    { id: "hermes", label: "Hermes Loops", x: 20, y: 290, r: 11, kind: "skill" },
  ] : [
    { id: "core", label: "Brain", x: 260, y: 180, r: 22, kind: "core" },
    { id: "raw", label: "Research", x: 80, y: 80, r: 14, kind: "data" },
    { id: "wiki", label: "Memory", x: 80, y: 280, r: 14, kind: "data" },
    { id: "out", label: "Outputs", x: 440, y: 90, r: 14, kind: "data" },
    { id: "skills", label: "Skills", x: 460, y: 250, r: 14, kind: "skill" },
    { id: "wallet", label: "Wallet", x: 260, y: 340, r: 12, kind: "fi" },
    { id: "proof", label: "Proof Feed", x: 260, y: 30, r: 12, kind: "proof" },
  ];
  const edges: any = dense ? [
    ["core","raw"],["core","wiki"],["core","mem"],["core","skills"],["core","out"],["core","proof"],["core","wallet"],["core","health"],
    ["raw","wiki"],["wiki","skills"],["mem","out"],["out","proof"],["skills","claude"],["mem","hermes"],["proof","wallet"],["health","wiki"],
  ] : [
    ["core","raw"],["core","wiki"],["core","out"],["core","skills"],["core","wallet"],["core","proof"],
    ["raw","out"],["wiki","skills"],["out","proof"],
  ];
  const colorFor = (kind: string) => ({ core:"#5ee0ff", data:"#9bb2ff", skill:"#b59cff", proof:"#7ae0c0", fi:"#ffd27a" }[kind] || "#9bb2ff");
  const nodeMap: any = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);
  const w = 600, h = 400;
  const gid = useMemo(() => "g" + Math.random().toString(36).slice(2,8), []);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id={`coreGlow-${gid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5ee0ff" stopOpacity="0.45"/>
          <stop offset="60%" stopColor="#5ee0ff" stopOpacity="0.06"/>
          <stop offset="100%" stopColor="#5ee0ff" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={`edgeGrad-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5ee0ff" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#9a7cff" stopOpacity="0.55"/>
        </linearGradient>
        <filter id={`soft-${gid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      {nodeMap.core && <circle cx={nodeMap.core.x} cy={nodeMap.core.y} r={90} fill={`url(#coreGlow-${gid})`} />}
      <g>
        {edges.map(([a,b]: any, i: number) => {
          const A = nodeMap[a], B = nodeMap[b]; if (!A || !B) return null;
          return (
            <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke={`url(#edgeGrad-${gid})`} strokeOpacity="0.55"
              strokeWidth={a === "core" || b === "core" ? 1.2 : 0.7}
              className={animated && (a === "core" || b === "core") ? "flowline" : ""} />
          );
        })}
      </g>
      <g>
        {nodes.map((n: any) => {
          const c = colorFor(n.kind);
          const isCore = n.kind === "core";
          return (
            <g key={n.id} className={animated ? "nodepulse" : ""} style={{ animationDelay: `${(n.x % 7) * 0.2}s` }}>
              <circle cx={n.x} cy={n.y} r={n.r + 4} fill={c} opacity="0.12" filter={`url(#soft-${gid})`} />
              <circle cx={n.x} cy={n.y} r={n.r} fill="#0a0c12" stroke={c} strokeWidth={isCore ? 1.8 : 1.2} />
              {isCore && <circle cx={n.x} cy={n.y} r={n.r - 6} fill={c} opacity="0.18" />}
              {isCore && <text x={n.x} y={n.y + 4} textAnchor="middle" fill="#e7e9ef" fontSize="11" fontFamily="JetBrains Mono" fontWeight="600">BRAIN</text>}
              {!isCore && <text x={n.x} y={n.y + n.r + 14} textAnchor="middle" fill="#a8b0c2" fontSize="10.5" fontFamily="JetBrains Mono">{n.label}</text>}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

const SparkLine = ({ values, color = "#5ee0ff", w = 220, h = 36 }: any) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v: number, i: number) => [i * step, h - ((v - min) / range) * (h - 4) - 2]);
  const d = pts.map((p: number[], i: number) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = `M0 ${h} ${d.replace(/^M/, "L")} L${w} ${h} Z`;
  const id = useMemo(() => "sf" + Math.random().toString(36).slice(2,8), []);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
};

const Stat = ({ label, value, delta, color = "#5ee0ff", big = false, small = false }: any) => (
  <div className="rounded-xl bg-white/[0.03] border border-white/8 p-2.5 sm:p-3">
    <div className="flex items-center justify-between">
      <div className="mono text-[9.5px] tracking-[0.18em] text-white/45 uppercase">{label}</div>
      {delta && <div className="mono text-[10px]" style={{ color }}>{delta}</div>}
    </div>
    <div className={`mt-1 text-white font-medium tracking-tight ${big ? "text-[20px]" : "text-[18px]"} ${small ? "text-[14px]" : ""}`} style={{ color: small ? color : "#fff" }}>{value}</div>
  </div>
);

const AgentDashboard = () => {
  const proofEvents = [
    { t: "wiki", text: "Updated topic page · Restaking on Eigenlayer", time: "2m" },
    { t: "out",  text: "Saved output · Weekly thesis v14", time: "11m" },
    { t: "mem",  text: "Memory committed · Risk rule R-07", time: "23m" },
    { t: "skill",text: "Skill improved · /summarize-gov-forum", time: "1h" },
  ];
  const tone: any = {
    wiki: { color:"#9bb2ff", label:"WIKI" }, out:{ color:"#7ae0c0", label:"OUT" },
    mem:{ color:"#5ee0ff", label:"MEM" }, skill:{ color:"#b59cff", label:"SKL" },
    health:{ color:"#ffd27a", label:"HLT" }, raw:{ color:"#a8b0c2", label:"RAW" },
  };
  return (
    <div className="relative">
      <div className="absolute -inset-10 -z-10 opacity-80 pointer-events-none"
           style={{ background: "radial-gradient(40rem 24rem at 60% 30%, rgba(94,224,255,0.20), transparent 60%), radial-gradient(40rem 24rem at 30% 80%, rgba(154,124,255,0.18), transparent 60%)" }} />
      <div className="glass-strong rounded-3xl p-4 sm:p-5 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between px-1.5 pb-3 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(140deg, rgba(94,224,255,0.25), rgba(154,124,255,0.25))", border: "1px solid rgba(255,255,255,0.15)" }}>
              <Icon name="brain" className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-white text-[13.5px] font-medium tracking-tight">AlphaScout AI</div>
              <div className="mono text-[10px] tracking-[0.16em] text-white/40 uppercase">agent · public</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip" style={{ padding: "4px 10px" }}>
              <span className="dot pulse-dot" />
              <span className="text-[10px]">BRAIN · GROWING</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
          <Stat label="Raw Sources" value="128" delta="+14" color="#9bb2ff"/>
          <Stat label="Wiki Pages" value="34" delta="+2" color="#5ee0ff"/>
          <Stat label="Skills" value="9" delta="+1" color="#b59cff"/>
          <Stat label="Health" value="92%" delta="+3" color="#7ae0c0" big/>
          <Stat label="Proof Events" value="47" delta="+5" color="#ffd27a" big/>
          <Stat label="Token" value="Optional" small color="#a8b0c2" big/>
        </div>

        <div className="mt-4 rounded-2xl border border-white/8 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(255,255,255,0.04),transparent)] p-2">
          <div className="flex items-center justify-between px-2 pt-1.5">
            <div className="mono text-[10px] tracking-[0.2em] text-white/45 uppercase">brain map</div>
            <div className="flex items-center gap-3 text-[10px] mono text-white/35">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#5ee0ff]"/>core</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#9bb2ff]"/>data</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#b59cff]"/>skill</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#7ae0c0]"/>proof</span>
            </div>
          </div>
          <BrainGraphVisual className="w-full h-[180px] sm:h-[200px]" />
        </div>

        <div className="mt-3 rounded-2xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Icon name="feed" className="w-3.5 h-3.5 text-cy-400"/>
              <div className="text-white/85 text-[12px] font-medium">Public proof feed</div>
            </div>
            <div className="mono text-[10px] text-white/40">LIVE</div>
          </div>
          <div className="divide-y divide-white/5">
            {proofEvents.map((e, i) => {
              const t = tone[e.t];
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2 text-[12px]">
                  <span className="mono text-[9.5px] tracking-[0.16em] px-1.5 py-0.5 rounded" style={{ background: `${t.color}1a`, color: t.color, border: `1px solid ${t.color}33` }}>{t.label}</span>
                  <span className="text-white/75 truncate">{e.text}</span>
                  <span className="ml-auto mono text-[10px] text-white/35">{e.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/8 p-3">
            <div className="flex items-center justify-between">
              <div className="mono text-[10px] tracking-[0.18em] text-white/40 uppercase">brain growth</div>
              <div className="text-[11px] text-white/55">last 14d</div>
            </div>
            <SparkLine values={[4,6,5,8,10,9,12,14,13,17,19,21,24,28]} />
          </div>
          <div className="rounded-xl border border-white/8 p-3">
            <div className="flex items-center justify-between">
              <div className="mono text-[10px] tracking-[0.18em] text-white/40 uppercase">health score</div>
              <div className="text-[11px]" style={{ color: "#7ae0c0" }}>+3</div>
            </div>
            <SparkLine values={[78,80,82,81,84,85,86,88,89,88,90,91,92,92]} color="#7ae0c0"/>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex absolute -left-6 top-24 glass-strong rounded-2xl px-3 py-2 items-center gap-2">
        <Icon name="loop" className="w-4 h-4 text-vi-400"/>
        <span className="text-[12px] text-white/80">Hermes loop · 03</span>
        <span className="mono text-[10px] text-white/40">14:02</span>
      </div>
      <div className="hidden lg:flex absolute -right-4 bottom-16 glass-strong rounded-2xl px-3 py-2 items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#7ae0c0] pulse-dot"/>
        <span className="text-[12px] text-white/80">Wallet ready</span>
      </div>
    </div>
  );
};

const BrainFolderTree = () => {
  const groups = [
    { name: "Raw", count: 128, items: ["meeting-2026-05-12.md", "eigen-paper.pdf", "telegram-export.json", "screenshots/", "+ 124 more"], color: "#a8b0c2" },
    { name: "Wiki", count: 34, items: ["Restaking", "Modular DA", "Risk Framework", "Counterparties", "+ 30 more"], color: "#9bb2ff" },
    { name: "Outputs", count: 86, items: ["Thesis v14", "Daily brief 05-23", "Counterparty memo", "Watchlist diff"], color: "#7ae0c0" },
    { name: "Memory", count: 211, items: ["Risk rule R-07", "Pref: terse summaries", "Decision: cap exposure 8%", "Correction: re-check oracle"], color: "#5ee0ff" },
    { name: "Skills", count: 9, items: ["/summarize-gov-forum", "/draft-thesis", "/scan-watchlist", "/risk-check"], color: "#b59cff" },
    { name: "Health Checks", count: 5, items: ["3 stale pages", "1 orphan note", "2 missing sources", "Coverage: 87%"], color: "#ffd27a" },
    { name: "Proof Feed", count: 47, items: ["Public log", "Visible to followers", "Cryptographic timestamps"], color: "#ff9ec7" },
  ];
  return (
    <div className="glass-strong rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Icon name="folder" className="w-4 h-4 text-cy-400"/>
          <div className="text-white text-[13.5px] font-medium">/promptbox-brain</div>
          <span className="mono text-[10px] text-white/40 ml-2">read · write · grow</span>
        </div>
        <span className="mono text-[10px] text-white/40">v2.0 · beta</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
        {groups.map((g) => (
          <div key={g.name} className="rounded-xl bg-white/[0.02] border border-white/8 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }}/>
                <div className="text-white text-[13.5px] font-medium">{g.name}</div>
              </div>
              <div className="mono text-[10.5px] text-white/45">{g.count}</div>
            </div>
            <ul className="mt-2 space-y-1">
              {g.items.map((it, i) => (
                <li key={i} className="mono text-[11px] text-white/55 truncate"><span className="text-white/30 mr-1">├─</span>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between px-1">
        <div className="text-[12px] text-white/45">Obsidian-inspired. Agent-native. Built for hosted AI products.</div>
        <div className="mono text-[10px] text-white/35">last sync · just now</div>
      </div>
    </div>
  );
};

/* ------------------------------ Sections ------------------------------ */
const MiniStat = ({ k, v }: any) => (
  <div className="glass rounded-xl px-3 py-2.5">
    <div className="mono text-[9.5px] tracking-[0.2em] text-white/40 uppercase">{k}</div>
    <div className="text-white text-[13.5px] font-medium tracking-tight mt-0.5">{v}</div>
  </div>
);

const HeroSection = () => (
  <section id="top" className="relative pt-28 sm:pt-32 pb-12 sm:pb-20 overflow-hidden">
    <div className="absolute inset-0 bg-mesh -z-10" />
    <div className="absolute inset-0 grid-noise -z-10" />
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2.5">
            <Chip>V2 Waitlist Now Open</Chip>
            <Chip tone="violet">Second brains for AI agents</Chip>
          </div>
          <h1 className="mt-7 text-[44px] sm:text-[58px] lg:text-[68px] leading-[0.98] tracking-tight font-display font-medium">
            <span className="grad-text-soft">Build the </span>
            <span className="grad-text">second brain</span>
            <span className="grad-text-soft"> for your AI agent.</span>
          </h1>
          <p className="mt-6 text-[16px] sm:text-[17px] leading-relaxed text-white/65 max-w-xl">
            Promptbox gives every agent persistent memory, an organized wiki, a visual brain graph,
            reusable skills, recurring health checks, public proof-of-work, and optional
            wallet-ready architecture for tokenized agents.
          </p>
          <div id="waitlist-top" className="mt-8 max-w-xl">
            <WaitlistForm compact />
            <div className="mt-3 text-[12.5px] text-white/45">For AI builders, creators, researchers, and crypto-native agent teams.</div>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#how" className="btn-ghost text-[13px] font-medium px-4 py-2.5 rounded-xl inline-flex items-center gap-2">
              See how it works <Icon name="arrow" className="w-4 h-4" stroke={2} />
            </a>
            <div className="flex items-center gap-2 mono text-[11px] text-white/40">
              <span className="w-1 h-1 rounded-full bg-white/40"/>Claude · Hermes · MCP-friendly
            </div>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-3 max-w-xl">
            <MiniStat k="Persistent" v="memory" />
            <MiniStat k="AI-managed" v="wiki" />
            <MiniStat k="Wallet-ready" v="agents" />
          </div>
        </div>
        <div className="relative"><AgentDashboard /></div>
      </div>
    </div>
  </section>
);

const Marquee = () => {
  const items = [
    "Most agents forget.","Promptbox makes them compound.","Raw dump → AI wiki → working agent.",
    "Memory · Skills · Proof · Health.","Claude-powered. Hermes-ready.",
    "Public proof before financial layers.","Wallet-ready, not wallet-required.",
  ];
  return (
    <div className="relative py-8 border-y border-white/8 overflow-hidden bg-white/[0.015]">
      <div className="flex whitespace-nowrap" style={{ animation: "pb-marquee 38s linear infinite", width: "200%" }}>
        {[...items, ...items, ...items, ...items].map((t, i) => (
          <div key={i} className="flex items-center gap-6 pr-10">
            <span className="text-white/55 text-[15px] sm:text-[17px] tracking-tight">{t}</span>
            <span className="text-cy-400/60">◆</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#06070b] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#06070b] to-transparent" />
    </div>
  );
};

const PositionCard = ({ n, title, text, sample, accent }: any) => (
  <div className="relative glass rounded-2xl p-6 h-full overflow-hidden">
    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 blur-3xl" style={{ background: accent }} />
    <div className="flex items-baseline justify-between">
      <div className="mono text-[10px] tracking-[0.2em] text-white/40">{n}</div>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}/>
    </div>
    <h3 className="mt-4 text-[26px] tracking-tight font-medium" style={{ color: accent }}>{title}</h3>
    <p className="mt-3 text-[14px] leading-relaxed text-white/60">{text}</p>
    <div className="mt-6 rounded-xl border border-white/8 bg-black/30 p-3 space-y-2">
      {sample.map((s: any, i: number) => (
        <div key={i} className="flex items-center gap-2.5 text-[11.5px]">
          <span className="mono text-[9.5px] tracking-[0.16em] px-1.5 py-0.5 rounded" style={{ background: `${accent}1a`, color: accent, border: `1px solid ${accent}55` }}>{s.k}</span>
          <span className="text-white/65 truncate">{s.t}</span>
        </div>
      ))}
    </div>
  </div>
);

const PositioningSection = () => (
  <section className="relative py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <Reveal><SectionLabel index="01">The problem</SectionLabel></Reveal>
      <Reveal delay={80}>
        <h2 className="mt-5 max-w-4xl text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.02] tracking-tight font-display font-medium">
          <span className="grad-text-soft">Most AI agents are disposable.</span><br/>
          <span className="grad-text">Promptbox makes them compound.</span>
        </h2>
      </Reveal>
      <Reveal delay={160}>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-white/60">
          Today, anyone can spin up an agent. The problem: most agents forget, reset, lose context,
          and never become a durable asset. Promptbox gives every agent a structured second brain
          that captures knowledge, organizes it into a living wiki, saves useful outputs, tracks
          decisions, and improves through recurring health checks.
        </p>
      </Reveal>
      <div className="mt-14 grid md:grid-cols-3 gap-4">
        <Reveal delay={0}>
          <PositionCard n="01" title="Remember"
            text="Agents retain files, notes, decisions, outputs, and corrections. Memory persists across runs, sessions, and runtimes."
            accent="#5ee0ff"
            sample={[{k:"MEM",t:"Risk rule R-07 committed"},{k:"PRF",t:"Prefers terse summaries"},{k:"DEC",t:"Cap exposure at 8% per name"}]} />
        </Reveal>
        <Reveal delay={80}>
          <PositionCard n="02" title="Organize"
            text="Raw knowledge becomes a structured AI-managed wiki — topic pages, internal links, and a clean index."
            accent="#9a7cff"
            sample={[{k:"WIKI",t:"Restaking · 14 sources"},{k:"WIKI",t:"Modular DA · 9 sources"},{k:"WIKI",t:"Risk Framework · 22 sources"}]} />
        </Reveal>
        <Reveal delay={160}>
          <PositionCard n="03" title="Improve"
            text="Health checks find gaps, contradictions, stale information, missing sources, and new opportunities."
            accent="#7ae0c0"
            sample={[{k:"HLT",t:"3 stale pages flagged"},{k:"HLT",t:"1 orphan note"},{k:"HLT",t:"Coverage 87% (+4)"}]} />
        </Reveal>
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => {
  const steps = [
    { n:1, icon:"doc",   title:"Dump Knowledge", desc:"Upload notes, PDFs, links, transcripts, screenshots, docs, and raw ideas — anything that belongs in the brain.", accent:"cyan" },
    { n:2, icon:"wand",  title:"AI Librarian Builds the Wiki", desc:"Promptbox organizes messy information into clean topic pages, indexes, and linked knowledge.", accent:"cyan" },
    { n:3, icon:"search",title:"Ask the Brain", desc:"Query the agent's second brain and get answers grounded in its own organized knowledge — not just retrieval.", accent:"violet" },
    { n:4, icon:"feed",  title:"Save Outputs Back", desc:"Useful answers, reports, strategies, and decisions are saved back into the brain so it compounds.", accent:"violet" },
    { n:5, icon:"shield",title:"Run Health Checks", desc:"Audit contradictions, stale pages, missing sources, orphaned notes, and weak coverage areas.", accent:"cyan" },
    { n:6, icon:"spark", title:"Deploy as an Agent", desc:"Run the brain with Claude, Hermes, or future agent runtimes. Public, private, or tokenized.", accent:"violet" },
  ];
  return (
    <section id="how" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <Reveal><SectionLabel index="02">How it works</SectionLabel></Reveal>
            <Reveal delay={80}><h2 className="mt-5 max-w-3xl text-[34px] sm:text-[44px] leading-[1.02] tracking-tight font-display font-medium grad-text-soft">From raw dump to working agent — in six moves.</h2></Reveal>
          </div>
          <Reveal delay={120}>
            <div className="text-[13px] text-white/45 max-w-sm">The brain is the product. The agent is the surface. Promptbox handles the loop in between.</div>
          </Reveal>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 60}><HowItWorksStep {...s} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const features = [
    { icon:"doc",   title:"Raw Dump Inbox",       desc:"Drop in anything: documents, notes, URLs, chat exports, screenshots, meeting transcripts, PDFs, and research." },
    { icon:"wand",  title:"AI-Generated Wiki",     desc:"Promptbox turns messy inputs into structured pages, topic clusters, summaries, and internal links.", accent:"violet" },
    { icon:"graph", title:"Visual Brain Graph",    desc:"See your agent's knowledge as a living graph of sources, memories, outputs, skills, and decisions." },
    { icon:"brain", title:"Persistent Memory",     desc:"Agents remember corrections, preferences, decisions, task history, lessons learned, and important context.", accent:"violet" },
    { icon:"skill", title:"Reusable Skills",       desc:"Turn repeated workflows into agent skills that can be reused, improved, and shared." },
    { icon:"pulse", title:"Brain Health Checks",   desc:"Audit the brain for contradictions, stale information, missing sources, weak coverage, and suggested improvements.", accent:"violet" },
    { icon:"code",  title:"Claude Standard Agents",desc:"Launch reliable Claude-powered agents with structured memory and second-brain retrieval." },
    { icon:"loop",  title:"Hermes Self-Learning Mode", desc:"Advanced agents can use Hermes-style self-learning loops, task agents, skill creation, and deeper memory improvement.", accent:"violet" },
    { icon:"feed",  title:"Public Proof Feed",     desc:"Public agents can show what they learned, created, updated, proposed, or executed over time." },
    { icon:"coin",  title:"Optional Tokenized Agents", desc:"Turn serious public agents into tokenized communities with future wallet, treasury, and AgentFi features.", accent:"violet" },
  ];
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal><SectionLabel index="03">Features</SectionLabel></Reveal>
        <div className="mt-5 flex items-end justify-between flex-wrap gap-6">
          <Reveal delay={80}>
            <h2 className="max-w-3xl text-[34px] sm:text-[44px] leading-[1.02] tracking-tight font-display font-medium grad-text-soft">
              Everything an agent needs to behave like an asset, not a session.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="max-w-md text-[14px] text-white/55">Ten primitives that turn an LLM call into a brain — and a brain into an agent worth keeping.</p>
          </Reveal>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 40}><FeatureCard {...f} index={String(i + 1).padStart(2, "0")} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

const BrainSection = () => (
  <section className="relative py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
        <div>
          <Reveal><SectionLabel index="04">The Brain</SectionLabel></Reveal>
          <Reveal delay={80}>
            <h2 className="mt-5 text-[34px] sm:text-[44px] leading-[1.02] tracking-tight font-display font-medium">
              <span className="grad-text-soft">What is a </span>
              <span className="grad-text">Promptbox Brain</span>
              <span className="grad-text-soft">?</span>
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-white/60">
              A Promptbox Brain is an AI-managed knowledge system attached to an agent. It contains
              raw sources, organized wiki pages, saved outputs, memory, skills, decisions, and
              health checks. The brain gets more valuable the more it is used.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-7 grid grid-cols-2 gap-2.5 max-w-md">
              {[["Hosted","Not a local app"],["Agent-native","Built for AI loops"],["Permissioned","Public / private / tokenized"],["Composable","Plays with Claude + Hermes"]].map(([k, v]) => (
                <div key={k} className="glass rounded-xl px-3 py-2.5">
                  <div className="mono text-[10px] tracking-[0.18em] text-white/40 uppercase">{k}</div>
                  <div className="text-white text-[13px] mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={120}><BrainFolderTree /></Reveal>
      </div>
    </div>
  </section>
);

const GraphShowcaseSection = () => (
  <section className="relative py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid lg:grid-cols-[1fr_0.85fr] gap-12 items-center">
        <Reveal>
          <div className="relative glass-strong rounded-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="graph" className="w-4 h-4 text-cy-400"/>
                <div className="text-white text-[13.5px] font-medium">Brain graph · AlphaScout AI</div>
              </div>
              <div className="flex items-center gap-2 mono text-[10px] text-white/40">
                <span>Z 1.0</span><span>·</span><span>234 nodes</span><span>·</span><span>682 edges</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(255,255,255,0.04),transparent)]">
              <BrainGraphVisual dense className="w-full h-[420px] sm:h-[500px]" />
            </div>
          </div>
        </Reveal>
        <div>
          <Reveal><SectionLabel index="05">Visual brain graph</SectionLabel></Reveal>
          <Reveal delay={80}>
            <h2 className="mt-5 text-[32px] sm:text-[40px] leading-[1.05] tracking-tight font-display font-medium grad-text-soft">
              Your agent's mind, made visible.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/60">
              The brain graph is more than a knowledge map. Every node is a real thing the agent
              owns — a source, a wiki page, a memory, a skill, an output, a decision. Edges show how
              knowledge flows: where it came from, what it produced, and what the agent learned.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <ul className="mt-6 space-y-3 max-w-lg">
              {[["Sources","Files, links, screenshots, transcripts."],["Wiki","AI-organized topic pages and indexes."],["Memory","Decisions, corrections, preferences."],["Skills","Reusable workflows and procedures."],["Outputs","Reports, drafts, strategies, theses."],["Proof","Public log of what the agent did."]].map(([k, v]) => (
                <li key={k} className="flex items-start gap-3 text-[14px]">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full" style={{ background: "#5ee0ff", boxShadow: "0 0 8px #5ee0ff" }}/>
                  <span className="text-white/85 font-medium w-20 shrink-0">{k}</span>
                  <span className="text-white/55">{v}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
);

const UseCasesSection = () => {
  const cases = [
    { tag:"01", icon:"chart", title:"Crypto Research Agents", desc:"Track markets, summarize sources, build watchlists, save theses, and publish proof-of-work." },
    { tag:"02", icon:"users", title:"Creator Brains",         desc:"Turn a creator's content, ideas, notes, and voice into a persistent AI assistant." },
    { tag:"03", icon:"doc",   title:"Business Knowledge Agents", desc:"Upload SOPs, docs, meeting notes, policies, and internal knowledge to create a living company brain." },
    { tag:"04", icon:"pulse", title:"Trading Assistants",     desc:"Create agents that research, propose, and document trading ideas with clear memory and risk rules." },
    { tag:"05", icon:"brain", title:"Expert Assistants",      desc:"Turn specialized knowledge into an agent that can answer, draft, research, and improve over time." },
    { tag:"06", icon:"feed",  title:"Community Agents",       desc:"Give communities an agent that remembers decisions, summarizes activity, and maintains a public knowledge base." },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal><SectionLabel index="06">Use cases</SectionLabel></Reveal>
        <Reveal delay={80}>
          <h2 className="mt-5 max-w-3xl text-[34px] sm:text-[44px] leading-[1.02] tracking-tight font-display font-medium grad-text-soft">
            Built for agents that need memory.
          </h2>
        </Reveal>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c, i) => (<Reveal key={c.title} delay={i * 50}><UseCaseCard {...c} /></Reveal>))}
        </div>
      </div>
    </section>
  );
};

const AgentFiSection = () => {
  const cards = [
    { icon:"wallet", title:"Agent Wallets",     desc:"Persistent economic agents can be wallet-ready, with clear separation between identity and treasury." },
    { icon:"shield", title:"Agent Treasuries",  desc:"Future support for revenue, balances, and operating capital — built carefully and with policy guardrails." },
    { icon:"coin",   title:"Agent Tokens",      desc:"Optional tokenized communities around serious public agents, separated from the brain itself." },
    { icon:"feed",   title:"Proof Before Markets", desc:"Public logs show what an agent knows, does, and improves before any financial layers come into play." },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10">
          <div>
            <Reveal><SectionLabel index="07">Optional layer</SectionLabel></Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 text-[34px] sm:text-[44px] leading-[1.02] tracking-tight font-display font-medium">
                <span className="grad-text-soft">Optional </span><span className="grad-text">AgentFi</span><span className="grad-text-soft"> layer.</span>
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-6 text-[15px] leading-relaxed text-white/60 max-w-lg">
                Promptbox is building toward a future where serious agents can hold wallets, receive
                revenue, pay for tools, trade approved assets, and participate in agent-to-agent
                markets. The MVP starts with wallet-ready architecture, public proof feeds, and
                tokenized agent pages — without requiring every agent to launch a token.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-6 glass rounded-xl p-4 text-[12.5px] text-white/55 max-w-lg flex items-start gap-3">
                <Icon name="shield" className="w-4 h-4 mt-0.5 text-white/50"/>
                <span>Tokenization and financial features will be rolled out carefully and may vary by jurisdiction.</span>
              </div>
            </Reveal>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {cards.map((c, i) => (
              <Reveal key={c.title} delay={i * 60}>
                <div className="glass rounded-2xl p-5 h-full">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] border border-vi-400/30 text-vi-400">
                    <Icon name={c.icon} className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 text-white text-[16px] font-medium tracking-tight">{c.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const tiers = [
    { tier:"Personal Brain", price:"Free", sub:"during beta",
      desc:"For individuals building a private second brain for research, projects, or personal knowledge.",
      features:["1 private brain","Raw dump inbox","AI-generated wiki","Basic graph view","Limited monthly brain builds","Claude-powered Q&A"],
      cta:"Join Free Beta" },
    { tier:"Agent Brain", price:"$29", sub:"/mo · from",
      desc:"For creators and builders turning a second brain into a working AI agent.",
      features:["Everything in Personal Brain","Agent profile","Persistent memory","Saved outputs","Skills","Manual health checks","Public or private agent page","Higher usage limits"],
      cta:"Join Waitlist", featured:true, badge:"Most popular" },
    { tier:"Self-Learning Agent", price:"$99", sub:"/mo · from",
      desc:"For advanced users building Claude/Hermes-powered agents that improve over time.",
      features:["Everything in Agent Brain","Hermes self-learning mode","Recurring health checks","Advanced graph view","Skill creation workflows","Proof feed","Scheduled agent tasks","Priority runtime capacity"],
      cta:"Request Early Access" },
    { tier:"Tokenized Agent", price:"Custom", sub:"coming soon",
      desc:"For public agents, crypto-native builders, and teams that want tokenization, wallet-ready architecture, and market-facing proof-of-work.",
      features:["Public agent page","Token-ready profile","Public brain preview","Proof-of-work feed","Wallet-ready agent identity","Future AgentFi features","Agent treasury architecture","Launch support"],
      cta:"Apply for Tokenized Beta" },
  ];
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal><SectionLabel index="08">Early access</SectionLabel></Reveal>
        <div className="mt-5 flex items-end justify-between flex-wrap gap-6">
          <Reveal delay={80}>
            <h2 className="max-w-3xl text-[34px] sm:text-[44px] leading-[1.02] tracking-tight font-display font-medium grad-text-soft">
              Start with a brain. Grow into an agent. Optionally, a tokenized one.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="max-w-md text-[14px] text-white/55">Waitlist pricing — invites roll out in waves as runtime capacity opens.</p>
          </Reveal>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {tiers.map((t, i) => (<Reveal key={t.tier} delay={i * 60}><PricingCard {...t} /></Reveal>))}
        </div>
        <Reveal delay={200}>
          <p className="mt-6 text-center text-[12.5px] text-white/40 mono tracking-wide">
            Pricing is early-access guidance and may change before public launch.
          </p>
        </Reveal>
      </div>
    </section>
  );
};

const ComparisonSection = () => {
  const rows = [
    { k:"Memory",         chat:"Session-based",       wf:"Task-based",  pb:"Persistent second brain" },
    { k:"Knowledge",      chat:"User repeats context",wf:"Manual setup", pb:"AI-organized raw dump + wiki" },
    { k:"Improvement",    chat:"Limited",             wf:"Manual edits", pb:"Outputs · health · skills · memory" },
    { k:"Visualization",  chat:"None",                wf:"Nodes",        pb:"Living brain graph" },
    { k:"Agent identity", chat:"Conversation",        wf:"Automation",   pb:"Persistent agent profile" },
    { k:"Tokenization",   chat:"No",                  wf:"No",           pb:"Optional public agent / token layer" },
  ];
  const dot = (v: string, kind: string) => {
    if (v === "No" || v === "None" || v === "Limited") return <span className="text-white/35 inline-flex items-center gap-1.5"><Icon name="x" className="w-3 h-3" stroke={2.2}/>{v}</span>;
    if (kind === "pb") return <span className="text-white inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cy-400" style={{ boxShadow: "0 0 8px #5ee0ff" }}/>{v}</span>;
    return <span className="text-white/55 inline-flex items-center gap-1.5"><Icon name="dash" className="w-3 h-3 text-white/30"/>{v}</span>;
  };
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal><SectionLabel index="09">Comparison</SectionLabel></Reveal>
        <Reveal delay={80}>
          <h2 className="mt-5 max-w-3xl text-[34px] sm:text-[44px] leading-[1.02] tracking-tight font-display font-medium">
            <span className="grad-text-soft">Not another chatbot. </span>
            <span className="grad-text-soft">Not another workflow builder.</span>
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-10 glass-strong rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 px-5 sm:px-6 py-3.5 border-b border-white/8 mono text-[10.5px] tracking-[0.18em] uppercase text-white/40">
              <div></div><div>Generic Chatbot</div><div>Workflow Builder</div><div className="text-cy-400">Promptbox</div>
            </div>
            <div className="divide-y divide-white/5">
              {rows.map((r) => (
                <div key={r.k} className="grid grid-cols-4 px-5 sm:px-6 py-4 items-center text-[13.5px]">
                  <div className="text-white/65 font-medium">{r.k}</div>
                  <div>{dot(r.chat, "chat")}</div>
                  <div>{dot(r.wf, "wf")}</div>
                  <div>{dot(r.pb, "pb")}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const faqs = [
    { q:"Is Promptbox an AI agent builder?", a:"Promptbox is not a generic drag-and-drop agent builder. It is the second-brain layer for AI agents. You can use it to create agents, but the core product is persistent memory, organized knowledge, skills, health checks, and proof-of-work." },
    { q:"Does Promptbox use Claude or Hermes?", a:"The MVP supports Claude-powered standard agents. Hermes-style self-learning agents are planned for advanced users who want deeper memory loops, skills, and autonomous improvement." },
    { q:"Is this built on Obsidian?", a:"No. Promptbox is inspired by Obsidian-style linked knowledge, but it is built as a hosted, agent-native second brain with accounts, permissions, public/private knowledge, AI-managed wikis, and agent runtimes." },
    { q:"Do I need to launch a token?", a:"No. Tokenization is optional. You can build private brains, public agents, or tokenized agents depending on your use case." },
    { q:"What makes this different from uploading docs to a chatbot?", a:"Promptbox does not just retrieve documents. It organizes raw knowledge into a living wiki, saves useful outputs back into the brain, tracks memory and decisions, audits the brain for gaps, and visualizes the knowledge graph." },
    { q:"Will agents have wallets?", a:"Only economic agents need wallets. Temporary task agents do not. Promptbox is building wallet-ready architecture for future agent treasuries, tokenized agents, and AgentFi use cases." },
    { q:"When will tokenized agents launch?", a:"Tokenized agent features are planned for later beta phases. Early access focuses first on the second brain, agent memory, visual graph, and Claude-powered agents." },
  ];
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-[0.7fr_1fr] gap-12">
          <div>
            <Reveal><SectionLabel index="10">FAQ</SectionLabel></Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 text-[34px] sm:text-[44px] leading-[1.02] tracking-tight font-display font-medium grad-text-soft">
                Honest answers to the questions builders ask first.
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-5 text-[14px] text-white/55 max-w-md">
                Got something we didn't cover? <a className="text-cy-400 hover:underline" href="mailto:hello@promptbox.com">hello@promptbox.com</a>
              </p>
            </Reveal>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (<Reveal key={f.q} delay={i * 40}><FAQItem {...f} /></Reveal>))}
          </div>
        </div>
      </div>
    </section>
  );
};

const FinalCTA = () => (
  <section id="waitlist-bottom" className="relative py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <Reveal>
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 glass-strong">
          <div className="absolute inset-0 -z-10"
               style={{ background: "radial-gradient(60% 80% at 50% 0%, rgba(94,224,255,0.18), transparent 70%), radial-gradient(60% 80% at 80% 120%, rgba(154,124,255,0.20), transparent 70%)" }} />
          <div className="absolute inset-0 grid-noise -z-10 opacity-70" />
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
            <div>
              <Chip>Last call · V2 waitlist</Chip>
              <h2 className="mt-6 text-[36px] sm:text-[48px] lg:text-[56px] leading-[1] tracking-tight font-display font-medium">
                <span className="grad-text-soft">Build the brain </span>
                <span className="grad-text">before</span>
                <span className="grad-text-soft"> the agent becomes valuable.</span>
              </h2>
              <p className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-white/65">
                The next wave of AI agents will not win because they have better prompts. They will
                win because they remember, learn, organize, and prove their work over time.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-5 text-[12.5px] text-white/45">
                <span className="flex items-center gap-2"><Icon name="check" className="w-3.5 h-3.5 text-cy-400" stroke={2.5}/>Founder-led product</span>
                <span className="flex items-center gap-2"><Icon name="check" className="w-3.5 h-3.5 text-cy-400" stroke={2.5}/>No credit card to join</span>
                <span className="flex items-center gap-2"><Icon name="check" className="w-3.5 h-3.5 text-cy-400" stroke={2.5}/>Wallet-ready, not required</span>
              </div>
            </div>
            <WaitlistForm idPrefix="cta" />
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

const FooterCol = ({ title, links }: any) => (
  <div>
    <div className="mono text-[10.5px] tracking-[0.2em] uppercase text-white/40">{title}</div>
    <ul className="mt-4 space-y-2.5">
      {links.map(([label, href]: any) => (
        <li key={label}><a href={href} className="text-[13.5px] text-white/65 hover:text-white">{label}</a></li>
      ))}
    </ul>
  </div>
);

const Footer = () => (
  <footer className="relative pt-12 pb-10 border-t border-white/8">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-2 max-w-md">
          <div className="flex items-center gap-2.5">
            <Icon name="logo" className="w-7 h-7" />
            <span className="text-white text-[15px] font-semibold tracking-tight">Promptbox</span>
          </div>
          <p className="mt-4 text-[13.5px] text-white/55 leading-relaxed">
            The second-brain layer for AI agents. Persistent memory, organized knowledge, visual
            brain graphs, reusable skills, and public proof-of-work — built for the next wave of
            agent-native products.
          </p>
          <div className="mt-5 flex items-center gap-2.5">
            <Chip>Made for builders</Chip>
            <Chip tone="violet">Claude · Hermes ready</Chip>
          </div>
        </div>
        <FooterCol title="Product" links={[["Waitlist","#top"],["Features","#features"],["Pricing","#pricing"],["FAQ","#faq"]]} />
        <FooterCol title="Company" links={[["Contact","mailto:hello@promptbox.com"],["Privacy","/privacy"],["Terms","/terms"]]} />
      </div>
      <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="mono text-[11px] text-white/35 tracking-wider uppercase">© 2026 Promptbox Labs · All rights reserved</div>
        <div className="mono text-[11px] text-white/35">v2.0.0-waitlist</div>
      </div>
    </div>
  </footer>
);

/* ------------------------------ Page ------------------------------ */
export default function WaitlistHome() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("pb-waitlist-root", "dark");
    return () => { root.classList.remove("pb-waitlist-root", "dark"); };
  }, []);

  return (
    <>
      <Helmet>
        <title>Promptbox — The second-brain layer for AI agents</title>
        <meta name="description" content="Persistent memory, AI-managed wiki, visual brain graph, reusable skills, health checks, and public proof-of-work for AI agents. Join the V2 waitlist." />
        <link rel="canonical" href="https://promptbox.com/waitlist" />
      </Helmet>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="pb-waitlist relative min-h-screen">
        <TopNav />
        <main>
          <HeroSection />
          <Marquee />
          <PositioningSection />
          <HowItWorksSection />
          <FeaturesSection />
          <BrainSection />
          <GraphShowcaseSection />
          <UseCasesSection />
          <AgentFiSection />
          <PricingSection />
          <ComparisonSection />
          <FAQSection />
          <FinalCTA />
          <Footer />
        </main>
      </div>
    </>
  );
}
