import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, Zap, Target, Rocket, Code, Palette, Megaphone, ArrowRight, ExternalLink } from "lucide-react";

const Careers = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const whyJoinReasons = [
    {
      icon: Zap,
      title: "Work at the AI × Crypto frontier",
      description: "You'll ship features that touch LLMs, agents, smart contracts, on-chain analytics, and creator tooling—often all in the same week."
    },
    {
      icon: Target,
      title: "Massive ownership & impact",
      description: "Our early hires won't be \"ticket takers.\" You'll own problems end-to-end, shape the roadmap, and have a direct say in how Promptbox and its token ecosystem evolve."
    },
    {
      icon: Rocket,
      title: "Ship fast, learn faster",
      description: "We prioritize experiments over decks. You'll see ideas go from concept → prototype → live with real users and real tokens quickly."
    },
    {
      icon: Users,
      title: "Build for builders",
      description: "Our users are founders, creators, devs, and operators who want leverage. If you love building tools for people who build things, this will feel like home."
    }
  ];

  const principles = [
    { title: "Default to action", description: "Small, shippable experiments beat endless planning." },
    { title: "Honest feedback, no drama", description: "Direct, kind, and focused on the work." },
    { title: "Users > vanity metrics", description: "We care more about helping 10 users win than impressing 10k tourists." },
    { title: "Clarity over buzzwords", description: "We live at the frontier, but we don't hide behind jargon." },
    { title: "Skin in the game", description: "Everyone is incentivized to think in terms of value created for users, not just velocity." }
  ];

  const teams = [
    {
      icon: Code,
      title: "Product & Engineering",
      roles: [
        "Founding Full-Stack Engineer (TS/React + crypto/AI)",
        "Backend Engineer (APIs, Supabase/Postgres, infra)",
        "Smart Contract Engineer (EVM/Base, token + bonding curves)",
        "AI / Agent Engineer (OpenAI Agent SDK, tools & workflows)"
      ]
    },
    {
      icon: Palette,
      title: "Design & Experience",
      roles: [
        "Product Designer (dashboards, builders, UX for complex systems)",
        "Brand & Marketing Designer (web, visuals, storytelling)"
      ]
    },
    {
      icon: Megaphone,
      title: "Go-to-Market & Community",
      roles: [
        "Developer Relations / Community Lead (docs, tutorials, demos)",
        "Growth & Partnerships (launchpads, infra partners, creator collabs)",
        "Customer Success (help creators + small teams win on Promptbox)"
      ]
    }
  ];

  const standOutPoints = [
    "You've built and shipped things (products, bots, agents, scripts, side projects).",
    "You've played with agents, LLMs, or crypto beyond just reading about them.",
    "You can explain complex stuff simply.",
    "You think in terms of users, distribution, and incentives, not just raw tech.",
    "You're comfortable with ambiguity and owning outcomes, not just tasks."
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-6 text-sm font-medium tracking-wider">
                  JOIN US
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  Careers at Promptbox
                </h1>
                <p className="text-xl md:text-2xl text-foreground mb-8">
                  Help build the tokenized AI agent future
                </p>
                <p className="text-foreground mb-8 max-w-lg">
                  Promptbox is building a launchpad for tokenized AI agents—where anyone can spin up an agent, launch a token, and turn it into a cash-flowing micro-SaaS, all in one place.
                </p>
                <p className="text-foreground mb-8 max-w-lg">
                  We're early, product-obsessed, and moving fast at the intersection of AI agents, crypto, and creator tools. If that sounds like your playground, you're in the right place.
                </p>
                <Button 
                  size="lg" 
                  className="gap-2"
                  onClick={() => window.location.href = 'mailto:kevin@promptbox.com?subject=Future Hire – [Role you want]'}
                >
                  <Mail className="w-5 h-5" />
                  Get in Touch
                </Button>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80" 
                  alt="Team collaboration" 
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-foreground">Building talent network</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* No Open Roles Banner */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                We don't have active job openings yet.
              </h2>
              <p className="text-foreground">
                But we are building a talent network for our first wave of hires. If you'd like to be on our radar, scroll down and reach out.
              </p>
            </div>
          </div>
        </section>

        {/* What We're Building */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge variant="outline" className="mb-4 text-xs tracking-wider">WHAT WE'RE BUILDING</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  The Platform Behind the Platform
                </h2>
                <div className="space-y-4 text-foreground">
                  <p>
                    <strong className="text-foreground">A token-first AI agent platform</strong> where every agent can have its own on-chain token and revenue stream.
                  </p>
                  <p>
                    <strong className="text-foreground">A launchpad for creators and founders</strong> to go from idea → agent → token → real users and on-chain demand.
                  </p>
                  <p>
                    <strong className="text-foreground">A set of tools to prove demand in public</strong> (bonding curves, dashboards, analytics) before raising money or scaling.
                  </p>
                  <p className="pt-4 text-foreground font-medium">
                    Our goal is to make "shipping an AI agent with its own token economics" as simple as launching a newsletter or a Shopify store.
                  </p>
                </div>
              </div>
              <div>
                <img 
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop&q=80" 
                  alt="Platform development" 
                  className="rounded-2xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Why Join */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 text-xs tracking-wider">WHY JOIN PROMPTBOX</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why join Promptbox (when we start hiring)
              </h2>
              <p className="text-foreground max-w-2xl mx-auto">
                Even as an early, lean team, we're committed to building a place where great people can do the best work of their careers.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {whyJoinReasons.map((reason, index) => (
                <Card key={index} className="border-border bg-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <reason.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">{reason.title}</h3>
                        <p className="text-foreground text-sm">{reason.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How We Work */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <Badge variant="outline" className="mb-4 text-xs tracking-wider">HOW WE WORK</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Builder-first, low-ego team
                </h2>
                <p className="text-foreground mb-8">
                  We expect to be lean and highly collaborative for a while—working closely with the founder, iterating live with users, and keeping meetings light so people can build.
                </p>
                <img 
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&auto=format&fit=crop&q=80" 
                  alt="Team working together" 
                  className="rounded-xl shadow-lg"
                />
              </div>
              <div className="space-y-4">
                {principles.map((principle, index) => (
                  <Card key={index} className="border-border">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground mb-1">{principle.title}</h3>
                      <p className="text-sm text-foreground">{principle.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Teams We'll Hire For */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 text-xs tracking-wider">FUTURE TEAMS</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Teams we'll likely hire for
              </h2>
              <p className="text-foreground max-w-2xl mx-auto">
                We're not hiring for these roles today, but this is the shape of the future team.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {teams.map((team, index) => (
                <Card key={index} className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                      <team.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">{team.title}</h3>
                    <ul className="space-y-2">
                      {team.roles.map((role, roleIndex) => (
                        <li key={roleIndex} className="text-sm text-foreground flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary/60" />
                          {role}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-foreground mt-8">
              If you'd be great at something adjacent to this list, we'd still love to hear from you.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4 text-xs tracking-wider">REACH OUT</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  No open roles yet – but we want to meet you
                </h2>
                <p className="text-foreground">
                  The best time to meet future teammates is before we post a job description.
                </p>
              </div>
              
              <Card className="border-border bg-card mb-12">
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4">If you're excited about Promptbox, tell us:</h3>
                  <ul className="space-y-3 text-foreground mb-6">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                      Who you are and what you do best
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                      A few links (GitHub, portfolio, LinkedIn, X, projects, write-ups, bots you've built, etc.)
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                      Why the AI × crypto × creator intersection is personally interesting to you
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                      What kind of role you'd want in the next 6–12 months
                    </li>
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Button 
                      size="lg" 
                      className="gap-2 w-full sm:w-auto"
                      onClick={() => window.location.href = 'mailto:kevin@promptbox.com?subject=Future Hire – [Role you want]'}
                    >
                      <Mail className="w-5 h-5" />
                      Email kevin@promptbox.com
                    </Button>
                    <span className="text-sm text-foreground">
                      Subject: Future Hire – {'<Role you want>'}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-4">
                    We read every email, even if we can't respond to all of them right away.
                  </p>
                </CardContent>
              </Card>

              {/* How to Stand Out */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-foreground mb-4">How to stand out</h3>
                <p className="text-foreground mb-4">You don't need a perfect resume. What impresses us:</p>
                <ul className="space-y-2">
                  {standOutPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="text-foreground font-medium mt-4">
                  If you've already built something that should exist on Promptbox one day, that's an instant signal for us.
                </p>
              </div>

              {/* Stay in the Loop */}
              <Card className="border-border bg-muted/50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Stay in the loop</h3>
                  <p className="text-foreground mb-4">If you want to keep an eye on Promptbox as we grow:</p>
                  <ul className="space-y-2 text-foreground">
                    <li className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      Follow us on X
                    </li>
                    <li className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      Join our newsletter / updates list on promptbox.com
                    </li>
                    <li className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      Keep an eye on this page—we'll post specific openings here once we're ready to scale the team
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;
