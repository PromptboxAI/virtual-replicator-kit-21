import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Target } from "lucide-react";
import { getCurrentPrice, BONDING_CURVE_CONFIG } from "@/lib/bondingCurve";

interface BondingCurveChartProps {
  currentTokensSold: number;
  graduationThreshold: number;
  promptRaised: number;
  className?: string;
}

export const BondingCurveChart = ({ 
  currentTokensSold, 
  graduationThreshold, 
  promptRaised,
  className 
}: BondingCurveChartProps) => {
  // Generate data points for the bonding curve
  const generateCurveData = () => {
    const data = [];
    const maxTokens = Math.min(currentTokensSold * 2, BONDING_CURVE_CONFIG.TOTAL_SUPPLY * 0.8);
    const step = maxTokens / 50; // 50 data points
    
    for (let tokens = 0; tokens <= maxTokens; tokens += step) {
      const price = getCurrentPrice(tokens);
      const promptEquivalent = tokens * price;
      
      data.push({
        tokensSold: tokens,
        price: price,
        promptRaised: promptEquivalent,
        isCurrentPoint: Math.abs(tokens - currentTokensSold) < step / 2
      });
    }
    
    return data;
  };

  const curveData = generateCurveData();
  const currentPrice = getCurrentPrice(currentTokensSold);
  const graduationProgress = Math.min((promptRaised / graduationThreshold) * 100, 100);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`Tokens Sold: ${(data.tokensSold / 1000000).toFixed(2)}M`}</p>
          <p className="text-sm text-blue-600">{`Price: $${data.price.toFixed(8)}`}</p>
          <p className="text-sm text-muted-foreground">{`PROMPT Raised: ${data.promptRaised.toFixed(0)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Bonding Curve
        </CardTitle>
        <CardDescription>
          Token price increases as more tokens are sold following a mathematical curve
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              ${currentPrice.toFixed(8)}
            </div>
            <div className="text-xs text-muted-foreground">Current Price</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {(currentTokensSold / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-muted-foreground">Tokens Sold</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {graduationProgress.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">To Graduation</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="tokensSold"
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                fontSize={10}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toFixed(6)}`}
                fontSize={10}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Graduation threshold line */}
              <ReferenceLine 
                x={graduationThreshold * 1000} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                label={{ value: "Graduation", position: "top" }}
              />
              
              {/* Current position line */}
              <ReferenceLine 
                x={currentTokensSold} 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                label={{ value: "Current", position: "top" }}
              />
              
              {/* Price curve */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: "hsl(var(--primary))",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Graduation Info */}
        {graduationProgress < 100 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Target className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900">
                {(graduationThreshold - promptRaised).toLocaleString()} PROMPT needed to graduate
              </div>
              <div className="text-xs text-blue-600">
                After graduation, the token will be listed on DEX with liquidity
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {graduationProgress.toFixed(1)}%
            </Badge>
          </div>
        )}

        {/* Curve Explanation */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Price follows a constant product bonding curve (x × y = k)</p>
          <p>• Each purchase increases the price for the next buyer</p>
          <p>• At graduation, remaining tokens + raised PROMPT create DEX liquidity</p>
        </div>
      </CardContent>
    </Card>
  );
};