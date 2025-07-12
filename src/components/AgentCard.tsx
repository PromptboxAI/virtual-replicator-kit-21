import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    avatar: string;
    price: string;
    change: number;
    volume: string;
    volumeData?: number[]; // Array of volume values for chart
    category: string;
    holders: number;
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  const navigate = useNavigate();
  const isPositive = agent.change > 0;
  
  const handleCardClick = () => {
    navigate(`/trade/${agent.id}`);
  };

  // Generate volume-based chart points (fallback to basic pattern if no volume data)
  const generateVolumeChart = () => {
    if (agent.volumeData && agent.volumeData.length > 0) {
      const max = Math.max(...agent.volumeData);
      const min = Math.min(...agent.volumeData);
      const range = max - min || 1;
      
      return agent.volumeData.map((value, index) => {
        const normalizedValue = ((value - min) / range) * 20 + 6; // Scale to 6-26 range
        const x = (index / (agent.volumeData!.length - 1)) * 100;
        return `${x},${32 - normalizedValue}`;
      }).join(' ');
    }
    
    // Fallback pattern based on current volume trend
    const volumeNumber = parseFloat(agent.volume.replace(/[$M]/g, ''));
    const baseHeight = Math.min(Math.max(volumeNumber * 2, 8), 24);
    return `0,${32 - baseHeight} 25,${32 - baseHeight * 0.8} 50,${32 - baseHeight * 1.1} 75,${32 - baseHeight * 0.9} 100,${32 - baseHeight}`;
  };
  
  return (
    <Card 
      className="p-4 bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary/20 group cursor-pointer"
      onClick={handleCardClick}
    >
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
        
        {/* Volume Chart */}
        <div className="h-8 bg-muted/20 rounded relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 32">
            <polyline
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              points={generateVolumeChart()}
              opacity="0.7"
            />
          </svg>
        </div>
      </div>
    </Card>
  );
}