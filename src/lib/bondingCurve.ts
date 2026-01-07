/**
 * Linear Bonding Curve Mathematical Functions
 * Based on virtuals.io linear pricing model
 */

// Linear bonding curve constants
export const BONDING_CURVE_CONFIG = {
  // Agent creation cost
  AGENT_CREATION_COST: 100, // 100 PROMPT to create agent
  
  // Linear curve model - 800M/200M split
  CURVE_SUPPLY: 800_000_000, // 800M tokens available on bonding curve
  LP_RESERVE: 200_000_000,   // 200M tokens reserved for LP creation
  TOTAL_SUPPLY: 1_000_000_000, // 1B tokens total supply
  
  // Linear pricing parameters
  P0: 0.000001, // Starting price (PROMPT per token)
  P1: 0.000104, // Ending price at graduation (PROMPT per token)
  
  // Graduation threshold
  GRADUATION_PROMPT_AMOUNT: 42160, // 42,160 PROMPT to graduate (V7)
  
  // Trading fees (virtuals.io: 1% total split 70%/30%)
  TRADING_FEE_PERCENTAGE: 0.01, // 1% total trading fee
  AGENT_REVENUE_PERCENTAGE: 0.007, // 70% of 1% = 0.7% goes to agent
  PLATFORM_REVENUE_PERCENTAGE: 0.003, // 30% of 1% = 0.3% goes to platform
  
  // Liquidity lock
  LIQUIDITY_LOCK_YEARS: 10, // 10 year liquidity lock
} as const;

// Derived constants
const PRICE_SLOPE = (BONDING_CURVE_CONFIG.P1 - BONDING_CURVE_CONFIG.P0) / BONDING_CURVE_CONFIG.CURVE_SUPPLY;

/**
 * Calculate linear price based on tokens sold
 * P(S) = P0 + slope * S
 */
export function getCurrentPrice(tokensSold: number): number {
  const { P0 } = BONDING_CURVE_CONFIG;
  return P0 + PRICE_SLOPE * tokensSold;
}

/**
 * Calculate tokens sold from prompt raised using inverse integral
 * Solving: ∫[0 to S] (P0 + slope*s) ds = promptRaised
 * Result: P0*S + slope*S²/2 = promptRaised
 * Quadratic: (slope/2)*S² + P0*S - promptRaised = 0
 */
export function tokensSoldFromPromptRaised(promptRaised: number): number {
  const { P0 } = BONDING_CURVE_CONFIG;
  const a = PRICE_SLOPE / 2;
  const b = P0;
  const c = -promptRaised;
  
  // Quadratic formula: S = (-b + √(b² - 4ac)) / 2a
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return 0;
  
  const tokensSold = (-b + Math.sqrt(discriminant)) / (2 * a);
  return Math.max(0, Math.min(tokensSold, BONDING_CURVE_CONFIG.CURVE_SUPPLY));
}

/**
 * Calculate prompt raised from tokens sold using integral
 * ∫[0 to S] (P0 + slope*s) ds = P0*S + slope*S²/2
 */
export function promptRaisedFromTokensSold(tokensSold: number): number {
  const { P0 } = BONDING_CURVE_CONFIG;
  const clampedSupply = Math.max(0, Math.min(tokensSold, BONDING_CURVE_CONFIG.CURVE_SUPPLY));
  return P0 * clampedSupply + PRICE_SLOPE * clampedSupply * clampedSupply / 2;
}

/**
 * Get price directly from prompt raised
 */
export function getPriceFromPromptRaised(promptRaised: number): number {
  return getCurrentPrice(tokensSoldFromPromptRaised(promptRaised));
}

/**
 * Simulate buy impact
 */
export function simulateBuyImpact(currentPromptRaised: number, promptAmount: number): {
  newPrice: number;
  newTokensSold: number;
} {
  const newPromptRaised = currentPromptRaised + promptAmount;
  const newTokensSold = tokensSoldFromPromptRaised(newPromptRaised);
  const newPrice = getCurrentPrice(newTokensSold);
  
  return { newPrice, newTokensSold };
}

/**
 * Simulate sell impact
 */
