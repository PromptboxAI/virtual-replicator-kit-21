/**
 * Bonding Curve V5 - Linear PROMPT-native bonding curve calculations
 * 
 * Key Features:
 * - Linear price curve: price(supply) = P0 + (P1 - P0) * (supply / GRADUATION_SUPPLY)
 * - PROMPT-native (no USD oracle needed for core logic)
 * - Two-way trading (buy and sell)
 * - Reserve-based graduation
 * - 5% buy fee (2% creator, 2% platform, 1% LP)
 * - 0% sell fee
 */

// Constants matching the smart contract
export const BONDING_CURVE_V5_CONSTANTS = {
  GRADUATION_SUPPLY: 1_000_000, // 1M tokens
  BUY_FEE_BPS: 500, // 5%
  SELL_FEE_BPS: 0, // 0%
  BASIS_POINTS: 10000,
  
  // Fee distribution (of the 5% buy fee)
  CREATOR_FEE_BPS: 4000, // 2% of trade = 40% of 5% fee
  PLATFORM_FEE_BPS: 4000, // 2% of trade = 40% of 5% fee
  LP_FEE_BPS: 2000, // 1% of trade = 20% of 5% fee
  
  // Default parameters
  DEFAULT_P0: 0.00004, // Starting price in PROMPT
  DEFAULT_P1: 0.0001, // Ending price in PROMPT
  DEFAULT_GRADUATION_THRESHOLD: 42000, // PROMPT reserves needed to graduate
} as const;

export interface BondingCurveV5Config {
  p0: number; // Starting price in PROMPT
  p1: number; // Ending price in PROMPT
  graduationThresholdPrompt: number; // PROMPT reserves needed to graduate
}

export interface BondingCurveV5State {
  tokensSold: number; // Total tokens sold through bonding curve
  promptReserves: number; // PROMPT held in bonding curve
  phase: 'active' | 'graduated';
}

/**
 * Calculate current price on the linear bonding curve
 * Formula: price = p0 + (p1 - p0) * (supply / GRADUATION_SUPPLY)
 */
export function calculateCurrentPrice(
  config: BondingCurveV5Config,
  tokensSold: number
): number {
  const { p0, p1 } = config;
  const { GRADUATION_SUPPLY } = BONDING_CURVE_V5_CONSTANTS;
  
  // Linear interpolation
  const priceRange = p1 - p0;
  const price = p0 + (priceRange * tokensSold) / GRADUATION_SUPPLY;
  
  return price;
}

/**
 * Calculate tokens received for a given PROMPT amount (before fees)
 * This is an approximation using the average price method
 */
export function calculateBuyReturn(
  config: BondingCurveV5Config,
  state: BondingCurveV5State,
  promptIn: number
): {
  tokensOut: number;
  fee: number;
  promptAfterFee: number;
  priceAtStart: number;
  priceAtEnd: number;
  averagePrice: number;
} {
  const { BUY_FEE_BPS, BASIS_POINTS, GRADUATION_SUPPLY } = BONDING_CURVE_V5_CONSTANTS;
  
  // Calculate fee
  const fee = (promptIn * BUY_FEE_BPS) / BASIS_POINTS;
  const promptAfterFee = promptIn - fee;
  
  // Get current price
  const priceAtStart = calculateCurrentPrice(config, state.tokensSold);
  
  // Approximate tokens out using quadratic solution
  // For linear curve: tokens ≈ (2 * promptIn) / (priceStart + priceEnd)
  const a = (config.p1 - config.p0) / GRADUATION_SUPPLY;
  const tokensOut = promptAfterFee / (priceAtStart + (a * promptAfterFee) / 2);
  
  // Calculate price at end
  const priceAtEnd = calculateCurrentPrice(config, state.tokensSold + tokensOut);
  const averagePrice = (priceAtStart + priceAtEnd) / 2;
  
  return {
    tokensOut,
    fee,
    promptAfterFee,
    priceAtStart,
    priceAtEnd,
    averagePrice,
  };
}

/**
 * Calculate PROMPT received for selling tokens
 * Formula: promptOut = tokens * (priceStart + priceEnd) / 2
 */
