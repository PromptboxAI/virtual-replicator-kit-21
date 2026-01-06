/**
 * V7 Bonding Curve Pricing Library
 * 
 * Linear bonding curve: P(x) = P0 + (P1 - P0) * x / CAP
 * 
 * Key formulas:
 * - Current Price: P0 + (P1 - P0) * sharesSold / CAP
 * - Buy: Quadratic integral for shares out
 * - Sell: Average price between current and new position
 */

import { V7_CONSTANTS } from './constants';

const { 
  TRADEABLE_CAP, 
  DEFAULT_P0, 
  DEFAULT_P1,
  GRADUATION_THRESHOLD,
  TRADING_FEE_BPS,
  CREATOR_FEE_BPS,
  PLATFORM_FEE_BPS,
  BASIS_POINTS,
  TOTAL_SUPPLY,
} = V7_CONSTANTS;

// ============ Core Pricing Functions ============

/**
 * Calculate current price at a given supply level
 * P(x) = P0 + (P1 - P0) * x / CAP
 */
export function calculateCurrentPrice(
  sharesSold: number,
  p0: number = DEFAULT_P0,
  p1: number = DEFAULT_P1
): number {
  if (sharesSold <= 0) return p0;
  if (sharesSold >= TRADEABLE_CAP) return p1;
  
  const slope = (p1 - p0) / TRADEABLE_CAP;
  return p0 + slope * sharesSold;
}

/**
 * Calculate shares received for a given PROMPT input (BUY)
 * Uses quadratic formula derived from integral of linear curve
 * 
 * Cost integral: C(x) = P0*x + (P1-P0)*x²/(2*CAP)
 * Solving for shares: quadratic formula
 */
export function calculateBuyReturn(
  sharesSold: number,
  promptIn: number,
  p0: number = DEFAULT_P0,
  p1: number = DEFAULT_P1
): {
  sharesOut: number;
  fee: number;
  creatorFee: number;
  platformFee: number;
  netPrompt: number;
  avgPrice: number;
  newPrice: number;
  priceImpact: number;
} {
  // Apply fee first
  const fee = promptIn * (TRADING_FEE_BPS / BASIS_POINTS);
  const creatorFee = fee * (CREATOR_FEE_BPS / BASIS_POINTS);
  const platformFee = fee * (PLATFORM_FEE_BPS / BASIS_POINTS);
  const netPrompt = promptIn - fee;
  
  if (netPrompt <= 0) {
    return {
      sharesOut: 0,
      fee,
      creatorFee,
      platformFee,
      netPrompt: 0,
      avgPrice: 0,
      newPrice: calculateCurrentPrice(sharesSold, p0, p1),
      priceImpact: 0,
    };
  }
  
  const startPrice = calculateCurrentPrice(sharesSold, p0, p1);
  
  // Quadratic formula coefficients
  // C(x+Δ) - C(x) = netPrompt
  // P0*Δ + (P1-P0)*(2x*Δ + Δ²)/(2*CAP) = netPrompt
  // Let a = (P1-P0)/(2*CAP), b = P0 + (P1-P0)*x/CAP, c = -netPrompt
  // aΔ² + bΔ + c = 0
  
  const slope = (p1 - p0) / TRADEABLE_CAP;
  const a = slope / 2;
  const b = p0 + slope * sharesSold;
  const c = -netPrompt;
  
  // Quadratic formula: Δ = (-b + sqrt(b² - 4ac)) / (2a)
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) {
    // No valid solution - shouldn't happen with valid inputs
    return {
      sharesOut: 0,
      fee,
      creatorFee,
      platformFee,
      netPrompt,
      avgPrice: 0,
      newPrice: startPrice,
      priceImpact: 0,
    };
  }
  
  let sharesOut = (-b + Math.sqrt(discriminant)) / (2 * a);
  
  // Cap at tradeable cap
  const maxShares = TRADEABLE_CAP - sharesSold;
  if (sharesOut > maxShares) {
    sharesOut = maxShares;
  }
  
  const newSharesSold = sharesSold + sharesOut;
  const newPrice = calculateCurrentPrice(newSharesSold, p0, p1);
  const avgPrice = sharesOut > 0 ? netPrompt / sharesOut : 0;
  const priceImpact = startPrice > 0 ? ((newPrice - startPrice) / startPrice) * 100 : 0;
  
  return {
    sharesOut,
    fee,
    creatorFee,
    platformFee,
    netPrompt,
    avgPrice,
    newPrice,
    priceImpact,
  };
}

