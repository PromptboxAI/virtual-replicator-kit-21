/**
 * Bonding Curve V6.1 - Virtuals.io-Style Database Mode
 * 
 * Key Features:
 * - Database mode pre-graduation (no gas fees)
 * - Variable LP allocation: LP = 880M - 1.05X
 * - Fixed 42K PROMPT to LP at graduation
 * - 5% holder rewards with 1-month linear vest
 * - 10% team allocation with cliff vesting (3mo/6mo)
 */

// ============ Constants ============
export const BONDING_CURVE_V6_1_CONSTANTS = {
  // Token Supply & Distribution
  TOTAL_SUPPLY: 1_000_000_000,
  VAULT_ALLOCATION: 20_000_000,        // 2%
  TEAM_ALLOCATION: 100_000_000,        // 10%
  VARIABLE_POOL: 880_000_000,          // 88%
  MIN_LP_TOKENS: 565_000_000,          // 56.5% (max trading)
  MAX_LP_TOKENS: 880_000_000,          // 88% (no trading)
  
  // Database Trading
  DATABASE_TRADEABLE_CAP: 300_000_000,
  
  // Graduation
  GRADUATION_THRESHOLD_PROMPT: 42_000,
  TARGET_FDV_AT_GRADUATION: 74_000,
  
  // Pricing
  DEFAULT_P0: 0.00004,
  DEFAULT_P1: 0.0001,
  
  // Fees (5% total)
  TRADING_FEE_BPS: 500,
  CREATOR_FEE_BPS: 4000,               // 40% of fee
  VAULT_FEE_BPS: 4000,                 // 40% of fee
  LP_TREASURY_FEE_BPS: 2000,           // 20% of fee
  
  // Creation
  CREATION_FEE: 100,
  
  // Vesting
  HOLDER_REWARD_VEST_DAYS: 30,         // 1 month
  TEAM_CLIFF_1_DAYS: 90,               // 3 months
  TEAM_CLIFF_2_DAYS: 180,              // 6 months
  
  // LP Locking
  LP_LOCK_YEARS: 3,
  LP_LOCK_BPS: 9500,                   // 95% locked
  LP_VAULT_BPS: 500,                   // 5% to vault
} as const;

// ============ Pricing Functions ============

/**
 * Calculate current price based on shares sold
 * Formula: price = p0 + (p1 - p0) * (shares_sold / cap)
 */
export function calculateCurrentPrice(sharesSold: number): number {
  const { DEFAULT_P0, DEFAULT_P1, DATABASE_TRADEABLE_CAP } = BONDING_CURVE_V6_1_CONSTANTS;
  const priceRange = DEFAULT_P1 - DEFAULT_P0;
  return DEFAULT_P0 + (priceRange * sharesSold) / DATABASE_TRADEABLE_CAP;
}

/**
 * Calculate shares out for PROMPT in (after fees)
 * Uses quadratic formula for linear curve
 */
export function calculateBuyReturn(
  sharesSold: number,
  promptIn: number
): {
  sharesOut: number;
  fee: number;
  promptAfterFee: number;
  priceAtStart: number;
  priceAtEnd: number;
  averagePrice: number;
} {
  const { DEFAULT_P0, DEFAULT_P1, DATABASE_TRADEABLE_CAP, TRADING_FEE_BPS } = BONDING_CURVE_V6_1_CONSTANTS;

  // 1. Calculate fee
  const fee = (promptIn * TRADING_FEE_BPS) / 10000;
  const promptAfterFee = promptIn - fee;

  // 2. Calculate shares out using quadratic formula
  const currentPrice = calculateCurrentPrice(sharesSold);
  const priceRange = DEFAULT_P1 - DEFAULT_P0;

  const discriminant = currentPrice * currentPrice + (2 * priceRange * promptAfterFee) / DATABASE_TRADEABLE_CAP;
  const sqrtDiscriminant = Math.sqrt(discriminant);
  let sharesOut = ((sqrtDiscriminant - currentPrice) * DATABASE_TRADEABLE_CAP) / priceRange;

  // 3. Enforce cap
  sharesOut = Math.min(sharesOut, DATABASE_TRADEABLE_CAP - sharesSold);

  const priceAtEnd = calculateCurrentPrice(sharesSold + sharesOut);
  const averagePrice = (currentPrice + priceAtEnd) / 2;

  return {
    sharesOut,
    fee,
    promptAfterFee,
    priceAtStart: currentPrice,
    priceAtEnd,
    averagePrice,
  };
}

/**
 * Calculate PROMPT out for shares in (before fees)
 */
