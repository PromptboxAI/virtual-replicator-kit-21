
# Promptbox V2 Waitlist Homepage

## Goal
Replace the current homepage (`/`) with a new, conversion-focused waitlist landing page reflecting Promptbox's pivot to "the second-brain layer for AI agents." Existing app routes (`/agents`, `/create`, `/dashboard`, `/admin`, etc.) stay intact.

## Routing change
- `/` → new `WaitlistHome` page (was `TokenAgents`)
- Add `/app` → existing `TokenAgents` (so the old token-agents experience is still reachable from inside the product)
- Sticky nav anchors: Features, How It Works, Pricing, FAQ, Join Waitlist

If you'd rather keep `TokenAgents` at `/` and put the waitlist at `/waitlist` or `/v2`, say the word — otherwise I'll go with the replacement above.

## Page sections (in order)
1. Sticky top nav (Promptbox wordmark, anchor links, "Join Waitlist" CTA)
2. Hero: badges ("V2 Waitlist Now Open", "Second brains for AI agents"), headline ("Build the Second Brain for Your AI Agent"), subheadline, inline waitlist form, trust line, right-side animated **BrainGraphVisual** with AlphaScout AI dashboard stats (Raw Sources 128, Wiki Pages 34, Skills 9, Health 92%, Proof Events 47, Token: Optional)
3. Positioning: "Most AI agents are disposable. Promptbox makes them compound." + Remember / Organize / Improve cards
4. How It Works: 6 steps (Dump Knowledge → AI Librarian → Ask the Brain → Save Outputs → Health Checks → Deploy)
5. Features: 10 glass cards (Raw Dump Inbox, AI Wiki, Visual Brain Graph, Persistent Memory, Reusable Skills, Health Checks, Claude Standard, Hermes Self-Learning, Public Proof Feed, Optional Tokenized Agents)
6. What is a Promptbox Brain? — folder-tree visual (Raw / Wiki / Outputs / Memory / Skills / Health Checks / Proof Feed)
7. Use Cases: 6 cards (Crypto Research, Creator Brains, Business Knowledge, Trading Assistants, Expert Assistants, Community Agents)
8. AgentFi optional layer: 4 cards + jurisdictional disclaimer
9. Pricing tiers: 4 cards (Personal Brain free beta, Agent Brain $29, Self-Learning $99, Tokenized custom) + early-access note
10. Comparison table: Generic Chatbot vs Workflow Builder vs Promptbox (6 rows)
11. FAQ: 7 items (accordion)
12. Final CTA + full WaitlistForm
13. Footer with wordmark, tagline, link columns

## Components to create (`src/components/waitlist/`)
- `WaitlistNav.tsx` — sticky glass nav
- `Hero.tsx`
- `WaitlistForm.tsx` — email + name + "what are you building" select + optional textarea; success state; calls `submitWaitlist()` helper
- `BrainGraphVisual.tsx` — SVG node graph (Research, Memory, Skills, Outputs, Wallet, Proof Feed) with subtle pulse animation + stats card overlay
- `FeatureCard.tsx`, `HowItWorksStep.tsx`, `UseCaseCard.tsx`, `PricingCard.tsx`, `FAQItem.tsx` (wrap shadcn Accordion), `ComparisonTable.tsx`, `BrainFolderVisual.tsx`, `AgentFiCard.tsx`, `Footer.tsx`
- `src/pages/WaitlistHome.tsx` — composes all sections

## Data layer
- `waitlist_signups` table via Supabase migration with RLS:
  - fields: email (unique, citext), name, building_type (enum-ish text), notes, source, user_agent, created_at
  - RLS: public INSERT allowed (anonymous waitlist), SELECT restricted to admins (`has_role(auth.uid(), 'admin')`)
  - Unique constraint on lower(email) to dedupe
- `src/lib/waitlist.ts` — `submitWaitlist(payload)` using the existing Supabase client; returns `{ ok, alreadyJoined }`
- Form uses `zod` schema (email, max lengths, trim) before insert; toast on success/error

## Design system
- Dark mode by default for this page (force `dark` class on root wrapper)
- Use existing HSL semantic tokens; add a few new gradient tokens in `index.css`:
  - `--gradient-aurora` (electric blue → violet → cyan)
  - `--gradient-glass` and `--shadow-glow`
- Glassmorphism: `bg-white/[0.03] backdrop-blur border border-white/10`
- Rounded `2xl`, generous spacing, subtle hover lift, fade-in on scroll using existing tailwind animations
- Typography: keep existing font stack; oversize hero headline with gradient text
- Fully responsive, mobile-first; nav collapses to sheet menu on mobile
- SEO: `<DynamicSEO>` already mounted globally — set page-specific title/description/canonical via Helmet inside `WaitlistHome`

## Copy
All copy taken verbatim from the brief. No lorem ipsum. No "revolutionary" hype. No securities-style language. AgentFi sections include the jurisdictional disclaimer.

## Technical notes
- React + Vite + Tailwind + shadcn/ui (existing stack)
- Reuse `Button`, `Input`, `Textarea`, `Select`, `Accordion`, `Card` from `src/components/ui`
- No new heavy deps; SVG graph is hand-rolled with CSS animations
- Form submission: zod validate → insert into `waitlist_signups` → handle unique-violation as "already on the list" success
- Add `aria-` labels on form controls; semantic `<section>` + single `<h1>`

## Verification
- Visit `/`, confirm new page renders, nav anchors scroll smoothly
- Submit waitlist form (valid + duplicate + invalid email) and confirm row in `waitlist_signups`
- Confirm `/app`, `/agents`, `/dashboard`, `/admin` still work
- Check mobile viewport (375px) and desktop (1336px) layouts

## Out of scope
- Email notifications on signup (can add later via edge function + Resend)
- Admin UI to view signups (query directly in Supabase for now)
- Removing/retiring the old token-agents code
