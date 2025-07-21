import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import { TrendingUp, Calculator, Target, Zap } from 'lucide-react';
import { 
  getCurrentPrice, 
  calculateTokensFromPrompt, 
  calculateBuyCost,
  calculateGraduationProgress,
  BONDING_CURVE_CONFIG 
} from '@/lib/bondingCurve';
import { cn } from '@/lib/utils';

interface BondingCurvePreviewProps {
  agentSymbol: string;
  promptRaised: number;
  graduationThreshold?: number;
  className?: string;
  tradeAmount?: number;
}

export function BondingCurvePreview({ 
  agentSymbol, 
  promptRaised, 
  graduationThreshold = BONDING_CURVE_CONFIG.GRADUATION_PROMPT_AMOUNT,
  className,
  tradeAmount = 0
}: BondingCurvePreviewProps) {
  const [simulationAmount, setSimulationAmount] = useState('100');
  
  // Calculate current state
  const currentTokensSold = promptRaised * 1000; // Rough conversion for demo
  const currentPrice = getCurrentPrice(currentTokensSold);
  const graduationProgress = calculateGraduationProgress(promptRaised);
  
  // Calculate preview with simulation amount
  const previewAmount = parseFloat(simulationAmount || '0');
  const previewResult = previewAmount > 0 ? calculateTokensFromPrompt(currentTokensSold, previewAmount) : null;
  const previewPrice = previewResult ? getCurrentPrice(previewResult.newTokensSold) : currentPrice;
  
  // Calculate with actual trade amount if provided
  const tradeResult = tradeAmount > 0 ? calculateTokensFromPrompt(currentTokensSold, tradeAmount) : null;
  const tradePrice = tradeResult ? getCurrentPrice(tradeResult.newTokensSold) : currentPrice;
  
  // Generate curve data points for chart
  const curveData = useMemo(() => {
    const points = [];
    const maxPrompt = Math.min(promptRaised + 2000, graduationThreshold); // Show next 2000 PROMPT or until graduation
    const step = 50; // Every 50 PROMPT
    
    for (let prompt = Math.max(0, promptRaised - 500); prompt <= maxPrompt; prompt += step) {
      const tokensSold = prompt * 1000;
      const price = getCurrentPrice(tokensSold);
      points.push({
        prompt,
        price: price * 1000000, // Scale for better visualization
        isGraduation: prompt >= graduationThreshold
      });
    }
    
    return points;
  }, [promptRaised, graduationThreshold]);
  
  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(4);
    if (price < 0.01) return price.toFixed(6);
    return price.toFixed(4);
  };
  
  const priceImpact = previewResult ? 
    ((previewPrice - currentPrice) / currentPrice * 100) : 0;
  
  const tradePriceImpact = tradeResult ? 
    ((tradePrice - currentPrice) / currentPrice * 100) : 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Bonding Curve Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current State */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">
              {formatPrice(currentPrice)}
            </div>
            <div className="text-xs text-blue-600">Current Price (PROMPT)</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">
              {promptRaised.toLocaleString()}
            </div>
            <div className="text-xs text-green-600">PROMPT Raised</div>
          </div>
        </div>

        {/* Graduation Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Graduation Progress</span>
            <span>{graduationProgress.progress.toFixed(1)}%</span>
          </div>
          <Progress value={graduationProgress.progress} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {graduationProgress.remaining.toLocaleString()} PROMPT remaining
          </div>
        </div>

        {/* Price Chart */}
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData}>
              <XAxis 
                dataKey="prompt" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                domain={['dataMin', 'dataMax']}
              />
              
              {/* Main curve line */}
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              
              {/* Current position marker */}
              <ReferenceLine 
                x={promptRaised} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="3 3"
              />
              
              {/* Preview position marker */}
              {previewResult && (
                <ReferenceLine 
                  x={promptRaised + previewAmount} 
                  stroke="orange" 
                  strokeDasharray="2 2"
                />
              )}
              
              {/* Trade amount marker */}
              {tradeResult && (
                <ReferenceLine 
                  x={promptRaised + tradeAmount} 
                  stroke="red" 
                  strokeDasharray="1 1"
                />
              )}
              
              {/* Graduation line */}
              <ReferenceLine 
                x={graduationThreshold} 
                stroke="green" 
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-primary"></div>
            <span>Current</span>
          </div>
          {previewResult && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-orange-500" style={{borderTop: '1px dashed orange'}}></div>
              <span>Preview</span>
            </div>
          )}
          {tradeResult && tradeAmount !== previewAmount && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500" style={{borderTop: '1px dashed red'}}></div>
              <span>Trade</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500" style={{borderTop: '2px dashed green'}}></div>
            <span>Graduation</span>
          </div>
        </div>

        {/* Simulation */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Simulate Purchase</span>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Amount in PROMPT"
              value={simulationAmount}
              onChange={(e) => setSimulationAmount(e.target.value)}
              className="text-sm"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSimulationAmount('1000')}
              className="text-xs"
            >
              1k
            </Button>
          </div>

          {/* Simulation Results */}
          {previewResult && previewAmount > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-medium">You Get</div>
                  <div className="text-primary font-bold">
                    {previewResult.tokenAmount.toFixed(2)} {agentSymbol}
                  </div>
                </div>
                <div>
                  <div className="font-medium">New Price</div>
                  <div className="font-bold">
                    {formatPrice(previewPrice)} PROMPT
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span>Price Impact:</span>
                <Badge variant={Math.abs(priceImpact) > 5 ? "destructive" : "secondary"}>
                  {priceImpact > 0 ? '+' : ''}{priceImpact.toFixed(2)}%
                </Badge>
              </div>
              
              {/* Graduation check */}
              {promptRaised + previewAmount >= graduationThreshold && (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                  <Target className="h-3 w-3" />
                  <span className="font-medium">This purchase will trigger graduation!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Trade Impact (if provided) */}
        {tradeResult && tradeAmount > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Current Trade Impact</span>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-medium">Trade Size</div>
                  <div className="text-orange-700 font-bold">
                    {tradeAmount.toFixed(2)} PROMPT
                  </div>
                </div>
                <div>
                  <div className="font-medium">Price After</div>
                  <div className="font-bold">
                    {formatPrice(tradePrice)} PROMPT
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span>Price Impact:</span>
                <Badge variant={Math.abs(tradePriceImpact) > 5 ? "destructive" : "secondary"}>
                  {tradePriceImpact > 0 ? '+' : ''}{tradePriceImpact.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}