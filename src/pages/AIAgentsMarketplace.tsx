import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Search, Sparkles, ArrowRight, Zap, Bot, TrendingUp, Shield, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AgentMarketplaceCard, BuildFirstAgentCard } from "@/components/AgentMarketplaceCard";
import { useAgents } from "@/hooks/useAgents";
import { useAppMode } from "@/hooks/useAppMode";
import { Link } from "react-router-dom";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Import logo assets
import openaiLogo from "@/assets/openai-logo.png";
import claudeLogo from "@/assets/claude-logo.png";
import geminiLogo from "@/assets/gemini-logo.png";
import salesforceLogo from "@/assets/salesforce-logo.png";
import githubLogo from "@/assets/github-logo.png";
import supabaseLogo from "@/assets/supabase-logo.png";

// Category definitions
const CATEGORIES = [
  { id: "all", label: "All", icon: "✨" },
  { id: "Marketing", label: "Marketing", icon: "📢" },
  { id: "Sales", label: "Sales", icon: "💼" },
  { id: "Support", label: "Support", icon: "🎧" },
  { id: "IT Ops", label: "IT Ops", icon: "⚙️" },
  { id: "Document Ops", label: "Document Ops", icon: "📄" },
  { id: "Other", label: "Other", icon: "📦" },
];

// Integration stack definitions with logos
const INTEGRATIONS = [
  { id: "openai", name: "OpenAI", logo: openaiLogo },
  { id: "claude", name: "Claude", logo: claudeLogo },
  { id: "gemini", name: "Gemini", logo: geminiLogo },
  { id: "salesforce", name: "Salesforce", logo: salesforceLogo },
  { id: "github", name: "GitHub", logo: githubLogo },
  { id: "supabase", name: "Supabase", logo: supabaseLogo },
];

// Stats for social proof
const STATS = [
  { value: "10K+", label: "Active Users" },
  { value: "500+", label: "Agents Created" },
  { value: "1M+", label: "Tasks Automated" },
];

