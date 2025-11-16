import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLiquidityData } from '@/hooks/useLiquidityData';
import { Skeleton } from '@/components/ui/skeleton';
import { Droplets, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface LiquidityMetricsProps {
  agentId: string;
}

export function LiquidityMetrics({ agentId }: LiquidityMetricsProps) {
  const { data: liquidity, isLoading } = useLiquidityData(agentId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-4 w-4" />
            Liquidity Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!liquidity) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Droplets className="h-4 w-4" />
          Liquidity Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Liquidity</p>
          <p className="text-lg font-semibold">
            ${liquidity.total_liquidity_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">PROMPT Reserves</p>
            <p className="text-sm font-medium">
              {liquidity.total_prompt_reserves.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Token Reserves</p>
            <p className="text-sm font-medium">
              {liquidity.total_token_reserves.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Net Flow (24h)</p>
          <div className={`flex items-center gap-1 text-sm font-medium ${liquidity.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {liquidity.net_flow >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {liquidity.net_flow >= 0 ? '+' : ''}${Math.abs(liquidity.net_flow).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Price Impact</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">$1K trade:</span>
              <span className="font-medium">{liquidity.price_impact_1k_usd.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">$10K trade:</span>
              <span className="font-medium">{liquidity.price_impact_10k_usd.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {liquidity.depth_analysis && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Market Depth (5%)</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bid Depth:</span>
                <span className="font-medium">${liquidity.depth_analysis.bid_depth_5pct.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ask Depth:</span>
                <span className="font-medium">${liquidity.depth_analysis.ask_depth_5pct.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spread:</span>
                <span className="font-medium">{liquidity.depth_analysis.spread_bps} bps</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
