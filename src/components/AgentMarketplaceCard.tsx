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
    <Link to="/build-your-first-ai-agent" className="block w-full">
      <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer bg-foreground text-background rounded-3xl border-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Left content */}
            <div className="flex-1 max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/10 border border-background/20 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-xs font-medium text-background/80">Start here</span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-3xl md:text-4xl text-background group-hover:text-primary transition-colors duration-300 mb-4 leading-tight">
                Build Your First AI Agent
              </h3>

              {/* Description */}
              <p className="text-background/60 text-lg mb-6 leading-relaxed">
                Learn the fundamentals of AI agent creation in just 10 minutes. No coding required.
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏱️</span>
                  <div>
                    <p className="text-sm font-semibold text-background">10 min</p>
                    <p className="text-xs text-background/50">Duration</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-background/20" />
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-sm font-semibold text-background">Beginner</p>
                    <p className="text-xs text-background/50">Level</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-background/20" />
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-sm font-semibold text-background">1.2K</p>
                    <p className="text-xs text-background/50">Completed</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-background text-foreground font-semibold group-hover:shadow-lg group-hover:shadow-background/20 transition-all duration-300">
                <span>Start Tutorial</span>
                <svg 
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>

            {/* Right - Visual illustration */}
            <div className="hidden lg:block flex-shrink-0">
              <div className="relative w-72 h-64">
                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 288 256">
                  <path 
                    d="M60 128 L140 80 L220 128 L140 176 Z" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    className="text-background/20"
                    strokeDasharray="4 4"
                  />
                  <line x1="140" y1="80" x2="140" y2="40" stroke="currentColor" strokeWidth="1" className="text-primary/50" />
                  <line x1="220" y1="128" x2="260" y2="128" stroke="currentColor" strokeWidth="1" className="text-primary/50" />
                  <line x1="140" y1="176" x2="140" y2="216" stroke="currentColor" strokeWidth="1" className="text-primary/50" />
                </svg>
                
                {/* Center node - AI Agent */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-4xl">🤖</span>
                </div>
                
                {/* Top node - Input */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-background/10 border border-background/20 backdrop-blur-sm">
                  <span className="text-sm text-background/80">💬 Prompt</span>
                </div>
                
                {/* Right node - Output */}
                <div className="absolute top-1/2 right-0 -translate-y-1/2 px-4 py-2 rounded-xl bg-background/10 border border-background/20 backdrop-blur-sm">
                  <span className="text-sm text-background/80">✨ Output</span>
                </div>
                
                {/* Bottom node - Memory */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-background/10 border border-background/20 backdrop-blur-sm">
                  <span className="text-sm text-background/80">🧠 Memory</span>
                </div>
                
                {/* Left node - Tools */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 px-4 py-2 rounded-xl bg-background/10 border border-background/20 backdrop-blur-sm">
                  <span className="text-sm text-background/80">🔧 Tools</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
