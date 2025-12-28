import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

// Integration icon mapping
const integrationIcons: Record<string, { icon: string; name: string }> = {
  salesforce: { icon: "/src/assets/salesforce-logo.png", name: "Salesforce" },
  openai: { icon: "/src/assets/openai-logo.png", name: "OpenAI" },
  claude: { icon: "/src/assets/claude-logo.png", name: "Claude" },
  gemini: { icon: "/src/assets/gemini-logo.png", name: "Gemini" },
  github: { icon: "/src/assets/github-logo.png", name: "GitHub" },
  supabase: { icon: "/src/assets/supabase-logo.png", name: "Supabase" },
  privy: { icon: "/src/assets/privy-logo.png", name: "Privy" },
};

interface AgentMarketplaceCardProps {
  id: string;
  name: string;
  creator: string;
  category: string;
  integrations?: string[];
  avatarUrl?: string;
}

export function AgentMarketplaceCard({
  id,
  name,
  creator,
  category,
  integrations = [],
  avatarUrl,
}: AgentMarketplaceCardProps) {
  const displayedIntegrations = integrations.slice(0, 3);
  const overflowCount = integrations.length - 3;

  const truncateAddress = (address: string) => {
    if (address.startsWith("0x") && address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address.length > 20 ? `${address.slice(0, 17)}...` : address;
  };

  return (
    <Link to={`/agents/${id}`}>
      <Card className="group p-5 hover:shadow-lg transition-all duration-200 hover:border-primary/40 cursor-pointer bg-card border-border rounded-xl h-full">
        {/* Integration icons row */}
        <div className="flex items-center gap-2 mb-4">
          {avatarUrl && (
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted">
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          )}
          {displayedIntegrations.map((integration, index) => {
            const integrationData = integrationIcons[integration.toLowerCase()];
            return (
              <div
                key={index}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden"
                title={integrationData?.name || integration}
              >
                {integrationData ? (
                  <img
                    src={integrationData.icon}
                    alt={integrationData.name}
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    {integration.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            );
          })}
          {overflowCount > 0 && (
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">+{overflowCount}</span>
            </div>
          )}
        </div>

        {/* Agent name */}
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-3 line-clamp-2">
          {name}
        </h3>

        {/* Creator with avatar */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <span className="text-[10px] font-medium text-primary">
              {truncateAddress(creator).slice(0, 2).toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {truncateAddress(creator)}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export function BuildFirstAgentCard() {
  return (
    <Link to="/build-your-first-ai-agent" className="block max-w-4xl">
      <Card className="group relative overflow-hidden p-6 md:p-8 hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 hover:border-primary/40 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left content */}
          <div className="flex-1">
            {/* Integration icons */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center">
                <span className="text-sm">📄</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center">
                <span className="text-sm">📊</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">+2</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-bold text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors mb-3">
              Build Your First AI Agent
            </h3>

            {/* Creator */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img 
                  src="/lovable-uploads/promptbox-logo-new.png" 
                  alt="Promptbox" 
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground">Promptbox Team</p>
              <span className="text-primary">✓</span>
            </div>
          </div>

          {/* Right - Workflow visualization */}
          <div className="hidden md:block">
            <div className="relative bg-card/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">→</span>
                </div>
                <div className="bg-primary/20 rounded-lg px-4 py-3 border border-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Your First</p>
                      <p className="text-sm font-medium text-foreground">AI Agent</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-around mt-3 text-[10px] text-muted-foreground">
                <span>Chat Model*</span>
                <span>Memory</span>
                <span>Tool</span>
              </div>
              <div className="flex justify-around mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
