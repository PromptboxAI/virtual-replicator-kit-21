import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, BarChart3, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Units } from '@/lib/units';
import { formatPriceChange } from '@/lib/priceFormatting';

interface TradingMetricsBarProps {
  fdv: string;
  fxRate: string;
  volume24h?: number;
  priceChange24h?: number;
  holders?: number;
  liquidity?: number;
  className?: string;
}

/**
 * Unified Trading Metrics Display Bar
 * Shows key metrics in a consistent format
 */
export function TradingMetricsBar({
  fdv,
  fxRate,
  volume24h,
  priceChange24h,
  holders,
  liquidity,
  className
}: TradingMetricsBarProps) {
  const fdvUSD = Units.toDisplay(fdv, fxRate, 'USD');
  const priceChange = priceChange24h ? formatPriceChange(priceChange24h) : null;

  return (
    <Card className={cn("p-4", className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* FDV */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            FDV
          </div>
          <div className="font-semibold">
            {Units.formatCap(fdvUSD, 'USD')}
          </div>
          <div className="text-xs text-muted-foreground">
            {Units.formatCap(fdv, 'PROMPT')}
          </div>
        </div>

        {/* 24h Volume */}
        {volume24h !== undefined && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              24h Volume
            </div>
            <div className="font-semibold">
              {Units.formatCap(volume24h.toString(), 'USD')}
            </div>
          </div>
        )}

        {/* 24h Change */}
        {priceChange && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">24h Change</div>
            <div className={cn(
              "font-semibold flex items-center gap-1",
              priceChange.isPositive && "text-success",
              !priceChange.isPositive && !priceChange.isNeutral && "text-destructive"
            )}>
              {priceChange.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : !priceChange.isNeutral ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              {priceChange.formatted}
            </div>
          </div>
        )}

        {/* Holders */}
        {holders !== undefined && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Holders
            </div>
            <div className="font-semibold">
              {holders.toLocaleString()}
            </div>
          </div>
        )}

        {/* Liquidity */}
        {liquidity !== undefined && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              Liquidity
            </div>
            <div className="font-semibold">
              ${liquidity.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