/**
 * Calculate PROMPT received for selling shares (SELL)
 * Uses average price between current position and new position
 */
export function calculateSellReturn(
  sharesSold: number,
  sharesIn: number,
  p0: number = DEFAULT_P0,
  p1: number = DEFAULT_P1
): {
  promptOut: number;
  fee: number;
  creatorFee: number;
  platformFee: number;
  grossPrompt: number;
  avgPrice: number;
  newPrice: number;
  priceImpact: number;
} {
  if (sharesIn <= 0 || sharesSold <= 0) {
    return {
      promptOut: 0,
      fee: 0,
      creatorFee: 0,
      platformFee: 0,
      grossPrompt: 0,
      avgPrice: 0,
      newPrice: calculateCurrentPrice(sharesSold, p0, p1),
      priceImpact: 0,
    };
  }
  
  // Can't sell more than what's been sold
  const actualSharesIn = Math.min(sharesIn, sharesSold);
  
  const startPrice = calculateCurrentPrice(sharesSold, p0, p1);
  const newSharesSold = sharesSold - actualSharesIn;
  const newPrice = calculateCurrentPrice(newSharesSold, p0, p1);
  
  // Average price between start and end
  const avgPrice = (startPrice + newPrice) / 2;
  const grossPrompt = avgPrice * actualSharesIn;
  
  // Apply fee
  const fee = grossPrompt * (TRADING_FEE_BPS / BASIS_POINTS);
  const creatorFee = fee * (CREATOR_FEE_BPS / BASIS_POINTS);
  const platformFee = fee * (PLATFORM_FEE_BPS / BASIS_POINTS);
  const promptOut = grossPrompt - fee;
  
  const priceImpact = startPrice > 0 ? ((newPrice - startPrice) / startPrice) * 100 : 0;
  
  return {
    promptOut,
    fee,
    creatorFee,
    platformFee,
    grossPrompt,
    avgPrice,
    newPrice,
    priceImpact,
  };
}

// ============ Market Data Functions ============

/**
 * Calculate graduation progress (0-100%)
 */
export function calculateGraduationProgress(promptRaised: number): number {
  if (promptRaised <= 0) return 0;
  if (promptRaised >= GRADUATION_THRESHOLD) return 100;
  return (promptRaised / GRADUATION_THRESHOLD) * 100;
}

/**
 * Check if agent should graduate
 */
export function shouldGraduate(promptRaised: number): boolean {
  return promptRaised >= GRADUATION_THRESHOLD;
}

/**
 * Calculate market cap (circulating supply * price)
 */
export function calculateMarketCap(
  sharesSold: number,
  p0: number = DEFAULT_P0,
  p1: number = DEFAULT_P1
): number {
  const currentPrice = calculateCurrentPrice(sharesSold, p0, p1);
  return currentPrice * sharesSold;
}

/**
 * Calculate fully diluted valuation (total supply * price)
 */
export function calculateFDV(
  sharesSold: number,
  p0: number = DEFAULT_P0,
  p1: number = DEFAULT_P1
): number {
  const currentPrice = calculateCurrentPrice(sharesSold, p0, p1);
  return currentPrice * TOTAL_SUPPLY;
}

/**
 * Get market data for an agent
 */
