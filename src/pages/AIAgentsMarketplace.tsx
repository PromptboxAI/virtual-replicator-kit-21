import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AgentMarketplaceCard, BuildFirstAgentCard } from "@/components/AgentMarketplaceCard";
import { useAgents } from "@/hooks/useAgents";

// Category definitions
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "AI", label: "AI" },
  { id: "Sales", label: "Sales" },
  { id: "IT Ops", label: "IT Ops" },
  { id: "Marketing", label: "Marketing" },
  { id: "Dev Ops", label: "Dev Ops" },
  { id: "Other", label: "Other" },
];

// Integration stack definitions with logos
const INTEGRATIONS = [
  { id: "salesforce", name: "Salesforce", logo: "/src/assets/salesforce-logo.png" },
  { id: "openai", name: "OpenAI", logo: "/src/assets/openai-logo.png" },
  { id: "claude", name: "Claude", logo: "/src/assets/claude-logo.png" },
  { id: "gemini", name: "Gemini", logo: "/src/assets/gemini-logo.png" },
  { id: "github", name: "GitHub", logo: "/src/assets/github-logo.png" },
  { id: "supabase", name: "Supabase", logo: "/src/assets/supabase-logo.png" },
  { id: "privy", name: "Privy", logo: "/src/assets/privy-logo.png" },
];

export default function AIAgentsMarketplace() {
  const { agents, loading } = useAgents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  // Filter agents based on search, category, and integration
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        searchQuery === "" ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        agent.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesIntegration = !selectedIntegration;

      return matchesSearch && matchesCategory && matchesIntegration;
    });
  }, [agents, searchQuery, selectedCategory, selectedIntegration]);

  // Group agents by category for display
  const agentsByCategory = useMemo(() => {
    const grouped: Record<string, typeof agents> = {};
    CATEGORIES.filter((c) => c.id !== "all").forEach((cat) => {
      grouped[cat.id] = filteredAgents.filter(
        (agent) => agent.category?.toLowerCase() === cat.id.toLowerCase()
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
          content="Browse and discover AI agents for marketing, sales, trading, IT operations, and more. Find the perfect AI agent template for your needs."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section - Centered */}
          <section className="border-b border-border">
            <div className="container mx-auto px-4 py-16 md:py-20">
              <div className="flex flex-col items-center text-center">
                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-2">
                  <span className="text-primary">{totalAgents}</span>{" "}
                  <span className="text-muted-foreground font-normal">AI Agent</span>
                </h1>
                <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8">
                  Templates
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-2xl mb-8">
                  <div className="relative">
                    <Input
                      placeholder="Search apps, roles, usecases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-14 pl-5 pr-14 text-base rounded-full bg-muted/50 border-border focus:border-primary"
                    />
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap justify-center gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        selectedCategory === category.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Newcomer Essentials Section */}
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              <span className="text-muted-foreground font-normal">Newcomer</span> essentials:{" "}
              <span className="text-muted-foreground font-normal">learn by doing</span>
            </h2>
            <div className="mt-8">
              <BuildFirstAgentCard />
            </div>
          </section>

          {/* Agent Grid */}
          <section className="container mx-auto px-4 py-8">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-48 rounded-xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : selectedCategory === "all" ? (
              // Show agents grouped by category
              <>
                {CATEGORIES.filter((c) => c.id !== "all").map((category) => {
                  const categoryAgents = agentsByCategory[category.id] || [];
                  if (categoryAgents.length === 0) return null;

                  return (
                    <div key={category.id} className="mb-12">
                      <div className="flex items-center gap-3 mb-6">
                        <h3 className="text-xl font-semibold text-foreground">
                          {category.label}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {categoryAgents.length} templates
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryAgents.map((agent) => (
                          <AgentMarketplaceCard
                            key={agent.id}
                            id={agent.id}
                            name={agent.name}
                            creator={agent.creator_id || "Unknown"}
                            category={agent.category || "Other"}
                            avatarUrl={agent.avatar_url || undefined}
                            integrations={[]}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {filteredAgents.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-lg">No agents found</p>
                    <p className="text-muted-foreground/70 mt-2">
                      Be the first to create an AI agent!
                    </p>
                  </div>
                )}
              </>
            ) : (
              // Show filtered category
              <>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-xl font-semibold text-foreground">
                    {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {filteredAgents.length} templates
                  </span>
                </div>
                {filteredAgents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAgents.map((agent) => (
                      <AgentMarketplaceCard
                        key={agent.id}
                        id={agent.id}
                        name={agent.name}
                        creator={agent.creator_id || "Unknown"}
                        category={agent.category || "Other"}
                        avatarUrl={agent.avatar_url || undefined}
                        integrations={[]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-lg">No agents in this category</p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Search by Stack */}
          <section className="container mx-auto px-4 py-12 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Search by Stack
            </h2>
            <p className="text-muted-foreground mb-8">
              Find agents that use your preferred integrations
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
              {INTEGRATIONS.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() =>
                    setSelectedIntegration(
                      selectedIntegration === integration.id ? null : integration.id
                    )
                  }
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 aspect-square ${
                    selectedIntegration === integration.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 bg-card hover:bg-muted/50"
                  }`}
                >
                  <img
                    src={integration.logo}
                    alt={integration.name}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-xs font-medium text-foreground text-center">
                    {integration.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
