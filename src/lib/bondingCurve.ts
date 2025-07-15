/**
 * Bonding Curve Mathematical Functions
 * Pure functions for calculating token prices, amounts, and fees
 */

// Constants for bonding curve parameters
export const BONDING_CURVE_CONFIG = {
  // Linear bonding curve: price = basePrice + (slope * supply)
  BASE_PRICE: 0.0001, // Starting price in PROMPT tokens
  SLOPE: 0.000001, // Price increase per token minted
  MAX_SUPPLY: 1000000000, // 1B tokens maximum supply
  GRADUATION_THRESHOLD: 69000, // PROMPT needed to graduate (in tokens)
  
  // Fees
  BUY_FEE_PERCENTAGE: 0.02, // 2% fee on buys
  SELL_FEE_PERCENTAGE: 0.02, // 2% fee on sells
  CREATOR_FEE_PERCENTAGE: 0.01, // 1% to creator
  PLATFORM_FEE_PERCENTAGE: 0.01, // 1% to platform
} as const;

/**
 * Calculate the current price of a token based on its supply
 * Uses linear bonding curve: price = basePrice + (slope * supply)
 */
export function getCurrentPrice(currentSupply: number): number {
  const { BASE_PRICE, SLOPE } = BONDING_CURVE_CONFIG;
  return BASE_PRICE + (SLOPE * currentSupply);
}

/**
 * Calculate the cost to buy a specific amount of tokens
 * Integrates the bonding curve from current supply to new supply
 */
export function calculateBuyCost(currentSupply: number, tokenAmount: number): {
  cost: number;
  averagePrice: number;
  newSupply: number;
  priceImpact: number;
} {
  const { BASE_PRICE, SLOPE } = BONDING_CURVE_CONFIG;
  const newSupply = currentSupply + tokenAmount;
  
  // Linear integration: cost = basePrice * amount + slope * (s2^2 - s1^2) / 2
  const baseCost = BASE_PRICE * tokenAmount;
  const slopeCost = SLOPE * (Math.pow(newSupply, 2) - Math.pow(currentSupply, 2)) / 2;
  const cost = baseCost + slopeCost;
  
  const averagePrice = cost / tokenAmount;
  const currentPrice = getCurrentPrice(currentSupply);
  const newPrice = getCurrentPrice(newSupply);
  const priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;
  
  return {
    cost,
    averagePrice,
    newSupply,
    priceImpact
  };
}

/**
 * Calculate the return from selling a specific amount of tokens
 */
export function calculateSellReturn(currentSupply: number, tokenAmount: number): {
  return: number;
  averagePrice: number;
  newSupply: number;
  priceImpact: number;
} {
  const { BASE_PRICE, SLOPE } = BONDING_CURVE_CONFIG;
  const newSupply = Math.max(0, currentSupply - tokenAmount);
  
  // Linear integration for sell return
  const baseReturn = BASE_PRICE * tokenAmount;
  const slopeReturn = SLOPE * (Math.pow(currentSupply, 2) - Math.pow(newSupply, 2)) / 2;
  const returnAmount = baseReturn + slopeReturn;
  
  const averagePrice = returnAmount / tokenAmount;
  const currentPrice = getCurrentPrice(currentSupply);
  const newPrice = getCurrentPrice(newSupply);
  const priceImpact = ((currentPrice - newPrice) / currentPrice) * 100;
  
  return {
    return: returnAmount,
    averagePrice,
    newSupply,
    priceImpact
  };
}

/**
 * Calculate fees for a transaction
 */
export function calculateFees(amount: number, transactionType: 'buy' | 'sell'): {
  totalFees: number;
  creatorFee: number;
  platformFee: number;
  netAmount: number;
} {
  const { CREATOR_FEE_PERCENTAGE, PLATFORM_FEE_PERCENTAGE } = BONDING_CURVE_CONFIG;
  
  const creatorFee = amount * CREATOR_FEE_PERCENTAGE;
  const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
  const totalFees = creatorFee + platformFee;
  
  const netAmount = transactionType === 'buy' 
    ? amount + totalFees  // Add fees to buy cost
    : amount - totalFees; // Subtract fees from sell return
  
  return {
    totalFees,
    creatorFee,
    platformFee,
    netAmount
  };
}

/**
 * Calculate market cap based on current supply and price
 */
export function calculateMarketCap(currentSupply: number): number {
  const currentPrice = getCurrentPrice(currentSupply);
  return currentSupply * currentPrice;
}

/**
 * Calculate how much PROMPT is needed for graduation
 */
export function calculateGraduationProgress(currentPromptRaised: number): {
  progress: number;
  remaining: number;
  isGraduated: boolean;
} {
  const { GRADUATION_THRESHOLD } = BONDING_CURVE_CONFIG;
  const progress = Math.min((currentPromptRaised / GRADUATION_THRESHOLD) * 100, 100);
  const remaining = Math.max(GRADUATION_THRESHOLD - currentPromptRaised, 0);
  const isGraduated = currentPromptRaised >= GRADUATION_THRESHOLD;
  
  return {
    progress,
    remaining,
    isGraduated
  };
}

/**
 * Calculate the amount of tokens that can be bought with a specific PROMPT amount
 */
export function calculateTokensFromPrompt(currentSupply: number, promptAmount: number): {
  tokenAmount: number;
  remainingPrompt: number;
  newSupply: number;
} {
  const { BASE_PRICE, SLOPE } = BONDING_CURVE_CONFIG;
  
  // Quadratic formula to solve for token amount
  // promptAmount = basePrice * tokens + slope * (tokens^2 + 2*currentSupply*tokens) / 2
  // Rearranged: (slope/2) * tokens^2 + (basePrice + slope*currentSupply) * tokens - promptAmount = 0
  
  const a = SLOPE / 2;
  const b = BASE_PRICE + (SLOPE * currentSupply);
  const c = -promptAmount;
  
  const discriminant = Math.pow(b, 2) - (4 * a * c);
  
  if (discriminant < 0) {
    return { tokenAmount: 0, remainingPrompt: promptAmount, newSupply: currentSupply };
  }
  
  const tokenAmount = (-b + Math.sqrt(discriminant)) / (2 * a);
  const actualCost = calculateBuyCost(currentSupply, tokenAmount).cost;
  const remainingPrompt = Math.max(0, promptAmount - actualCost);
  
  return {
    tokenAmount: Math.floor(tokenAmount),
    remainingPrompt,
    newSupply: currentSupply + Math.floor(tokenAmount)
  };
}

/**
 * Format numbers for display
 */
export function formatTokenAmount(amount: number, decimals: number = 2): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(decimals)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(decimals)}K`;
  }
  return amount.toFixed(decimals);
}

export function formatPrice(price: number): string {
  if (price < 0.0001) {
    return price.toExponential(2);
  }
  return price.toFixed(6);
}