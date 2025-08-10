import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Zap, DollarSign, Loader2 } from "lucide-react";
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

  const marketStatsData = [
    {
      label: "Total Market Cap",
      value: formatNumber(stats.totalMarketCap),
      change: "+12.5%",
      icon: DollarSign,
      positive: true
    },
    {
      label: "Active Agents",
      value: formatCount(stats.activeAgents),
      change: "+23",
      icon: Zap,
      positive: true
    },
    {
      label: "Total Holders",
      value: formatCount(stats.totalHolders || 892), // Mock data for now
      change: "+5.2%",
      icon: Users,
      positive: true
    },
    {
      label: "24h Volume",
      value: formatNumber(stats.totalVolume),
      change: "-3.1%",
      icon: TrendingUp,
      positive: false
    }
  ];

  return (
    <div className="relative">
      {/* AI Agent Creation Hooks - Animated connection lines */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hookGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Flowing connection hooks between stats */}
          <path
            d="M10,15 Q30,5 50,15 Q70,25 90,15"
            fill="none"
            stroke="url(#hookGradient)"
            strokeWidth="0.5"
            strokeDasharray="4,8"
            className="animate-hook-flow"
          />
          <path
            d="M15,20 Q35,10 55,20 Q75,30 95,20"
            fill="none"
            stroke="url(#hookGradient)"
            strokeWidth="0.3"
            strokeDasharray="6,12"
            className="animate-hook-flow"
            style={{ animationDelay: '2s' }}
          />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {marketStatsData.map((stat, index) => (
          <Card 
            key={index} 
            className="p-4 bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-500 group animate-fade-in-scale hover:animate-glow-pulse hover:shadow-glow-primary/20"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground group-hover:text-primary/80 transition-colors">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  {stat.value}
                </p>
                <p className={`text-sm transition-all duration-300 ${stat.positive ? 'text-success group-hover:text-success/80' : 'text-destructive group-hover:text-destructive/80'}`}>
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-lg transition-all duration-300 group-hover:scale-110 animate-bounce-gentle ${stat.positive ? 'bg-success/10 group-hover:bg-success/20' : 'bg-destructive/10 group-hover:bg-destructive/20'}`}>
                <stat.icon className={`w-6 h-6 transition-all duration-300 ${stat.positive ? 'text-success group-hover:text-success/90' : 'text-destructive group-hover:text-destructive/90'}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}