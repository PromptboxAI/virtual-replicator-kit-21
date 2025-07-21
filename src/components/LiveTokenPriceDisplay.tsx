import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { getCurrentPrice, calculateTokensFromPrompt, calculateSellReturn } from '@/lib/bondingCurve';
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
  
  // Calculate current price
  const tokensSold = promptRaised * 1000; // Convert PROMPT to estimated tokens sold
  const currentPrice = getCurrentPrice(tokensSold);
  
  // Calculate price impact if trade amount is provided
  let priceImpact = 0;
  let newPrice = currentPrice;
  
  if (tradeAmount && tradeAmount > 0) {
    if (tradeType === 'buy') {
      const result = calculateTokensFromPrompt(tokensSold, tradeAmount);
      newPrice = getCurrentPrice(result.newTokensSold);
      priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;
    } else {
      const result = calculateSellReturn(tokensSold, tradeAmount);
      newPrice = getCurrentPrice(result.newTokensSold);
      priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;
    }
  }
  
  // Format price displays
  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(4);
    if (price < 0.01) return price.toFixed(6);
    return price.toFixed(4);
  };
  
  const formatTokenAmount = (amount: number) => {
    if (amount < 1) return amount.toFixed(6);
    if (amount < 1000) return amount.toFixed(2);
    return amount.toLocaleString();
  };
  
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
                {formatTokenAmount(inverseRate)}
              </div>
              <div className="text-sm text-muted-foreground">
                {agentSymbol} per 1 PROMPT
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatPrice(forwardRate)}
              </div>
              <div className="text-sm text-muted-foreground">
                PROMPT per 1 {agentSymbol}
              </div>
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
        
        {/* Price Impact Display (if significant) */}
        {isPriceImpactSignificant && tradeAmount && (
          <div className={cn(
            "flex items-center justify-center gap-2 p-2 rounded-lg text-sm",
            Math.abs(priceImpact) > 5 
              ? "bg-destructive/10 text-destructive" 
              : "bg-yellow-50 text-yellow-700"
          )}>
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">
              Price Impact: {priceImpact > 0 ? '+' : ''}{priceImpact.toFixed(2)}%
            </span>
          </div>
        )}
        
        {/* Trade Impact Preview */}
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