export function getMarketData(
  sharesSold: number,
  promptRaised: number,
  p0: number = DEFAULT_P0,
  p1: number = DEFAULT_P1
): {
  currentPrice: number;
  marketCap: number;
  fdv: number;
  graduationProgress: number;
  shouldGraduate: boolean;
  sharesRemaining: number;
  percentSold: number;
} {
  const currentPrice = calculateCurrentPrice(sharesSold, p0, p1);
  
  return {
    currentPrice,
    marketCap: calculateMarketCap(sharesSold, p0, p1),
    fdv: calculateFDV(sharesSold, p0, p1),
    graduationProgress: calculateGraduationProgress(promptRaised),
    shouldGraduate: shouldGraduate(promptRaised),
    sharesRemaining: Math.max(0, TRADEABLE_CAP - sharesSold),
    percentSold: (sharesSold / TRADEABLE_CAP) * 100,
  };
}

// ============ Validation Functions ============

/**
 * Validate buy parameters
 */
export function validateBuy(
  promptAmount: number,
  sharesSold: number,
  minSharesOut: number = 0
): { valid: boolean; error?: string } {
  if (promptAmount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (sharesSold >= TRADEABLE_CAP) {
    return { valid: false, error: 'Bonding curve is at capacity' };
  }
  
  const result = calculateBuyReturn(sharesSold, promptAmount);
  
  if (result.sharesOut <= 0) {
    return { valid: false, error: 'Trade amount too small' };
  }
  
  if (minSharesOut > 0 && result.sharesOut < minSharesOut) {
    return { valid: false, error: `Slippage exceeded: would receive ${result.sharesOut.toFixed(2)} shares, minimum ${minSharesOut.toFixed(2)}` };
  }
  
  return { valid: true };
}

/**
 * Validate sell parameters
 */
export function validateSell(
  sharesAmount: number,
  userBalance: number,
  sharesSold: number,
  promptRaised: number,
  minPromptOut: number = 0
): { valid: boolean; error?: string } {
  if (sharesAmount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (sharesAmount > userBalance) {
    return { valid: false, error: 'Insufficient balance' };
  }
  
  const result = calculateSellReturn(sharesSold, sharesAmount);
  
  if (result.promptOut > promptRaised) {
    return { valid: false, error: 'Insufficient liquidity in reserve' };
  }
  
  if (minPromptOut > 0 && result.promptOut < minPromptOut) {
    return { valid: false, error: `Slippage exceeded: would receive ${result.promptOut.toFixed(4)} PROMPT, minimum ${minPromptOut.toFixed(4)}` };
  }
  
  return { valid: true };
}

// ============ Quote Functions ============

/**
 * Get a buy quote without executing
 */
export function getBuyQuote(
  promptAmount: number,
  sharesSold: number,
  p0: number = DEFAULT_P0,
  p1: number = DEFAULT_P1
) {
  const result = calculateBuyReturn(sharesSold, promptAmount, p0, p1);
  const validation = validateBuy(promptAmount, sharesSold);
  
  return {
    ...result,
    valid: validation.valid,
    error: validation.error,
    sharesSold,
    newSharesSold: sharesSold + result.sharesOut,
  };
}

/**
 * Get a sell quote without executing
 */
export function getSellQuote(
  sharesAmount: number,
  sharesSold: number,
  userBalance: number,
  promptRaised: number,
  p0: number = DEFAULT_P0,
  p1: number = DEFAULT_P1
) {
  const result = calculateSellReturn(sharesSold, sharesAmount, p0, p1);
  const validation = validateSell(sharesAmount, userBalance, sharesSold, promptRaised);
  
  return {
    ...result,
    valid: validation.valid,
    error: validation.error,
    sharesSold,
    newSharesSold: sharesSold - Math.min(sharesAmount, sharesSold),
  };
}

// ============ Exports ============

export { V7_CONSTANTS } from './constants';