export function simulateSellImpact(currentPromptRaised: number, tokenAmount: number): {
  newPrice: number;
  newTokensSold: number;
} {
  const currentTokensSold = tokensSoldFromPromptRaised(currentPromptRaised);
  const newTokensSold = Math.max(0, currentTokensSold - tokenAmount);
  const newPromptRaised = promptRaisedFromTokensSold(newTokensSold);
  const newPrice = getCurrentPrice(newTokensSold);
  
  return { newPrice, newTokensSold };
}

/**
 * Calculate the cost to buy a specific amount of tokens
 * Uses linear integral: ∫[S1 to S2] (P0 + slope*s) ds
 */
export function calculateBuyCost(currentTokensSold: number, tokenAmount: number): {
  cost: number;
  averagePrice: number;
  newTokensSold: number;
  priceImpact: number;
} {
  const { P0, CURVE_SUPPLY } = BONDING_CURVE_CONFIG;
  
  // Ensure we don't exceed curve supply
  const maxPurchasable = CURVE_SUPPLY - currentTokensSold;
  const actualTokenAmount = Math.min(tokenAmount, maxPurchasable);
  
  if (actualTokenAmount <= 0) {
    return { cost: 0, averagePrice: 0, newTokensSold: currentTokensSold, priceImpact: 0 };
  }
  
  const newTokensSold = currentTokensSold + actualTokenAmount;
  
  // Calculate cost using integral: ∫[S1 to S2] (P0 + slope*s) ds
  // = P0*(S2-S1) + slope*(S2²-S1²)/2
  const cost = P0 * actualTokenAmount + 
    PRICE_SLOPE * (newTokensSold * newTokensSold - currentTokensSold * currentTokensSold) / 2;
  
  const averagePrice = cost / actualTokenAmount;
  
  // Price impact calculation
  const currentPrice = getCurrentPrice(currentTokensSold);
  const newPrice = getCurrentPrice(newTokensSold);
  const priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;
  
  return {
    cost,
    averagePrice,
    newTokensSold,
    priceImpact
  };
}

/**
 * Calculate the return from selling a specific amount of tokens
 */
export function calculateSellReturn(currentTokensSold: number, tokenAmount: number): {
  return: number;
  averagePrice: number;
  newTokensSold: number;
  priceImpact: number;
} {
  const { P0 } = BONDING_CURVE_CONFIG;
  
  // Ensure we don't sell more than available
  const actualTokenAmount = Math.min(tokenAmount, currentTokensSold);
  
  if (actualTokenAmount <= 0) {
    return { return: 0, averagePrice: 0, newTokensSold: currentTokensSold, priceImpact: 0 };
  }
  
  const newTokensSold = currentTokensSold - actualTokenAmount;
  
  // Calculate return using integral: ∫[S2 to S1] (P0 + slope*s) ds
  // = P0*(S1-S2) + slope*(S1²-S2²)/2
  const returnAmount = P0 * actualTokenAmount + 
    PRICE_SLOPE * (currentTokensSold * currentTokensSold - newTokensSold * newTokensSold) / 2;
  
  const averagePrice = returnAmount / actualTokenAmount;
  
  // Price impact calculation
  const currentPrice = getCurrentPrice(currentTokensSold);
  const newPrice = getCurrentPrice(newTokensSold);
  const priceImpact = ((currentPrice - newPrice) / currentPrice) * 100;
  
  return {
    return: returnAmount,
    averagePrice,
    newTokensSold,
    priceImpact
  };
}

/**
 * Calculate the amount of tokens that can be bought with a specific PROMPT amount
 */
export function calculateTokensFromPrompt(currentTokensSold: number, promptAmount: number): {
  tokenAmount: number;
  remainingPrompt: number;
  newTokensSold: number;
} {
  const { P0, CURVE_SUPPLY } = BONDING_CURVE_CONFIG;
  const maxPurchasable = CURVE_SUPPLY - currentTokensSold;
  
  if (maxPurchasable <= 0 || promptAmount <= 0) {
    return { tokenAmount: 0, remainingPrompt: promptAmount, newTokensSold: currentTokensSold };
  }
  
  // Solve quadratic equation to find how many tokens can be bought
  // (slope/2)*S² + P0*S - promptAmount = 0
  // where S is the token amount to buy
  const a = PRICE_SLOPE / 2;
  const b = P0 + PRICE_SLOPE * currentTokensSold;
  const c = -promptAmount;
  
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return { tokenAmount: 0, remainingPrompt: promptAmount, newTokensSold: currentTokensSold };
  }
  
  const tokenAmount = Math.floor((-b + Math.sqrt(discriminant)) / (2 * a));
  const clampedTokenAmount = Math.min(tokenAmount, maxPurchasable);
  
  // Calculate actual cost for the clamped amount
  const actualCost = calculateBuyCost(currentTokensSold, clampedTokenAmount).cost;
  const remainingPrompt = Math.max(0, promptAmount - actualCost);
  
  return {
    tokenAmount: clampedTokenAmount,
    remainingPrompt,
    newTokensSold: currentTokensSold + clampedTokenAmount
  };
}

