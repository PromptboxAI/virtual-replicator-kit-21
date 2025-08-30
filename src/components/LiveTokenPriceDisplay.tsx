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
import { cn } from '@/lib/utils';

interface LiveTokenPriceDisplayProps {
  agentSymbol: string;
  promptRaised: number;
  tradeAmount?: number;
  tradeType?: 'buy' | 'sell';
  className?: string;
}

export function LiveTokenPriceDisplay({ 
  agentSymbol, 
  promptRaised, 
  tradeAmount, 
  tradeType = 'buy',
  className 
}: LiveTokenPriceDisplayProps) {
  const [showInverse, setShowInverse] = useState(false);
  
  // Calculate current metrics using V3 functions
  const tokensSold = tokensSoldFromPromptRaisedV3(promptRaised);
  const currentPrice = getCurrentPriceV3(tokensSold);
  const graduationInfo = calculateGraduationProgressV3(promptRaised);
  
  // Calculate trade impact if provided
  let newPrice = currentPrice;
  let priceImpact = 0;
  let isHighImpact = false;
  let slippage = 0;
  
  if (tradeAmount && tradeAmount > 0) {
    if (tradeType === 'buy') {
      const impact = calculateBuyCostV3(tokensSold, tradeAmount);
      newPrice = getCurrentPriceV3(impact.newTokensSold);
      priceImpact = impact.priceImpact;
      isHighImpact = impact.isHighImpact;
      slippage = impact.slippage;
    } else {
      const impact = calculateSellReturnV3(tokensSold, tradeAmount);
      newPrice = getCurrentPriceV3(impact.newTokensSold);
      priceImpact = impact.priceImpact;
      isHighImpact = impact.isHighImpact;
      slippage = impact.slippage;
    }
  }
  
  // Use V3 formatters from library
  
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
        
        {/* Price Display */}
        <div className="space-y-2">
          {showInverse ? (
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatTokenAmountV3(inverseRate)}
              </div>
              <div className="text-sm text-muted-foreground">
                {agentSymbol} per 1 PROMPT
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatPriceV3(forwardRate)}
              </div>
              <div className="text-sm text-muted-foreground">
                PROMPT per 1 {agentSymbol}
              </div>
            </div>
          )}
          
          {/* Alternative rate display */}
          <div className="text-center text-xs text-muted-foreground">
            {showInverse ? (
              <>1 {agentSymbol} = {formatPriceV3(forwardRate)} PROMPT</>
            ) : (
              <>1 PROMPT = {formatTokenAmountV3(inverseRate)} {agentSymbol}</>
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
        {tradeAmount && (isHighImpact || Math.abs(priceImpact) > BONDING_CURVE_V3_CONFIG.HIGH_SLIPPAGE_THRESHOLD) && (
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
              <span>{formatPriceV3(currentPrice)} PROMPT</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Price After Trade</span>
              <div className="flex items-center gap-1">
                <span>{formatPriceV3(newPrice)} PROMPT</span>
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
                <>New rate: {formatTokenAmountV3(1 / newPrice)} {agentSymbol} per PROMPT</>
              ) : (
                <>New rate: {formatPriceV3(newPrice)} PROMPT per {agentSymbol}</>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}