export function calculateSellReturn(
  sharesSold: number,
  sharesIn: number
): {
  promptGross: number;
  promptNet: number;
  fee: number;
  priceAtStart: number;
  priceAtEnd: number;
  averagePrice: number;
} {
  const { TRADING_FEE_BPS } = BONDING_CURVE_V6_1_CONSTANTS;

  const priceAtStart = calculateCurrentPrice(sharesSold);
  const priceAtEnd = calculateCurrentPrice(sharesSold - sharesIn);

  const promptGross = (sharesIn * (priceAtStart + priceAtEnd)) / 2;
  const fee = (promptGross * TRADING_FEE_BPS) / 10000;
  const promptNet = promptGross - fee;

  const averagePrice = (priceAtStart + priceAtEnd) / 2;

  return {
    promptGross,
    promptNet,
    fee,
    priceAtStart,
    priceAtEnd,
    averagePrice,
  };
}

/**
 * Distribute fees according to V6.1 split (40/40/20)
 */
export function calculateFeeDistribution(fee: number): {
  creatorFee: number;
  vaultFee: number;
  lpTreasuryFee: number;
} {
  const { CREATOR_FEE_BPS, VAULT_FEE_BPS, LP_TREASURY_FEE_BPS } = BONDING_CURVE_V6_1_CONSTANTS;
  return {
    creatorFee: (fee * CREATOR_FEE_BPS) / 10000,
    vaultFee: (fee * VAULT_FEE_BPS) / 10000,
    lpTreasuryFee: (fee * LP_TREASURY_FEE_BPS) / 10000,
  };
}

// ============ LP Allocation Functions ============

/**
 * Calculate LP allocation for given shares sold
 * Formula: LP = 880M - 1.05X (where X = shares held)
 */
export function calculateLPAllocation(sharesSold: number): {
  lpTokens: number;
  lpPercent: number;
  lpPrompt: number;
} {
  const { VARIABLE_POOL, TOTAL_SUPPLY, GRADUATION_THRESHOLD_PROMPT } = BONDING_CURVE_V6_1_CONSTANTS;
  
  // LP = 880M - 1.05X
  const lpTokens = VARIABLE_POOL - sharesSold * 1.05;
  const lpPercent = (lpTokens / TOTAL_SUPPLY) * 100;
  const lpPrompt = GRADUATION_THRESHOLD_PROMPT; // Always fixed 42K

  return { lpTokens, lpPercent, lpPrompt };
}

/**
 * Calculate holder rewards (5% of holdings)
 */
export function calculateHolderRewards(holdings: number): number {
  return holdings * 0.05;
}

// ============ Market Data Functions ============

/**
 * Calculate market data for display
 */
export function calculateMarketData(
  promptRaised: number,
  sharesSold: number
): {
  currentPrice: number;
  marketCap: number;
  progressPercent: number;
  fdvAtGraduation: number;
} {
  const { GRADUATION_THRESHOLD_PROMPT, TARGET_FDV_AT_GRADUATION } = BONDING_CURVE_V6_1_CONSTANTS;
  
  const currentPrice = calculateCurrentPrice(sharesSold);
  const marketCap = sharesSold * currentPrice;
  const progressPercent = (promptRaised / GRADUATION_THRESHOLD_PROMPT) * 100;
  const fdvAtGraduation = TARGET_FDV_AT_GRADUATION;

  return { currentPrice, marketCap, progressPercent, fdvAtGraduation };
}

/**
 * Calculate price impact for a trade
 */
export function calculatePriceImpact(
  sharesSold: number,
  promptAmount: number,
  isBuy: boolean
): number {
  const startPrice = calculateCurrentPrice(sharesSold);
  
  if (isBuy) {
    const { priceAtEnd } = calculateBuyReturn(sharesSold, promptAmount);
    return ((priceAtEnd - startPrice) / startPrice) * 100;
  } else {
    const { priceAtEnd } = calculateSellReturn(sharesSold, promptAmount);
    return ((startPrice - priceAtEnd) / startPrice) * 100;
  }
}

/**
 * Check if agent can graduate
 */
export function canGraduate(promptRaised: number): boolean {
  return promptRaised >= BONDING_CURVE_V6_1_CONSTANTS.GRADUATION_THRESHOLD_PROMPT;
}

/**
 * Get graduation progress as percentage
 */
export function getGraduationProgress(promptRaised: number): number {
  const { GRADUATION_THRESHOLD_PROMPT } = BONDING_CURVE_V6_1_CONSTANTS;
  return Math.min((promptRaised / GRADUATION_THRESHOLD_PROMPT) * 100, 100);
}

// ============ Validation Functions ============

/**
 * Validate trade parameters
 */
export function validateTrade(
  sharesSold: number,
  amount: number,
  isBuy: boolean
): { valid: boolean; error?: string } {
  const { DATABASE_TRADEABLE_CAP } = BONDING_CURVE_V6_1_CONSTANTS;
  
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (isBuy) {
    if (sharesSold >= DATABASE_TRADEABLE_CAP) {
      return { valid: false, error: 'Max shares already sold' };
    }
  } else {
    if (amount > sharesSold) {
      return { valid: false, error: 'Cannot sell more than available' };
    }
  }
  
  return { valid: true };
}
