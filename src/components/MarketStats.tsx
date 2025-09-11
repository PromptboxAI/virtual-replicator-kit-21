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
      icon: DollarSign
    },
    {
      label: "Active Agents",
      value: formatCount(stats.activeAgents),
      icon: Zap
    },
    {
      label: "Total Holders",
      value: formatCount(stats.totalHolders),
      icon: Users
    },
    {
      label: "24h Volume",
      value: formatNumber(stats.totalVolume),
      icon: TrendingUp
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
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <stat.icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}