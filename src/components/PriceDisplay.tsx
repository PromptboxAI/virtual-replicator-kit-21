import { useAgentPrice } from "@/hooks/useAgentPrice";
import { formatPriceUSD } from "@/lib/formatters";
import { useAgentMetrics } from "@/hooks/useAgentMetrics";
import Big from "big.js";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  agentId: string;
  variant?: 'usd-primary' | 'prompt-primary' | 'both-equal' | 'chart' | 'compact';
  className?: string;
  showBoth?: boolean;
  loading?: boolean;
}

/**
 * Unified Price Display Component - Phase 4
 * Single source of truth for all price displays across the platform
 * 
 * Features:
 * - Handles V3/V4 pricing automatically via useAgentPrice
 * - USD/PROMPT conversion with current rate
 * - Multiple display variants for different contexts
 * - Proper formatting for tiny V4 values
 * 
 * Usage:
 * <PriceDisplay agentId={agent.id} variant="usd-primary" showBoth />
 */
export function PriceDisplay({
  agentId,
  variant = 'usd-primary',
  className,
  showBoth = true,
  loading = false
}: PriceDisplayProps) {
  const priceInPrompt = useAgentPrice(agentId);
  const { metrics } = useAgentMetrics(agentId);
  const fxRate = metrics ? Big(metrics.price.fx) : Big(0.10);
  const priceInUSD = Big(priceInPrompt).times(fxRate).toNumber();

  if (loading || priceInPrompt === 0) {
    return <Skeleton className={cn("h-6 w-24", className)} />;
  }

  // Format prices based on variant
  const formattedUSD = formatPriceUSD(priceInPrompt, fxRate.toNumber());
  const formattedPROMPT = priceInPrompt.toFixed(8).replace(/\.?0+$/, '');

  switch (variant) {
    case 'usd-primary':
      return (
        <div className={cn("flex flex-col", className)}>
          <span className="text-2xl font-bold">{formattedUSD}</span>
          {showBoth && (
            <span className="text-sm text-muted-foreground">
              {formattedPROMPT} PROMPT
            </span>
          )}
        </div>
      );

    case 'prompt-primary':
      return (
        <div className={cn("flex flex-col", className)}>
          <span className="text-2xl font-bold">{formattedPROMPT} PROMPT</span>
          {showBoth && (
            <span className="text-sm text-muted-foreground">{formattedUSD}</span>
          )}
        </div>
      );

    case 'both-equal':
      return (
        <div className={cn("flex items-baseline gap-2", className)}>
          <span className="text-xl font-bold">{formattedUSD}</span>
          <span className="text-lg text-muted-foreground">
            ({formattedPROMPT} PROMPT)
          </span>
        </div>
      );

    case 'chart':
      // Optimized for chart tooltips - compact format
      return (
        <div className={cn("text-sm", className)}>
          <div className="font-semibold">{formattedUSD}</div>
          {showBoth && (
            <div className="text-xs text-muted-foreground">
              {formattedPROMPT} PROMPT
            </div>
          )}
        </div>
      );

    case 'compact':
      // Single line, space-efficient
      return (
        <span className={cn("text-sm", className)}>
          {formattedUSD}
          {showBoth && (
            <span className="text-muted-foreground ml-1">
              ({formattedPROMPT} PROMPT)
            </span>
          )}
        </span>
      );

    default:
      return <span className={className}>{formattedUSD}</span>;
  }
}

/**
 * Price comparison widget - shows both USD and PROMPT side by side
 */
export function PriceComparison({
  agentId,
  className
}: {
  agentId: string;
  className?: string;
}): JSX.Element {
  const priceInPrompt = useAgentPrice(agentId);
  const { metrics } = useAgentMetrics(agentId);
  const fxRate = metrics ? Big(metrics.price.fx) : Big(0.10);
  const priceInUSD = Big(priceInPrompt).times(fxRate).toNumber();

  if (priceInPrompt === 0) {
    return <Skeleton className={cn("h-20 w-48", className)} />;
  }

  const formattedUSD = formatPriceUSD(priceInPrompt, fxRate.toNumber());
  const formattedPROMPT = priceInPrompt.toFixed(8).replace(/\.?0+$/, '');

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="flex flex-col items-center p-3 bg-accent/50 rounded-lg">
        <span className="text-xs text-muted-foreground mb-1">USD Price</span>
        <span className="text-lg font-bold">{formattedUSD}</span>
      </div>
      <div className="flex flex-col items-center p-3 bg-accent/50 rounded-lg">
        <span className="text-xs text-muted-foreground mb-1">PROMPT Price</span>
        <span className="text-lg font-bold">{formattedPROMPT}</span>
      </div>
    </div>
  );
}
