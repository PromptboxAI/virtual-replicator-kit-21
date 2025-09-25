import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import { TrendingUp, Calculator, Target, Zap, HelpCircle, AlertTriangle } from 'lucide-react';
import { 
  getCurrentPriceV4, 
  calculateTokensFromPromptV4, 
  calculateBuyCostV4,
  calculateGraduationProgressV4,
  BONDING_CURVE_V4_CONFIG,
  tokensSoldFromPromptRaisedV4,
  formatPriceV4,
  formatTokenAmountV4,
  isAgentGraduatedV4
} from '@/lib/bondingCurveV4';
import { cn } from '@/lib/utils';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useAuth } from '@/hooks/useAuth';

interface BondingCurvePreviewProps {
  agentSymbol: string;
  promptRaised: number;
  graduationThreshold?: number;
  className?: string;
  tradeAmount?: number;
}

// Error boundary component for graceful error handling
function BondingCurveErrorFallback({ error }: { error: Error }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Chart Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Unable to load bonding curve preview.</p>
          <p className="mt-1 text-xs opacity-75">
            {error.message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function BondingCurvePreview({ 
  agentSymbol, 
  promptRaised, 
  graduationThreshold = BONDING_CURVE_V4_CONFIG.GRADUATION_PROMPT_AMOUNT,
  className,
  tradeAmount = 0
}: BondingCurvePreviewProps) {
  const [simulationAmount, setSimulationAmount] = useState('100');
  const { user } = useAuth();
  const { balance: promptBalance, loading: balanceLoading } = useTokenBalance(user?.id);

  // Error handling wrapper
  try {
    return <BondingCurvePreviewContent 
      agentSymbol={agentSymbol}
      promptRaised={promptRaised}
      graduationThreshold={graduationThreshold}
      className={className}
      tradeAmount={tradeAmount}
      simulationAmount={simulationAmount}
      setSimulationAmount={setSimulationAmount}
      promptBalance={promptBalance}
      balanceLoading={balanceLoading}
    />;
  } catch (error) {
    return <BondingCurveErrorFallback error={error as Error} />;
  }
}

function BondingCurvePreviewContent({ 
  agentSymbol, 
  promptRaised, 
  graduationThreshold,
  className,
  tradeAmount,
  simulationAmount,
  setSimulationAmount,
  promptBalance,
  balanceLoading
}: BondingCurvePreviewProps & {
  simulationAmount: string;
  setSimulationAmount: (value: string) => void;
  promptBalance?: number;
  balanceLoading: boolean;
}) {
  
  // Calculate current state using V4
  const currentTokensSold = tokensSoldFromPromptRaisedV4(promptRaised);
  const currentPrice = getCurrentPriceV4(currentTokensSold);
  const graduationProgress = calculateGraduationProgressV4(promptRaised);
  
  // Calculate preview with simulation amount
  const previewAmount = parseFloat(simulationAmount || '0');
  const previewResult = previewAmount > 0 ? calculateTokensFromPromptV4(currentTokensSold, previewAmount) : null;
  const previewPrice = previewResult ? getCurrentPriceV4(previewResult.newTokensSold) : currentPrice;
  
  // Calculate with actual trade amount if provided
  const tradeResult = tradeAmount > 0 ? calculateTokensFromPromptV4(currentTokensSold, tradeAmount) : null;
  const tradePrice = tradeResult ? getCurrentPriceV4(tradeResult.newTokensSold) : currentPrice;
  
  // Generate curve data points for chart using V4
  const curveData = useMemo(() => {
    const points = [];
    const maxPrompt = Math.min(promptRaised + 2000, graduationThreshold); // Show next 2000 PROMPT or until graduation
    const step = 50; // Every 50 PROMPT
    
    for (let prompt = Math.max(0, promptRaised - 500); prompt <= maxPrompt; prompt += step) {
      const tokensSold = tokensSoldFromPromptRaisedV4(prompt);
      const price = getCurrentPriceV4(tokensSold);
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
    <TooltipProvider>
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Bonding Curve Preview
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">View how token prices change as more PROMPT is raised. The curve shows price impact before and after trades.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Current Price: {formatPriceV4(currentPrice)} PROMPT</p>
              <p className="text-muted-foreground">PROMPT Raised: {formatTokenAmountV4(promptRaised)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Graduation:</span>
                <Badge variant={graduationProgress.isGraduated ? "default" : "secondary"}>
                  {graduationProgress.progressDisplay}
                </Badge>
              </div>
              <Progress value={graduationProgress.progress} className="h-2 mt-1" />
            </div>
          </div>

          {/* Price Chart */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curveData}>
                <XAxis 
                  dataKey="prompt" 
                  tick={false} 
                  axisLine={false}
                />
                <YAxis hide />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
                
                {/* Current position */}
                <ReferenceLine x={promptRaised} stroke="hsl(var(--primary))" strokeDasharray="5 5" />
                
                {/* Graduation threshold */}
                <ReferenceLine x={BONDING_CURVE_V4_CONFIG.GRADUATION_PROMPT_AMOUNT} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                
                {/* Preview position if simulating */}
                {previewResult && (
                  <ReferenceLine 
                    x={promptRaised + previewAmount} 
                    stroke="hsl(var(--accent))" 
                    strokeDasharray="3 3" 
                  />
                )}
                
                {/* Trade position if trading */}
                {tradeResult && (
                  <ReferenceLine 
                    x={promptRaised + tradeAmount} 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-primary"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-destructive"></div>
              <span>Graduation</span>
            </div>
            {previewResult && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-accent"></div>
                <span>Preview</span>
              </div>
            )}
            {tradeResult && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-secondary"></div>
                <span>Trade</span>
              </div>
            )}
          </div>

          {/* Simulation Section */}
          <div className="space-y-3 pt-2 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              Simulate Trade Amount: {formatTokenAmountV4(parseFloat(simulationAmount || '0'))} PROMPT
            </div>
            
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="PROMPT amount"
                value={simulationAmount}
                onChange={(e) => setSimulationAmount(e.target.value)}
                className="flex-1"
                min="0"
                step="1"
              />
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSimulationAmount('10')}
                >
                  10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSimulationAmount('100')}
                >
                  100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSimulationAmount('500')}
                >
                  500
                </Button>
              </div>
            </div>

            {/* User Balance */}
            {!balanceLoading && promptBalance !== undefined && (
              <div className="text-xs text-muted-foreground">
                Your Balance: {formatTokenAmountV4(promptBalance)} PROMPT
                {parseFloat(simulationAmount || '0') > promptBalance && (
                  <span className="text-destructive ml-1">(Insufficient balance)</span>
                )}
              </div>
            )}

            {/* Simulation Results */}
            {previewResult && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">
                  +{formatTokenAmountV4(previewResult.tokenAmount)} tokens
                </div>
                <div className="text-sm text-muted-foreground">
                  New Price: {formatPriceV4(previewResult.newPrice)} PROMPT
                </div>
                <div className="text-sm text-muted-foreground">
                  Price Impact: {previewResult.priceImpact.toFixed(2)}%
                </div>
              </div>
            )}

            {/* Graduation Warning */}
            {previewResult && promptRaised + previewAmount >= graduationThreshold && (
              <div className="text-xs text-green-600 font-medium">
                🎓 Would purchase {formatTokenAmountV4(previewResult.tokenAmount)} tokens with graduation!
              </div>
            )}

            {/* Trade Impact Display */}
            {tradeResult && tradeAmount > 0 && (
              <div className="text-sm text-muted-foreground mb-2">
                Impact: +{formatTokenAmountV4(tradeResult.tokenAmount)} tokens, {tradeResult.priceImpact.toFixed(2)}% price impact
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}