/**
 * Calculate fees for a transaction
 */
export function calculateFees(amount: number, transactionType: 'buy' | 'sell'): {
  totalFees: number;
  agentRevenue: number;
  platformRevenue: number;
  netAmount: number;
} {
  const { AGENT_REVENUE_PERCENTAGE, PLATFORM_REVENUE_PERCENTAGE } = BONDING_CURVE_CONFIG;
  
  const agentRevenue = amount * AGENT_REVENUE_PERCENTAGE; // 0.7%
  const platformRevenue = amount * PLATFORM_REVENUE_PERCENTAGE; // 0.3%
  const totalFees = agentRevenue + platformRevenue; // 1%
  
  const netAmount = transactionType === 'buy' 
    ? amount + totalFees  // Add fees to buy cost
    : amount - totalFees; // Subtract fees from sell return
  
  return {
    totalFees,
    agentRevenue,
    platformRevenue,
    netAmount
  };
}

/**
 * Calculate market cap based on current price and total supply
 */
export function calculateMarketCap(tokensSold: number): number {
  const { TOTAL_SUPPLY } = BONDING_CURVE_CONFIG;
  const currentPrice = getCurrentPrice(tokensSold);
  return TOTAL_SUPPLY * currentPrice;
}

/**
 * Calculate graduation progress
 */
export function calculateGraduationProgress(currentPromptRaised: number): {
  progress: number;
  remaining: number;
  isGraduated: boolean;
} {
  const { GRADUATION_PROMPT_AMOUNT } = BONDING_CURVE_CONFIG;
  const progress = Math.min((currentPromptRaised / GRADUATION_PROMPT_AMOUNT) * 100, 100);
  const remaining = Math.max(GRADUATION_PROMPT_AMOUNT - currentPromptRaised, 0);
  const isGraduated = currentPromptRaised >= GRADUATION_PROMPT_AMOUNT;
  
  return {
    progress,
    remaining,
    isGraduated
  };
}

/**
 * Live graduation check
 */
export function isAgentGraduated(promptRaised: number): boolean {
  const { GRADUATION_PROMPT_AMOUNT } = BONDING_CURVE_CONFIG;
  return promptRaised >= GRADUATION_PROMPT_AMOUNT;
}

/**
 * Check if bonding curve is complete
 */
export function isBondingCurveComplete(promptRaised: number): boolean {
  const { GRADUATION_PROMPT_AMOUNT } = BONDING_CURVE_CONFIG;
  return promptRaised >= GRADUATION_PROMPT_AMOUNT;
}

/**
 * Migration state detection
 */
export function isAgentMigrating(promptRaised: number, tokenAddress?: string | null): boolean {
  const isGraduated = isAgentGraduated(promptRaised);
  const isTokenDeployed = Boolean(tokenAddress);
  return isGraduated && !isTokenDeployed;
}

/**
 * Calculate LP creation parameters
 * Uses 70% of raised PROMPT and 200M reserved tokens
 */
export function calculateLPCreation(finalPromptRaised: number): {
  lpPromptAmount: number;
  lpTokenAmount: number;
} {
  const { LP_RESERVE } = BONDING_CURVE_CONFIG;
  
  // 70% of raised PROMPT goes to LP (30% is platform fee)
  const lpPromptAmount = finalPromptRaised * 0.7;
  const lpTokenAmount = LP_RESERVE; // 200M reserved tokens
  
  return {
    lpPromptAmount,
    lpTokenAmount
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

export function formatPromptAmount(amount: number): string {
  return `${amount.toFixed(3)} PROMPT`;
}

// Legacy compatibility - maintain old function names
export const getInvariant = () => 0; // Not used in linear model
export const getCurrentReserves = (tokensSold: number) => ({ 
  promptReserve: 0, 
  tokenReserve: 0 
}); // Not used in linear model