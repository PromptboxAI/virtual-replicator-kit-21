import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  isFeature?: boolean;
}

export function AgentMarketplaceCard({
  id,
  name,
  creator,
  category,
  integrations = [],
  avatarUrl,
  isFeature = false,
}: AgentMarketplaceCardProps) {
  const displayedIntegrations = integrations.slice(0, 4);
  const overflowCount = integrations.length - 4;

  const truncateAddress = (address: string) => {
    if (address.startsWith("0x") && address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address.length > 20 ? `${address.slice(0, 17)}...` : address;
  };

  return (
    <Link to={`/agents/${id}`}>
      <Card className={`group p-4 hover:shadow-lg transition-all duration-200 hover:border-primary/40 cursor-pointer bg-card ${isFeature ? 'border-primary/20' : ''}`}>
        {/* Integration icons row */}
        <div className="flex items-center gap-1.5 mb-3 h-8">
          {displayedIntegrations.map((integration, index) => {
            const integrationData = integrationIcons[integration.toLowerCase()];
            return (
              <div
                key={index}
                className="w-7 h-7 rounded-md bg-muted flex items-center justify-center overflow-hidden"
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
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">+{overflowCount}</span>
            </div>
          )}
          {integrations.length === 0 && avatarUrl && (
            <div className="w-7 h-7 rounded-md overflow-hidden">
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Agent name */}
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1 truncate">
          {name}
        </h3>

        {/* Creator */}
        <p className="text-sm text-muted-foreground mb-2 truncate">
          by {truncateAddress(creator)}
        </p>

        {/* Category badge */}
        <Badge variant="secondary" className="text-xs">
          {category}
        </Badge>
      </Card>
    </Link>
  );
}

export function BuildFirstAgentCard() {
  return (
    <Link to="/build-your-first-ai-agent">
      <Card className="group p-6 hover:shadow-lg transition-all duration-200 border-2 border-dashed border-primary/30 hover:border-primary cursor-pointer bg-gradient-to-br from-primary/5 to-transparent">
        {/* Workflow visualization */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
            🤖
          </div>
          <div className="h-0.5 w-4 bg-primary/30" />
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
            🔧
          </div>
          <div className="h-0.5 w-4 bg-primary/30" />
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
            📊
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-2">
          Build Your First AI Agent
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          Learn how to create, configure, and deploy your first AI agent on Promptbox
        </p>

        {/* Badge */}
        <Badge className="mt-3 bg-primary text-primary-foreground">
          Get Started
        </Badge>
      </Card>
    </Link>
  );
}
