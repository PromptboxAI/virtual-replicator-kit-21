// USD Conversion Infrastructure - Phase 1
export const PROMPT_USD_RATE = 0.10; // Default: 1 PROMPT = $0.10

export const formatPriceUSD = (priceInPrompt: number): string => {
  const usdPrice = priceInPrompt * PROMPT_USD_RATE;

  if (usdPrice === 0) return '$0.00';

  // V4 pricing: handle very small numbers (0.0000004 to 0.000075 USD range)
  if (usdPrice < 0.000001) {
    // For ultra-small prices, show 8-10 decimals
    const decimals = Math.max(10, -Math.floor(Math.log10(usdPrice)) + 2);
    return `$${usdPrice.toFixed(decimals).replace(/\.?0+$/, '')}`;
  }

  if (usdPrice < 0.0001) {
    // V4 range: show 6-8 decimals
    return `$${usdPrice.toFixed(8).replace(/\.?0+$/, '')}`;
  }

  if (usdPrice < 0.01) {
    return `$${usdPrice.toFixed(6).replace(/\.?0+$/, '')}`;
  }

  if (usdPrice < 1) {
    return `$${usdPrice.toFixed(4)}`;
  }

  return `$${usdPrice.toFixed(2)}`;
};

/**
 * Format market cap value for display
 * @param marketCapUSD - Market cap already in USD (no conversion needed)
 * @returns Formatted string with $ and appropriate suffix (B/M/k)
 */
export const formatMarketCapUSD = (marketCapUSD: number): string => {
  // Value is already in USD from useAgentFDV - just format it
  if (marketCapUSD >= 1_000_000_000) return `$${(marketCapUSD / 1_000_000_000).toFixed(2)}B`;
  if (marketCapUSD >= 1_000_000) return `$${(marketCapUSD / 1_000_000).toFixed(2)}M`;
  if (marketCapUSD >= 1_000) return `$${(marketCapUSD / 1_000).toFixed(2)}k`;
  return `$${marketCapUSD.toFixed(2)}`;
};

export const formatTokenAmount = (amount: number): string => {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
  return amount.toFixed(2);
};

export const formatPromptAmount = (amount: number): string => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

// Format chart Y-axis values for small V4 prices
export const formatChartPrice = (price: number): string => {
  if (price === 0) return '0';
  
  // V4 pricing range handling
  if (price < 0.000001) {
    return price.toExponential(1);
  }
  
  if (price < 0.0001) {
    // Show significant digits for V4 range
    return price.toFixed(8).replace(/\.?0+$/, '');
  }
  
  if (price < 0.01) {
    return price.toFixed(6).replace(/\.?0+$/, '');
  }
  
  if (price < 1) {
    return price.toFixed(4);
  }
  
  if (price < 1000) {
    return price.toFixed(2);
  }
  
  return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
};