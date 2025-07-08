import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Zap, DollarSign } from "lucide-react";

export function MarketStats() {
  const stats = [
    {
      label: "Total Market Cap",
      value: "$2.4B",
      change: "+12.5%",
      icon: DollarSign,
      positive: true
    },
    {
      label: "Active Agents",
      value: "1,247",
      change: "+23",
      icon: Zap,
      positive: true
    },
    {
      label: "Total Holders",
      value: "89.2K",
      change: "+5.2%",
      icon: Users,
      positive: true
    },
    {
      label: "24h Volume",
      value: "$156M",
      change: "-3.1%",
      icon: TrendingUp,
      positive: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
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