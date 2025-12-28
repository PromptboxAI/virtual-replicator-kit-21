import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AgentMarketplaceCard, BuildFirstAgentCard } from "@/components/AgentMarketplaceCard";
import { useAgents } from "@/hooks/useAgents";

// Category definitions
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "Marketing", label: "Marketing" },
  { id: "Sales", label: "Sales" },
  { id: "Trading", label: "Trading" },
  { id: "IT Ops", label: "IT Ops" },
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

      // For now, integration filtering would need the integrations field on agents
      // This is a placeholder that can be enhanced when agent integrations are stored
      const matchesIntegration = !selectedIntegration; // TODO: implement when integrations are available

      return matchesSearch && matchesCategory && matchesIntegration;
    });
  }, [agents, searchQuery, selectedCategory, selectedIntegration]);

  // Group agents by category
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
          {/* Hero Section */}
          <section className="border-b border-border bg-muted/30">
            <div className="container mx-auto px-4 py-12">
              <div className="max-w-3xl mx-auto text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {totalAgents} AI Agent Templates
                </h1>
                <p className="text-lg text-muted-foreground">
                  Discover and deploy AI agents built by the community
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-xl mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search agents, categories, integrations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base bg-background"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Build Your First Agent - Featured */}
          <section className="container mx-auto px-4 py-8">
            <div className="max-w-sm">
              <BuildFirstAgentCard />
            </div>
          </section>

          {/* Browse by Category */}
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {CATEGORIES.filter((c) => c.id !== "all").map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl border transition-all text-center ${
                    selectedCategory === category.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span className="font-medium text-foreground">{category.label}</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {agentsByCategory[category.id]?.length || 0} agents
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Category Sections with Agent Grids */}
          {loading ? (
            <section className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-40 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            </section>
          ) : selectedCategory === "all" ? (
            // Show all categories
            CATEGORIES.filter((c) => c.id !== "all").map((category) => {
              const categoryAgents = agentsByCategory[category.id] || [];
              if (categoryAgents.length === 0) return null;

              return (
                <section key={category.id} className="container mx-auto px-4 py-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">{category.label}</h2>
                    <Badge variant="secondary">{categoryAgents.length} agents</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryAgents.map((agent) => (
                      <AgentMarketplaceCard
                        key={agent.id}
                        id={agent.id}
                        name={agent.name}
                        creator={agent.creator_id || "Unknown"}
                        category={agent.category || "Other"}
                        avatarUrl={agent.avatar_url || undefined}
                        integrations={[]} // TODO: Add when available
                      />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            // Show filtered category
            <section className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                </h2>
                <Badge variant="secondary">{filteredAgents.length} agents</Badge>
              </div>
              {filteredAgents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No agents found in this category</p>
                </div>
              )}
            </section>
          )}

          {/* Search by Stack */}
          <section className="container mx-auto px-4 py-12 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">Search by Stack</h2>
            <p className="text-muted-foreground mb-8">
              Find agents that use your preferred integrations
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
              {INTEGRATIONS.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() =>
                    setSelectedIntegration(
                      selectedIntegration === integration.id ? null : integration.id
                    )
                  }
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    selectedIntegration === integration.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <img
                    src={integration.logo}
                    alt={integration.name}
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-sm font-medium text-foreground">
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