export function calculateSellReturn(
  config: BondingCurveV5Config,
  state: BondingCurveV5State,
  tokensIn: number
): {
  promptOut: number;
  priceAtStart: number;
  priceAtEnd: number;
  averagePrice: number;
} {
  // Get current price
  const priceAtStart = calculateCurrentPrice(config, state.tokensSold);
  
  // Calculate price after sell
  const priceAtEnd = calculateCurrentPrice(config, state.tokensSold - tokensIn);
  
  // Average price method
  const averagePrice = (priceAtStart + priceAtEnd) / 2;
  const promptOut = tokensIn * averagePrice;
  
  return {
    promptOut,
    priceAtStart,
    priceAtEnd,
    averagePrice,
  };
}

/**
 * Calculate fee distribution for a buy transaction
 */
export function calculateFeeDistribution(fee: number): {
  creatorFee: number;
  platformFee: number;
  lpFee: number;
} {
  const { CREATOR_FEE_BPS, PLATFORM_FEE_BPS, LP_FEE_BPS, BASIS_POINTS } = 
    BONDING_CURVE_V5_CONSTANTS;
  
  return {
    creatorFee: (fee * CREATOR_FEE_BPS) / BASIS_POINTS,
    platformFee: (fee * PLATFORM_FEE_BPS) / BASIS_POINTS,
    lpFee: (fee * LP_FEE_BPS) / BASIS_POINTS,
  };
}

/**
 * Check if an agent can graduate based on PROMPT reserves
 */
export function canGraduate(
  config: BondingCurveV5Config,
  state: BondingCurveV5State
): boolean {
  return state.promptReserves >= config.graduationThresholdPrompt;
}

/**
 * Calculate price impact for a trade
 */
export function calculatePriceImpact(
  config: BondingCurveV5Config,
  state: BondingCurveV5State,
  promptAmount: number,
  isBuy: boolean
): number {
  const currentPrice = calculateCurrentPrice(config, state.tokensSold);
  
  if (isBuy) {
    const { priceAtEnd } = calculateBuyReturn(config, state, promptAmount);
    return ((priceAtEnd - currentPrice) / currentPrice) * 100;
  } else {
    // For sell, calculate based on tokens
    const tokensToSell = promptAmount / currentPrice; // Approximate
    const { priceAtEnd } = calculateSellReturn(config, state, tokensToSell);
    return ((priceAtEnd - currentPrice) / currentPrice) * 100;
  }
}

/**
 * Get graduation progress as percentage
 */
export function getGraduationProgress(
  config: BondingCurveV5Config,
  state: BondingCurveV5State
): number {
  return Math.min(
    (state.promptReserves / config.graduationThresholdPrompt) * 100,
    100
  );
}

/**
 * Calculate market cap at current supply
 */
export function calculateMarketCap(
  config: BondingCurveV5Config,
  state: BondingCurveV5State
): number {
  const currentPrice = calculateCurrentPrice(config, state.tokensSold);
  return currentPrice * state.tokensSold;
}

/**
 * Calculate fully diluted valuation (FDV) at graduation
 */
export function calculateFDV(config: BondingCurveV5Config): number {
  const { GRADUATION_SUPPLY } = BONDING_CURVE_V5_CONSTANTS;
  const priceAtGraduation = config.p1;
  return priceAtGraduation * GRADUATION_SUPPLY;
}

/**
 * Validate trade parameters
 */
export function validateTrade(
  config: BondingCurveV5Config,
  state: BondingCurveV5State,
  amount: number,
  isBuy: boolean
): { valid: boolean; error?: string } {
  if (state.phase !== 'active') {
    return { valid: false, error: 'Agent has graduated' };
  }
  
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (isBuy) {
    const { tokensOut } = calculateBuyReturn(config, state, amount);
    if (state.tokensSold + tokensOut > BONDING_CURVE_V5_CONSTANTS.GRADUATION_SUPPLY) {
      return { valid: false, error: 'Would exceed graduation supply' };
    }
  } else {
    const currentPrice = calculateCurrentPrice(config, state.tokensSold);
    const tokensToSell = amount / currentPrice;
    if (tokensToSell > state.tokensSold) {
      return { valid: false, error: 'Exceeds available supply' };
    }
    
    const { promptOut } = calculateSellReturn(config, state, tokensToSell);
    if (promptOut > state.promptReserves) {
      return { valid: false, error: 'Insufficient reserves' };
    }
  }
  
  return { valid: true };
}
