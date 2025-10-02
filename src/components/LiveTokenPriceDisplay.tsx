import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { 
  getCurrentPriceV3, 
  tokensSoldFromPromptRaisedV3, 
  calculateBuyCostV3, 
  calculateSellReturnV3,
  formatPriceV3,
  formatTokenAmountV3,
  calculateGraduationProgressV3,
  BONDING_CURVE_V3_CONFIG
} from '@/lib/bondingCurveV3';
import { 
  getCurrentPriceV4, 
  tokensSoldFromPromptRaisedV4, 
  calculateBuyCostV4, 
  calculateSellReturnV4,
  formatPriceV4,
  formatTokenAmountV4,
  BONDING_CURVE_V4_CONFIG
} from '@/lib/bondingCurveV4';
import { cn } from '@/lib/utils';
import { PriceDisplay } from './PriceDisplay';

interface LiveTokenPriceDisplayProps {
  agentId: string;
  agentSymbol: string;
  promptRaised: number;
  pricingModel?: 'linear_v3' | 'linear_v4';
  tradeAmount?: number;
  tradeType?: 'buy' | 'sell';
  className?: string;
}

export function LiveTokenPriceDisplay({ 
  agentId,
  agentSymbol, 
  promptRaised,
  pricingModel = 'linear_v3', 
  tradeAmount, 
  tradeType = 'buy',
  className 
}: LiveTokenPriceDisplayProps) {
  const [showInverse, setShowInverse] = useState(false);
  
  // Use appropriate pricing functions based on pricing model
  const isV4 = pricingModel === 'linear_v4';
  const tokensSold = isV4 
    ? tokensSoldFromPromptRaisedV4(promptRaised)
    : tokensSoldFromPromptRaisedV3(promptRaised);
  const currentPrice = isV4 
    ? getCurrentPriceV4(tokensSold)
    : getCurrentPriceV3(tokensSold);
  const graduationInfo = isV4
    ? { 
        promptRaised,
        threshold: BONDING_CURVE_V4_CONFIG.GRADUATION_PROMPT_AMOUNT,
        percentComplete: (promptRaised / BONDING_CURVE_V4_CONFIG.GRADUATION_PROMPT_AMOUNT) * 100,
        isGraduated: promptRaised >= BONDING_CURVE_V4_CONFIG.GRADUATION_PROMPT_AMOUNT,
        isNearGraduation: promptRaised >= BONDING_CURVE_V4_CONFIG.GRADUATION_PROMPT_AMOUNT * 0.9,
        countdownMessage: `${promptRaised.toLocaleString()} / ${BONDING_CURVE_V4_CONFIG.GRADUATION_PROMPT_AMOUNT.toLocaleString()} PROMPT`
      }
    : calculateGraduationProgressV3(promptRaised);
  
  // Calculate trade impact if provided
  let newPrice = currentPrice;
  let priceImpact = 0;
  let isHighImpact = false;
  let slippage = 0;
  
  if (tradeAmount && tradeAmount > 0) {
    if (tradeType === 'buy') {
      const impact = isV4
        ? calculateBuyCostV4(tokensSold, tradeAmount)
        : calculateBuyCostV3(tokensSold, tradeAmount);
      newPrice = isV4
        ? getCurrentPriceV4(impact.newTokensSold)
        : getCurrentPriceV3(impact.newTokensSold);
      priceImpact = impact.priceImpact;
      // V3 returns isHighImpact, V4 doesn't - calculate manually for V4
      isHighImpact = isV4 
        ? Math.abs(priceImpact) > BONDING_CURVE_V4_CONFIG.MAX_PRICE_IMPACT_WARNING
        : (impact as any).isHighImpact;
      slippage = impact.slippage;
    } else {
      const impact = isV4
        ? calculateSellReturnV4(tokensSold, tradeAmount)
        : calculateSellReturnV3(tokensSold, tradeAmount);
      newPrice = isV4
        ? getCurrentPriceV4(impact.newTokensSold)
        : getCurrentPriceV3(impact.newTokensSold);
      priceImpact = impact.priceImpact;
      // V3 returns isHighImpact, V4 doesn't - calculate manually for V4
      isHighImpact = isV4 
        ? Math.abs(priceImpact) > BONDING_CURVE_V4_CONFIG.MAX_PRICE_IMPACT_WARNING
        : (impact as any).isHighImpact;
      slippage = impact.slippage;
    }
  }
  
  // Use appropriate formatters based on pricing model
  const formatPrice = isV4 ? formatPriceV4 : formatPriceV3;
  const formatTokenAmount = isV4 ? formatTokenAmountV4 : formatTokenAmountV3;
  const HIGH_SLIPPAGE = isV4 ? BONDING_CURVE_V4_CONFIG.HIGH_SLIPPAGE_THRESHOLD : BONDING_CURVE_V3_CONFIG.HIGH_SLIPPAGE_THRESHOLD;
  
  // Calculate forward and inverse rates
  const forwardRate = currentPrice; // 1 Token = X PROMPT
  const inverseRate = 1 / currentPrice; // 1 PROMPT = X Tokens
  
  const isPriceImpactSignificant = Math.abs(priceImpact) > 2;
  
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4 space-y-3">
        {/* Price Toggle Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Current Price</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInverse(!showInverse)}
            className="h-6 px-2 text-xs"
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            {showInverse ? 'Show Forward' : 'Show Inverse'}
          </Button>
        </div>
        
        {/* Price Display - Use unified PriceDisplay component */}
        <div className="space-y-2">
          {showInverse ? (
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatTokenAmount(inverseRate)}
              </div>
              <div className="text-sm text-muted-foreground">
                {agentSymbol} per 1 PROMPT
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <PriceDisplay 
                agentId={agentId}
                variant="prompt-primary"
                showBoth={false}
              />
            </div>
          )}
          
          {/* Alternative rate display */}
          <div className="text-center text-xs text-muted-foreground">
            {showInverse ? (
              <>1 {agentSymbol} = {formatPrice(forwardRate)} PROMPT</>
            ) : (
              <>1 PROMPT = {formatTokenAmount(inverseRate)} {agentSymbol}</>
            )}
          </div>
        </div>
        
        {/* Graduation Progress Indicator */}
        {!graduationInfo.isGraduated && (
          <div className="p-2 bg-primary/5 border border-primary/10 rounded-md">
            <div className="text-xs text-primary font-medium">
              {graduationInfo.countdownMessage}
            </div>
            {graduationInfo.isNearGraduation && (
              <div className="text-xs text-muted-foreground mt-1">
                ⚡ Close to DEX launch!
              </div>
            )}
          </div>
        )}
        
        {/* Enhanced Price Impact Warning */}
        {tradeAmount && (isHighImpact || Math.abs(priceImpact) > HIGH_SLIPPAGE) && (
          <div className={cn(
            "flex items-center gap-1 p-2 rounded-lg text-sm",
            isHighImpact 
              ? "bg-destructive/10 text-destructive border border-destructive/20" 
              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
          )}>
            <AlertTriangle className="h-3 w-3" />
            <span className="font-medium">
              {isHighImpact ? 'High' : 'Moderate'} Impact: {priceImpact.toFixed(2)}%
            </span>
            {slippage > 0 && (
              <span className="text-xs ml-2">
                Slippage: {slippage.toFixed(2)}%
              </span>
            )}
          </div>
        )}
        
        {/* Enhanced Trade Impact Preview */}
        {tradeAmount && tradeAmount > 0 && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Current Price</span>
              <span>{formatPrice(currentPrice)} PROMPT</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Price After Trade</span>
              <div className="flex items-center gap-1">
                <span>{formatPrice(newPrice)} PROMPT</span>
                {priceImpact !== 0 && (
                  <Badge variant={priceImpact > 0 ? "default" : "destructive"} className="text-xs px-1">
                    {priceImpact > 0 ? (
                      <TrendingUp className="h-2 w-2 mr-1" />
                    ) : (
                      <TrendingDown className="h-2 w-2 mr-1" />
                    )}
                    {Math.abs(priceImpact).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Rate Change Display */}
            <div className="text-xs text-muted-foreground text-center pt-1 border-t">
              {showInverse ? (
                <>New rate: {formatTokenAmount(1 / newPrice)} {agentSymbol} per PROMPT</>
              ) : (
                <>New rate: {formatPrice(newPrice)} PROMPT per {agentSymbol}</>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}