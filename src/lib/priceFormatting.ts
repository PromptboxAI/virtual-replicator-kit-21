import Big from 'big.js';

/**
 * Centralized price formatting utilities
 * Ensures consistent formatting across all price displays
 */

export interface PriceFormat {
  raw: string;
  formatted: string;
  decimals: number;
}

/**
 * Format price in PROMPT with appropriate decimals
 */
export function formatPromptPrice(priceStr: string): PriceFormat {
  const price = Big(priceStr);
  
  // Determine decimal places based on magnitude
  let decimals: number;
  if (price.gte(1)) {
    decimals = 2;
  } else if (price.gte(0.01)) {
    decimals = 4;
  } else if (price.gte(0.0001)) {
    decimals = 6;
  } else {
    decimals = 8;
  }

  return {
    raw: priceStr,
    formatted: `${price.toFixed(decimals)} PROMPT`,
    decimals
  };
}

/**
 * Format price in USD with appropriate decimals
 */
export function formatUSDPrice(usdStr: string): PriceFormat {
  const price = Big(usdStr);
  
  // Determine decimal places based on magnitude
  let decimals: number;
  if (price.gte(1)) {
    decimals = 2;
  } else if (price.gte(0.01)) {
    decimals = 4;
  } else if (price.gte(0.0001)) {
    decimals = 6;
  } else if (price.gte(0.000001)) {
    decimals = 8;
  } else {
    decimals = 10;
  }

  return {
    raw: usdStr,
    formatted: `$${price.toFixed(decimals)}`,
    decimals
  };
}

/**
 * Convert PROMPT price to USD using FX rate
 */
export function convertPromptToUSD(promptStr: string, fxStr: string): string {
  return Big(promptStr).times(fxStr).toString();
}

/**
 * Convert USD price to PROMPT using FX rate
 */
export function convertUSDToPrompt(usdStr: string, fxStr: string): string {
  return Big(usdStr).div(fxStr).toString();
}

/**
 * Format market cap with K/M/B suffixes
 */
export function formatMarketCap(valueStr: string, currency: 'USD' | 'PROMPT'): string {
  const value = Big(valueStr);
  const prefix = currency === 'USD' ? '$' : '';
  const suffix = currency === 'PROMPT' ? ' PROMPT' : '';

  if (value.gte(1_000_000_000)) {
    return `${prefix}${value.div(1_000_000_000).toFixed(2)}B${suffix}`;
  }
  if (value.gte(1_000_000)) {
    return `${prefix}${value.div(1_000_000).toFixed(2)}M${suffix}`;
  }
  if (value.gte(1_000)) {
    return `${prefix}${value.div(1_000).toFixed(2)}K${suffix}`;
  }
  return `${prefix}${value.toFixed(2)}${suffix}`;
}

/**
 * Format volume with appropriate suffixes
 */
export function formatVolume(valueStr: string): string {
  return formatMarketCap(valueStr, 'USD');
}

/**
 * Format price change percentage
 */
export function formatPriceChange(changePercent: number): {
  formatted: string;
  isPositive: boolean;
  isNeutral: boolean;
} {
  const isPositive = changePercent > 0;
  const isNeutral = changePercent === 0;
  const sign = isPositive ? '+' : '';
  
  return {
    formatted: `${sign}${changePercent.toFixed(2)}%`,
    isPositive,
    isNeutral
  };
}
