import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    avatar: string;
    price: string;
    change: number;
    volume: string;
    category: string;
    holders: number;
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  const isPositive = agent.change > 0;
  
  return (
    <Card className="p-4 bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary/20 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-12 h-12 rounded-full border-2 border-primary/30 group-hover:border-primary/60 transition-colors"
          />
          <div>
            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {agent.name}
            </h4>
            <Badge variant="outline" className="text-xs">
              {agent.category}
            </Badge>
          </div>
        </div>
        
        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <BarChart3 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">{agent.price}</span>
          <div className={`flex items-center space-x-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-sm font-medium">
              {isPositive ? '+' : ''}{agent.change}%
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Volume</span>
            <div className="font-medium text-foreground">{agent.volume}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Holders</span>
            <div className="font-medium text-foreground">{agent.holders}</div>
          </div>
        </div>
        
        {/* Mini Chart */}
        <div className="h-8 bg-muted/20 rounded relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 32">
            <polyline
              fill="none"
              stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              strokeWidth="1.5"
              points={`0,${Math.random() * 16 + 8} 20,${Math.random() * 16 + 8} 40,${Math.random() * 16 + 8} 60,${Math.random() * 16 + 8} 80,${Math.random() * 16 + 8} 100,${Math.random() * 16 + 8}`}
              opacity="0.7"
            />
          </svg>
        </div>
      </div>
    </Card>
  );
}