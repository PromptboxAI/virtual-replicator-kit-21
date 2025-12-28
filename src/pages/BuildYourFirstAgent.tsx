import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Cog, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const steps = [
  {
    number: 1,
    title: "Choose Your Agent Type",
    description:
      "Select from our pre-built templates for Marketing, Sales, Trading, IT Ops, or DevOps agents. Each template comes with optimized configurations for its use case.",
    icon: Bot,
  },
  {
    number: 2,
    title: "Configure Your Agent",
    description:
      "Customize your agent's behavior, integrations, and parameters. Connect to your preferred tools like Salesforce, Slack, or GitHub.",
    icon: Cog,
  },
  {
    number: 3,
    title: "Set Up Integrations",
    description:
      "Link your agent to the AI models and external services it needs. We support OpenAI, Claude, Gemini, and many more integrations.",
    icon: Zap,
  },
  {
    number: 4,
    title: "Deploy & Monitor",
    description:
      "Launch your agent and track its performance in real-time. Use the dashboard to monitor activity, adjust settings, and optimize results.",
    icon: Rocket,
  },
];

const tips = [
  {
    title: "Start Simple",
    description: "Begin with a basic configuration and add complexity as you learn what works best for your use case.",
  },
  {
    title: "Test Thoroughly",
    description: "Use testnet PROMPT tokens to experiment with your agent before committing real resources.",
  },
  {
    title: "Monitor Metrics",
    description: "Keep an eye on your agent's performance metrics to identify optimization opportunities.",
  },
  {
    title: "Join the Community",
    description: "Connect with other builders in our Discord to share tips, get help, and showcase your agents.",
  },
];

export default function BuildYourFirstAgent() {
  return (
    <>
      <Helmet>
        <title>Build Your First AI Agent | Promptbox</title>
        <meta
          name="description"
          content="Learn how to create, configure, and deploy your first AI agent on Promptbox. Step-by-step guide for beginners."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="border-b border-border bg-muted/30">
            <div className="container mx-auto px-4 py-16 md:py-24">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Build Your First AI Agent
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Create powerful AI agents in minutes. No coding required. Follow our step-by-step guide to get started.
                </p>
                <Button asChild size="lg" className="gap-2">
                  <Link to="/create">
                    Start Building
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Steps Section */}
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {steps.map((step) => (
                <Card key={step.number} className="relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20">
                    {step.number}
                  </div>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Tips Section */}
          <section className="bg-muted/30 border-y border-border">
            <div className="container mx-auto px-4 py-16">
              <h2 className="text-3xl font-bold text-foreground text-center mb-12">
                Tips for Success
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {tips.map((tip, index) => (
                  <div key={index} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-4">
                      {index + 1}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto text-center p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ready to Build Your Agent?
              </h2>
              <p className="text-muted-foreground mb-6">
                Get started now and create your first AI agent in less than 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/create">
                    Start Building
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/ai-agents">Browse Templates</Link>
                </Button>
              </div>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
