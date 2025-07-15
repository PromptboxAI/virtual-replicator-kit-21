/**
 * Bonding Curve Mathematical Functions
 * Based on pump.fun's constant product AMM model (x * y = k)
 */

// Constants for bonding curve parameters (based on pump.fun model)
export const BONDING_CURVE_CONFIG = {
  // Constant Product AMM model (x * y = k)
  VIRTUAL_PROMPT_RESERVE: 30, // Virtual PROMPT reserve (like 30 SOL in pump.fun)
  VIRTUAL_TOKEN_RESERVE: 1073000000, // Virtual token reserve (~1.073B tokens)
  TOTAL_SUPPLY: 1000000000, // 1B tokens total supply
  CURVE_SUPPLY: 800000000, // 80% (800M) sold through bonding curve  
  LP_SUPPLY: 200000000, // 20% (200M) reserved for liquidity pool
  
  // Graduation thresholds (inspired by pump.fun's 85 SOL / $69k model)
  GRADUATION_PROMPT_AMOUNT: 85, // PROMPT needed to graduate
  GRADUATION_MARKET_CAP_USD: 69000, // $69k market cap graduation
  
  // Platform economics
  PLATFORM_FEE_PROMPT: 6, // Platform fee in PROMPT (like pump.fun's 6 SOL)
  CREATOR_REWARD_PROMPT: 0.5, // Creator reward for successful graduation
  
  // Trading fees (lower than our original 2%, matching virtuals.io 1%)
  TRADING_FEE_PERCENTAGE: 0.01, // 1% trading fee
  CREATOR_FEE_PERCENTAGE: 0.005, // 0.5% to creator
  PLATFORM_FEE_PERCENTAGE: 0.005, // 0.5% to platform
} as const;

/**
 * Calculate the invariant k = x * y for the bonding curve
 */
export function getInvariant(): number {
  const { VIRTUAL_PROMPT_RESERVE, VIRTUAL_TOKEN_RESERVE } = BONDING_CURVE_CONFIG;
  return VIRTUAL_PROMPT_RESERVE * VIRTUAL_TOKEN_RESERVE;
}

/**
 * Calculate current PROMPT and token reserves based on tokens sold
 */
export function getCurrentReserves(tokensSold: number): {
  promptReserve: number;
  tokenReserve: number;
} {
  const { VIRTUAL_PROMPT_RESERVE, VIRTUAL_TOKEN_RESERVE } = BONDING_CURVE_CONFIG;
  const k = getInvariant();
  
  // As tokens are sold, token reserve decreases
  const tokenReserve = VIRTUAL_TOKEN_RESERVE - tokensSold;
  // PROMPT reserve increases to maintain k constant
  const promptReserve = k / tokenReserve;
  
  return { promptReserve, tokenReserve };
}

/**
 * Calculate the current price of a token based on current reserves
 * Price = PROMPT reserve / Token reserve
 */
export function getCurrentPrice(tokensSold: number): number {
  const { promptReserve, tokenReserve } = getCurrentReserves(tokensSold);
  return promptReserve / tokenReserve;
}

/**
 * Calculate the cost to buy a specific amount of tokens
 * Uses constant product formula: k = x * y
 */
export function calculateBuyCost(currentTokensSold: number, tokenAmount: number): {
  cost: number;
  averagePrice: number;
  newTokensSold: number;
  priceImpact: number;
} {
  const k = getInvariant();
  const { promptReserve: currentPromptReserve, tokenReserve: currentTokenReserve } = getCurrentReserves(currentTokensSold);
  
  // After buying tokens, token reserve decreases
  const newTokenReserve = currentTokenReserve - tokenAmount;
  // New PROMPT reserve to maintain k constant
  const newPromptReserve = k / newTokenReserve;
  
  // Cost is the difference in PROMPT reserves
  const cost = newPromptReserve - currentPromptReserve;
  const averagePrice = cost / tokenAmount;
  const newTokensSold = currentTokensSold + tokenAmount;
  
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
  const k = getInvariant();
  const { promptReserve: currentPromptReserve, tokenReserve: currentTokenReserve } = getCurrentReserves(currentTokensSold);
  
  // After selling tokens, token reserve increases
  const newTokenReserve = currentTokenReserve + tokenAmount;
  // New PROMPT reserve to maintain k constant
  const newPromptReserve = k / newTokenReserve;
  
  // Return is the difference in PROMPT reserves
  const returnAmount = currentPromptReserve - newPromptReserve;
  const averagePrice = returnAmount / tokenAmount;
  const newTokensSold = Math.max(0, currentTokensSold - tokenAmount);
  
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
 * Calculate market cap based on current price and total supply
 */
export function calculateMarketCap(tokensSold: number): number {
  const { TOTAL_SUPPLY } = BONDING_CURVE_CONFIG;
  const currentPrice = getCurrentPrice(tokensSold);
  return TOTAL_SUPPLY * currentPrice;
}

/**
 * Calculate how much PROMPT is needed for graduation
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
 * Calculate the amount of tokens that can be bought with a specific PROMPT amount
 * Solves the constant product equation for token amount
 */
export function calculateTokensFromPrompt(currentTokensSold: number, promptAmount: number): {
  tokenAmount: number;
  remainingPrompt: number;
  newTokensSold: number;
} {
  const k = getInvariant();
  const { promptReserve: currentPromptReserve, tokenReserve: currentTokenReserve } = getCurrentReserves(currentTokensSold);
  
  // New PROMPT reserve after adding promptAmount
  const newPromptReserve = currentPromptReserve + promptAmount;
  // New token reserve to maintain k constant
  const newTokenReserve = k / newPromptReserve;
  
  // Tokens that can be bought
  const tokenAmount = Math.floor(currentTokenReserve - newTokenReserve);
  
  // Calculate actual cost for this amount of tokens
  const actualCost = calculateBuyCost(currentTokensSold, tokenAmount).cost;
  const remainingPrompt = Math.max(0, promptAmount - actualCost);
  
  return {
    tokenAmount,
    remainingPrompt,
    newTokensSold: currentTokensSold + tokenAmount
  };
}

/**
 * Check if the bonding curve is complete (ready for graduation)
 */
export function isBondingCurveComplete(tokensSold: number, promptRaised: number): boolean {
  const { CURVE_SUPPLY, GRADUATION_PROMPT_AMOUNT } = BONDING_CURVE_CONFIG;
  return tokensSold >= CURVE_SUPPLY || promptRaised >= GRADUATION_PROMPT_AMOUNT;
}

/**
 * Calculate the initial LP creation parameters
 */
export function calculateLPCreation(finalPromptRaised: number): {
  lpPromptAmount: number;
  lpTokenAmount: number;
  platformFee: number;
  creatorReward: number;
} {
  const { LP_SUPPLY, PLATFORM_FEE_PROMPT, CREATOR_REWARD_PROMPT } = BONDING_CURVE_CONFIG;
  
  const platformFee = PLATFORM_FEE_PROMPT;
  const creatorReward = CREATOR_REWARD_PROMPT;
  const lpPromptAmount = finalPromptRaised - platformFee; // Platform keeps fee
  const lpTokenAmount = LP_SUPPLY;
  
  return {
    lpPromptAmount,
    lpTokenAmount,
    platformFee,
    creatorReward
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