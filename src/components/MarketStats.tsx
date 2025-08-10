import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Zap, DollarSign, Loader2, Circle } from "lucide-react";
import { useMarketStats } from "@/hooks/useMarketStats";

export function MarketStats() {
  const { stats, loading, error } = useMarketStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="p-4 bg-card/50 backdrop-blur-sm border-border">
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border col-span-full">
          <p className="text-destructive text-center">Error loading market stats: {error}</p>
        </Card>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const agentWorkflowData = [
    {
      id: "token",
      label: "Token",
      value: formatNumber(stats.totalMarketCap),
      subtitle: "Market Cap",
      icon: DollarSign,
      color: "hsl(var(--primary))",
      bgColor: "hsl(var(--primary) / 0.1)"
    },
    {
      id: "agent", 
      label: "Agent",
      value: formatCount(stats.activeAgents),
      subtitle: "Active",
      icon: Zap,
      color: "hsl(var(--secondary))",
      bgColor: "hsl(var(--secondary) / 0.1)"
    },
    {
      id: "value",
      label: "Value", 
      value: formatNumber(stats.totalVolume),
      subtitle: "24h Volume",
      icon: TrendingUp,
      color: "hsl(var(--accent))",
      bgColor: "hsl(var(--accent) / 0.1)"
    }
  ];

  return (
    <div className="relative flex items-center justify-center gap-8 py-8 px-4 max-w-4xl mx-auto">
      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="connectionGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="connectionGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        
        {/* First connection line */}
        <line 
          x1="33%" y1="50%" 
          x2="50%" y2="50%" 
          stroke="url(#connectionGradient1)" 
          strokeWidth="2"
          strokeDasharray="4 4"
          className="animate-pulse"
        />
        
        {/* Second connection line */}
        <line 
          x1="50%" y1="50%" 
          x2="67%" y2="50%" 
          stroke="url(#connectionGradient2)" 
          strokeWidth="2"
          strokeDasharray="4 4"
          className="animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </svg>

      {agentWorkflowData.map((node, index) => (
        <div key={node.id} className="relative z-10">
          {/* Connection Handles */}
          {index > 0 && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3">
              <Circle 
                className="w-3 h-3 text-muted-foreground/60 animate-pulse" 
                fill="currentColor"
                style={{ animationDelay: `${index * 0.2}s` }}
              />
            </div>
          )}
          
          {index < agentWorkflowData.length - 1 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3">
              <Circle 
                className="w-3 h-3 text-muted-foreground/60 animate-pulse" 
                fill="currentColor"
                style={{ animationDelay: `${index * 0.2 + 0.1}s` }}
              />
            </div>
          )}

          {/* Agent Card */}
          <Card 
            className="p-6 bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg min-w-[160px] group"
            style={{ 
              borderColor: node.color + "40",
              boxShadow: `0 4px 20px ${node.color}20`
            }}
          >
            <div className="text-center space-y-3">
              {/* Icon */}
              <div 
                className="w-12 h-12 rounded-lg mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: node.bgColor }}
              >
                <node.icon 
                  className="w-6 h-6" 
                  style={{ color: node.color }} 
                />
              </div>
              
              {/* Label */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">{node.label}</h3>
                <p className="text-xs text-muted-foreground">{node.subtitle}</p>
              </div>
              
              {/* Value */}
              <p className="text-xl font-bold" style={{ color: node.color }}>
                {node.value}
              </p>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}