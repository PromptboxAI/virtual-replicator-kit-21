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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {marketStatsData.map((stat, index) => (
        <Card key={index} className="p-4 bg-card/50 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className={`text-sm ${stat.positive ? 'text-success' : 'text-destructive'}`}>
                {stat.change}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${stat.positive ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <stat.icon className={`w-6 h-6 ${stat.positive ? 'text-success' : 'text-destructive'}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}