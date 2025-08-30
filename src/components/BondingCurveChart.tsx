import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Target } from "lucide-react";
import { 
  getCurrentPriceV3, 
  BONDING_CURVE_V3_CONFIG, 
  calculateGraduationProgressV3, 
  tokensSoldFromPromptRaisedV3, 
  formatPriceV3, 
  formatTokenAmountV3,
  promptRaisedFromTokensSoldV3
} from "@/lib/bondingCurveV3";

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
  // Generate enhanced data points showing linear progression to 42k
  const generateCurveData = () => {
    const data = [];
    const maxPoints = 100;
    const { CURVE_SUPPLY, GRADUATION_PROMPT_AMOUNT } = BONDING_CURVE_V3_CONFIG;
    
    // Show curve from 0 to max(current position * 1.2, full curve)
    const actualTokensSold = tokensSoldFromPromptRaisedV3(promptRaised);
    const maxTokens = Math.max(actualTokensSold * 1.2, CURVE_SUPPLY);
    const step = maxTokens / maxPoints;
    
    for (let i = 0; i <= maxPoints; i++) {
      const tokensSold = Math.min(i * step, CURVE_SUPPLY);
      const price = getCurrentPriceV3(tokensSold);
      const promptRaisedAtPoint = promptRaisedFromTokensSoldV3(tokensSold);
      
      data.push({
        tokensSold,
        price,
        promptRaised: promptRaisedAtPoint,
        isGraduationZone: promptRaisedAtPoint >= GRADUATION_PROMPT_AMOUNT,
        isCurrentPoint: Math.abs(tokensSold - actualTokensSold) < step / 2
      });
    }
    
    return data;
  };

  const curveData = generateCurveData();
  const actualTokensSold = tokensSoldFromPromptRaisedV3(promptRaised);
  const currentPrice = getCurrentPriceV3(actualTokensSold);
  const graduationInfo = calculateGraduationProgressV3(promptRaised);

  // Enhanced custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`Tokens: ${formatTokenAmountV3(data.tokensSold)}`}</p>
          <p className="text-sm text-primary">{`Price: ${formatPriceV3(data.price)} PROMPT`}</p>
          <p className="text-sm text-muted-foreground">{`PROMPT Raised: ${formatTokenAmountV3(data.promptRaised)}`}</p>
          {data.isGraduationZone && (
            <p className="text-xs text-green-600 font-medium">✅ Graduation Zone</p>
          )}
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
          Linear Bonding Curve
        </CardTitle>
        <CardDescription>
          Price increases linearly to {formatTokenAmountV3(BONDING_CURVE_V3_CONFIG.GRADUATION_PROMPT_AMOUNT)} PROMPT graduation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enhanced Current Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {formatPriceV3(currentPrice)}
            </div>
            <div className="text-xs text-muted-foreground">Current Price (PROMPT)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {formatTokenAmountV3(actualTokensSold)}
            </div>
            <div className="text-xs text-muted-foreground">Tokens Sold</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {graduationInfo.progressDisplay}
            </div>
            <div className="text-xs text-muted-foreground">To Graduation</div>
          </div>
        </div>

        {/* Enhanced Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="tokensSold"
                tickFormatter={(value) => formatTokenAmountV3(value)}
                fontSize={10}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                tickFormatter={(value) => formatPriceV3(value)}
                fontSize={10}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Current position marker */}
              <ReferenceLine 
                x={actualTokensSold} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label={{ value: "Current", position: "top" }}
              />
              
              {/* Graduation threshold marker */}
              <ReferenceLine 
                y={BONDING_CURVE_V3_CONFIG.P1} 
                stroke="hsl(var(--accent))" 
                strokeDasharray="5 5"
                label={{ value: "Max Price", position: "top" }}
              />
              
              {/* Linear price curve */}
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

        {/* Enhanced Graduation Progress */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Graduation Progress</span>
              <span className="text-sm text-muted-foreground">{graduationInfo.progressDisplay}</span>
            </div>
            <Progress value={graduationInfo.progress} className="h-2" />
            {graduationInfo.isNearGraduation && (
              <div className="mt-2 text-xs text-primary font-medium">
                ⚡ Almost ready for DEX launch!
              </div>
            )}
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium text-center mb-2">
              {graduationInfo.countdownMessage}
            </div>
            {!graduationInfo.isGraduated && (
              <div className="text-xs text-muted-foreground text-center">
                Need {formatTokenAmountV3(graduationInfo.remaining)} more PROMPT to launch on DEX
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Curve Explanation */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Linear bonding curve: Price = {formatPriceV3(BONDING_CURVE_V3_CONFIG.P0)} + slope × tokens_sold</p>
          <p>• Each purchase increases price linearly for next buyer</p>
          <p>• Graduation at {formatTokenAmountV3(BONDING_CURVE_V3_CONFIG.GRADUATION_PROMPT_AMOUNT)} PROMPT creates LP with 70% of funds</p>
          <p>• {formatTokenAmountV3(BONDING_CURVE_V3_CONFIG.LP_RESERVE)} tokens + PROMPT locked for {BONDING_CURVE_V3_CONFIG.LIQUIDITY_LOCK_YEARS} years</p>
        </div>
      </CardContent>
    </Card>
  );
};