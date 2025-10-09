import { useAgentMetrics } from "@/hooks/useAgentMetrics";
import { Units } from "@/lib/units";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  agentId: string;
  variant?: 'usd-primary' | 'prompt-primary' | 'both-equal' | 'chart' | 'compact';
  className?: string;
  showBoth?: boolean;
  loading?: boolean;
  overridePrice?: number; // Override price in USD (e.g., from chart with historical FX)
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
  loading = false,
  overridePrice
}: PriceDisplayProps) {
  const { metrics } = useAgentMetrics(agentId);
  
  // Show skeleton until chart price arrives OR metrics load
  if (loading || !metrics?.price?.fx || (overridePrice === undefined && !metrics?.price?.prompt)) {
    return <Skeleton className={cn("h-8 w-32 rounded", className)} />;
  }

  // Use override price if provided (already in USD from chart)
  // Otherwise calculate from metrics
  let usdStr: string;
  let formattedPROMPT: string;
  
  if (overridePrice !== undefined) {
    // Chart provides USD price with historical FX - use it directly
    usdStr = String(overridePrice);
    // Calculate PROMPT equivalent using current FX for display only
    const inverseFx = 1 / parseFloat(metrics.price.fx);
    formattedPROMPT = Units.formatPrice(
      Units.toDisplay(usdStr, String(inverseFx), 'PROMPT'),
      'PROMPT'
    );
  } else {
    // No override - use metrics price and convert
    const promptPrice = metrics.price.prompt;
    if (!promptPrice) {
      return <div className={cn("h-5 w-24 animate-pulse rounded bg-muted", className)} data-testid="price-skeleton" />;
    }
    usdStr = Units.toDisplay(promptPrice, metrics.price.fx, 'USD');
    formattedPROMPT = Units.formatPrice(promptPrice, 'PROMPT');
  }
  
  const formattedUSD = Units.formatPrice(usdStr, 'USD');

  switch (variant) {
    case 'usd-primary':
      return (
        <div className={cn("flex flex-col", className)}>
          <span className="text-2xl font-bold">{formattedUSD}</span>
          {showBoth && (
            <span className="text-sm text-muted-foreground">
              {formattedPROMPT}
            </span>
          )}
        </div>
      );

    case 'prompt-primary':
      return (
        <div className={cn("flex flex-col", className)}>
          <span className="text-2xl font-bold">{formattedPROMPT}</span>
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
            ({formattedPROMPT})
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
              {formattedPROMPT}
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
              ({formattedPROMPT})
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
  const { metrics } = useAgentMetrics(agentId);

  // Show skeleton until FX arrives
  if (!metrics?.price?.fx || !metrics?.price?.prompt) {
    return <Skeleton className={cn("h-20 w-48", className)} />;
  }

  const usdStr = Units.toDisplay(metrics.price.prompt, metrics.price.fx, 'USD');
  const formattedUSD = Units.formatPrice(usdStr, 'USD');
  const formattedPROMPT = Units.formatPrice(metrics.price.prompt, 'PROMPT');

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
