import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface SpotlightAgentProps {
  agent: {
    name: string;
    avatar: string;
    price: string;
    change: number;
    volume: string;
    transactions: number;
    description: string;
    category: string;
  };
}

export function SpotlightAgent({ agent }: SpotlightAgentProps) {
  const isPositive = agent.change > 0;
  
  return (
    <div className="relative">
      {/* Spotlight Badge */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow"></div>
        <span className="text-sm text-muted-foreground">Spotlight Agent</span>
      </div>
      
      <Card className="p-6 bg-gradient-dark border-primary/20 shadow-glow-primary">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-16 h-16 rounded-full border-2 border-primary/50"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full border-2 border-card flex items-center justify-center">
                <Activity className="w-3 h-3 text-secondary-foreground" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-foreground">{agent.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {agent.category}
              </Badge>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{agent.price}</div>
            <div className={`flex items-center space-x-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}{agent.change}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground">24h Volume</div>
            <div className="text-lg font-semibold text-foreground">{agent.volume}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Transactions</div>
            <div className="text-lg font-semibold text-foreground">{agent.transactions.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">Description</div>
          <p className="text-sm text-foreground">{agent.description}</p>
        </div>
        
        {/* Performance Chart Placeholder */}
        <div className="h-20 bg-muted/20 rounded-lg border border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
          <svg className="w-full h-full" viewBox="0 0 300 80">
            <polyline
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              points="0,60 30,45 60,50 90,30 120,35 150,20 180,25 210,15 240,20 270,10 300,15"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </Card>
    </div>
  );
}