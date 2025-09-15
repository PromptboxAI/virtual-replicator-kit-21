// USD Conversion Infrastructure - Phase 1
export const PROMPT_USD_RATE = 0.10; // Default: 1 PROMPT = $0.10

export const formatPriceUSD = (priceInPrompt: number): string => {
  const usdPrice = priceInPrompt * PROMPT_USD_RATE;

  if (usdPrice === 0) return '$0.00';

  // NEVER use scientific notation
  if (usdPrice < 0.00001) {
    const decimals = Math.max(8, -Math.floor(Math.log10(usdPrice)));
    return `$${usdPrice.toFixed(decimals).replace(/\.?0+$/, '')}`;
  }

  if (usdPrice < 0.01) {
    return `$${usdPrice.toFixed(6).replace(/\.?0+$/, '')}`;
  }

  if (usdPrice < 1) {
    return `$${usdPrice.toFixed(4)}`;
  }

  return `$${usdPrice.toFixed(2)}`;
};

export const formatMarketCapUSD = (marketCapInPrompt: number): string => {
  const usdValue = marketCapInPrompt * PROMPT_USD_RATE;

  if (usdValue >= 1_000_000_000) return `$${(usdValue / 1_000_000_000).toFixed(2)}B`;
  if (usdValue >= 1_000_000) return `$${(usdValue / 1_000_000).toFixed(2)}M`;
  if (usdValue >= 1_000) return `$${(usdValue / 1_000).toFixed(2)}k`;
  return `$${usdValue.toFixed(2)}`;
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