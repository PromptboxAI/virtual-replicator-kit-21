import Big from "big.js";

export type Unit = 'USD' | 'PROMPT';

export const Units = {
  /**
   * Convert PROMPT price to display unit (USD or PROMPT)
   */
  toDisplay(pricePromptStr: string, fxStr: string, unit: Unit): string {
    const p = Big(pricePromptStr);
    return unit === 'USD' ? p.times(fxStr).toString() : p.toString();
  },

  /**
   * Calculate market cap (price × supply)
   */
  marketCap(pricePromptStr: string, supplyStr: string, fxStr: string, unit: Unit): string {
    const mcPrompt = Big(pricePromptStr).times(supplyStr);
    return unit === 'USD' ? mcPrompt.times(fxStr).toString() : mcPrompt.toString();
  },

  /**
   * Format price with correct decimals
   */
  formatPrice(numStr: string, unit: Unit): string {
    const n = Big(numStr);
    if (unit === 'USD') {
      return n.gte(0.01) 
        ? `$${n.toFixed(2)}` 
        : `$${n.toFixed(n.lt(1e-6) ? 10 : 6)}`;
    }
    return n.lt(0.0001) 
      ? `${n.toFixed(8)} PROMPT` 
      : `${n.toFixed(4)} PROMPT`;
  },

  /**
   * Format market cap/FDV with K/M suffixes
   */
  formatCap(numStr: string, unit: Unit): string {
    const n = Big(numStr);
    if (unit === 'USD') {
      if (n.gte(1_000_000)) return `$${n.div(1_000_000).toFixed(2)}M`;
      if (n.gte(1_000)) return `$${n.div(1_000).toFixed(2)}K`;
      return `$${n.toFixed(2)}`;
    }
    if (n.gte(1_000_000)) return `${n.div(1_000_000).toFixed(2)}M PROMPT`;
    if (n.gte(1_000)) return `${n.div(1_000).toFixed(2)}K PROMPT`;
    return `${n.toFixed(2)} PROMPT`;
  },

  /**
   * ✅ FIX: Format dual-unit tooltip (no double $)
   */
  formatTooltip(promptValue: string, fx: string): string {
    const usdValue = Units.toDisplay(promptValue, fx, 'USD');
    return `${Units.formatPrice(usdValue, 'USD')} (${Units.formatPrice(promptValue, 'PROMPT')})`;
  }
};
