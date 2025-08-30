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
  getCurrentPriceV3, 
  calculateTokensFromPromptV3, 
  calculateBuyCostV3,
  calculateGraduationProgressV3,
  BONDING_CURVE_V3_CONFIG,
  tokensSoldFromPromptRaisedV3
} from '@/lib/bondingCurveV3';
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
  console.error('BondingCurvePreview error:', error);
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">
            ⚠️ Unable to load bonding curve preview. Please try again later.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function BondingCurvePreview({ 
  agentSymbol, 
  promptRaised, 
  graduationThreshold = BONDING_CURVE_V3_CONFIG.GRADUATION_PROMPT_AMOUNT,
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
  
  // Calculate current state
  const currentTokensSold = tokensSoldFromPromptRaisedV3(promptRaised);
  const currentPrice = getCurrentPriceV3(currentTokensSold);
  const graduationProgress = calculateGraduationProgressV3(promptRaised);
  
  // Calculate preview with simulation amount
  const previewAmount = parseFloat(simulationAmount || '0');
  const previewResult = previewAmount > 0 ? calculateTokensFromPromptV3(currentTokensSold, previewAmount) : null;
  const previewPrice = previewResult ? getCurrentPriceV3(previewResult.newTokensSold) : currentPrice;
  
  // Calculate with actual trade amount if provided
  const tradeResult = tradeAmount > 0 ? calculateTokensFromPromptV3(currentTokensSold, tradeAmount) : null;
  const tradePrice = tradeResult ? getCurrentPriceV3(tradeResult.newTokensSold) : currentPrice;
  
  // Generate curve data points for chart
  const curveData = useMemo(() => {
    const points = [];
    const maxPrompt = Math.min(promptRaised + 2000, graduationThreshold); // Show next 2000 PROMPT or until graduation
    const step = 50; // Every 50 PROMPT
    
    for (let prompt = Math.max(0, promptRaised - 500); prompt <= maxPrompt; prompt += step) {
      const tokensSold = tokensSoldFromPromptRaisedV3(prompt);
      const price = getCurrentPriceV3(tokensSold);
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
          {/* Current State */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-lg font-bold text-primary">
                {formatPrice(currentPrice)}
              </div>
              <div className="text-xs text-muted-foreground">Current Price (PROMPT)</div>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
              <div className="text-lg font-bold text-success">
                {promptRaised.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">PROMPT Raised</div>
            </div>
          </div>

          {/* Graduation Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs items-center">
              <span className="flex items-center gap-1">
                Graduation Progress
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">When graduation threshold is reached, the token will be listed on a decentralized exchange (DEX).</p>
                  </TooltipContent>
                </Tooltip>
              </span>
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
                    stroke="hsl(var(--accent))" 
                    strokeDasharray="2 2"
                  />
                )}
                
                {/* Trade amount marker */}
                {tradeResult && (
                  <ReferenceLine 
                    x={promptRaised + tradeAmount} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="1 1"
                  />
                )}
                
                {/* Graduation line */}
                <ReferenceLine 
                  x={graduationThreshold} 
                  stroke="hsl(var(--success))" 
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 cursor-help">
                  <div className="w-3 h-0.5 bg-primary"></div>
                  <span>Current Position</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Your token's current price on the bonding curve</p>
              </TooltipContent>
            </Tooltip>
            {previewResult && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 cursor-help">
                    <div className="w-3 h-0.5 bg-accent border-t border-dashed border-accent"></div>
                    <span>Preview</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Price position after simulated trade</p>
                </TooltipContent>
              </Tooltip>
            )}
            {tradeResult && tradeAmount !== previewAmount && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 cursor-help">
                    <div className="w-3 h-0.5 bg-destructive border-t border-dashed border-destructive"></div>
                    <span>Trade</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The price after this transaction is completed</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 cursor-help">
                  <div className="w-3 h-0.5 bg-success border-t-2 border-dashed border-success"></div>
                  <span>Graduation</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Buying this much would list the token on a DEX</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Simulation */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Simulate Purchase</span>
            </div>
            
            {/* User Balance Info */}
            {promptBalance !== undefined && (
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Your PROMPT Balance:</span>
                <span className="font-medium">
                  {balanceLoading ? "..." : `${promptBalance.toFixed(2)} PROMPT`}
                </span>
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount in PROMPT"
                value={simulationAmount}
                onChange={(e) => setSimulationAmount(e.target.value)}
                className="text-sm"
                max={promptBalance || undefined}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSimulationAmount('1000')}
                className="text-xs"
              >
                1k
              </Button>
              {promptBalance && promptBalance > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSimulationAmount(promptBalance.toString())}
                      className="text-xs"
                    >
                      Max
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Use your full PROMPT balance ({promptBalance.toFixed(2)})</p>
                  </TooltipContent>
                </Tooltip>
              )}
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
                
                {/* Balance warning */}
                {promptBalance !== undefined && previewAmount > promptBalance && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-medium">
                      Insufficient balance. You need {previewAmount.toFixed(2)} but have {promptBalance.toFixed(2)} PROMPT.
                    </span>
                  </div>
                )}
                
                {/* Graduation check */}
                {promptRaised + previewAmount >= graduationThreshold && (
                  <div className="flex items-center gap-2 text-xs text-success bg-success/10 p-2 rounded">
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
                <Zap className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Current Trade Impact</span>
              </div>
              <div className="bg-accent/10 rounded-lg p-3 space-y-2 border border-accent/20">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-medium">Trade Size</div>
                    <div className="text-accent font-bold">
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
    </TooltipProvider>
  );
}