export default function AIAgentsMarketplace() {
  const { agents, loading } = useAgents();
  const { isTestMode } = useAppMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Valid category IDs
  const validCategoryIds = CATEGORIES.map(c => c.id.toLowerCase());

  // Helper to normalize agent category to valid marketplace category
  const normalizeCategory = (category: string | null): string => {
    if (!category) return "Other";
    const lowerCategory = category.toLowerCase();
    if (validCategoryIds.includes(lowerCategory)) return category;
    return "Other"; // Map unknown categories to "Other"
  };

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        searchQuery === "" ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const normalizedCategory = normalizeCategory(agent.category);
      const matchesCategory =
        selectedCategory === "all" ||
        normalizedCategory.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [agents, searchQuery, selectedCategory]);

  // Group agents by category
  const agentsByCategory = useMemo(() => {
    const grouped: Record<string, typeof agents> = {};
    CATEGORIES.filter((c) => c.id !== "all").forEach((cat) => {
      grouped[cat.id] = filteredAgents.filter(
        (agent) => normalizeCategory(agent.category).toLowerCase() === cat.id.toLowerCase()
      );
    });
    return grouped;
  }, [filteredAgents]);

  const totalAgents = agents.length;

  return (
    <>
      <Helmet>
        <title>AI Agent Marketplace | Promptbox</title>
        <meta
          name="description"
          content="Discover and deploy powerful AI agents. Automate your workflows with pre-built templates for sales, marketing, IT operations, and more."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section - Dark gradient with animated elements */}
          <section className="relative overflow-hidden bg-foreground text-background">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
            </div>

            <div className="relative container mx-auto px-4 py-20 md:py-28">
              <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 border border-background/20 mb-8">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {isTestMode ? "Testnet Mode" : "Mainnet"} • {totalAgents} Templates Available
                  </span>
                </div>

                {/* Main headline */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
                  Automate Anything with
                  <span className="block text-white">AI Agents</span>
                </h1>

                <p className="text-xl md:text-2xl text-background/70 mb-10 max-w-2xl">
                  Build, deploy, and monetize intelligent workflows. No code required.
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-2xl mb-8">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/30 rounded-2xl blur opacity-25 group-hover:opacity-50 transition" />
                    <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Search agents, integrations, use cases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 pl-14 pr-5 text-base rounded-xl bg-background text-foreground border-0 shadow-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === category.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : "bg-background/10 text-background hover:bg-background/20 border border-background/20"
                      }`}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.label}
                    </button>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 md:gap-16">
                  {STATS.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-background">{stat.value}</div>
                      <div className="text-sm text-background/60">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Newcomer Section */}
          <section className="container mx-auto px-4 py-16 border-b border-border">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Get Started</h2>
                <p className="text-muted-foreground">Learn by building your first agent</p>
              </div>
            </div>
            <BuildFirstAgentCard />

            {/* Browse by Category */}
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-foreground mb-4">Browse by Category</h3>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.filter((c) => c.id !== "all").map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Agent Grid */}
          <section className="container mx-auto px-4 py-16">
            {/* View Toggle */}
            <div className="flex justify-end mb-6">
              <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "grid" | "list")}>
                <ToggleGroupItem value="grid" aria-label="Grid view" className="gap-1.5">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view" className="gap-1.5">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {loading ? (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" 
                : "flex flex-col gap-3"
              }>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={viewMode === "grid" ? "h-52 rounded-2xl bg-muted animate-pulse" : "h-20 rounded-xl bg-muted animate-pulse"} />
                ))}
              </div>
            ) : selectedCategory === "all" ? (
              <>
                {CATEGORIES.filter((c) => c.id !== "all").map((category) => {
                  const categoryAgents = agentsByCategory[category.id] || [];
                  if (categoryAgents.length === 0) return null;

                  return (
                    <div key={category.id} className="mb-16">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl">{category.icon}</span>
                        <h3 className="text-xl font-bold text-foreground">{category.label}</h3>
                        <span className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground">
                          {categoryAgents.length}
                        </span>
                      </div>
                      <div className={viewMode === "grid" 
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" 
                        : "flex flex-col gap-3"
                      }>
                        {categoryAgents.map((agent) => (
                          <AgentMarketplaceCard
                            key={agent.id}
                            id={agent.id}
                            name={agent.name}
                            symbol={agent.symbol}
                            creator={agent.creator_wallet_address || agent.creator_id || "Unknown"}
                            category={agent.category || "Other"}
                            description={agent.description || undefined}
                            avatarUrl={agent.avatar_url || undefined}
                            tokenAddress={agent.token_address}
                            tokenGraduated={agent.token_graduated}
                            integrations={[]}
                            viewMode={viewMode}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {filteredAgents.length === 0 && (
                  <div className="text-center py-20">
                    <Bot className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-xl font-medium text-foreground mb-2">No agents yet</p>
                    <p className="text-muted-foreground mb-6">Be the first to create an AI agent!</p>
                    <Button asChild>
                      <Link to="/create">Create Agent</Link>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">
                    {CATEGORIES.find((c) => c.id === selectedCategory)?.icon}
                  </span>
                  <h3 className="text-xl font-bold text-foreground">
                    {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground">
                    {filteredAgents.length}
                  </span>
                </div>
                {filteredAgents.length > 0 ? (
                  <div className={viewMode === "grid" 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" 
                    : "flex flex-col gap-3"
                  }>
                    {filteredAgents.map((agent) => (
                      <AgentMarketplaceCard
                        key={agent.id}
                        id={agent.id}
                        name={agent.name}
                        symbol={agent.symbol}
                        creator={agent.creator_wallet_address || agent.creator_id || "Unknown"}
                        category={agent.category || "Other"}
                        description={agent.description || undefined}
                        avatarUrl={agent.avatar_url || undefined}
                        tokenAddress={agent.token_address}
                        tokenGraduated={agent.token_graduated}
                        integrations={[]}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground">No agents in this category yet</p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Search by Stack */}
          <section className="bg-muted/30 border-y border-border">
            <div className="container mx-auto px-4 py-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Search by Stack</h2>
                  <p className="text-muted-foreground">Find agents that work with your stack</p>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {INTEGRATIONS.map((integration) => (
                  <button
                    key={integration.id}
                    onClick={() =>
                      setSelectedIntegration(
                        selectedIntegration === integration.id ? null : integration.id
                      )
                    }
                    className={`group p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                      selectedIntegration === integration.id
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                    }`}
                  >
                    <img
                      src={integration.logo}
                      alt={integration.name}
                      className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                    />
                    <span className="text-sm font-medium text-foreground">{integration.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Black CTA Section with 3-layer dot pattern */}
          <section className="py-20 bg-foreground text-background relative overflow-hidden">
            {/* Dense primary dot grid - 1px dots, 8px spacing, 8% opacity */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
                backgroundSize: '8px 8px',
              }}
            />
            {/* Medium density layer - 0.8px dots, 12px spacing, 5% opacity */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0.8px, transparent 0.8px)',
                backgroundSize: '12px 12px',
              }}
            />
            {/* Sparse larger dots for depth variation - 1.5px dots, 24px spacing, 3% opacity */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
              }}
            />
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 border border-background/20 mb-6">
                  <Shield className="w-4 h-4 text-background" />
                  <span className="text-sm font-medium">Token First</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Ready to Build Your
                  <span className="text-background"> AI Agent?</span>
                </h2>
                <p className="text-xl text-background/70 mb-10 max-w-2xl mx-auto">
                  Join creators building and monetizing AI agents on Promptbox.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild size="lg" className="gap-2 bg-background text-foreground hover:bg-background/90 px-8 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
                    <Link to="/create">
                      Start Building
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-background bg-foreground text-background hover:bg-foreground/90 px-8 transition-all duration-300 hover:scale-105"
                    asChild
                  >
                    <Link to="/contact">
                      Talk to Sales
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
