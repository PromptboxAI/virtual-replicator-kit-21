/**
 * Bonding Curve V4 - Dynamic USD-Based Pricing
 * Phase 1: Implements correct inverse relationship (higher PROMPT = fewer tokens)
 * Fixes: Higher PROMPT price = FEWER tokens per PROMPT (maintaining USD value)
 */

import { getGraduationThreshold, DEFAULT_GRADUATION_CONFIG, type GraduationConfig } from './graduationConfig';

// Dynamic pricing configuration
export interface DynamicBondingConfig {
  promptUsdRate: number;  // Current PROMPT price in USD
  targetUsdPerToken: number;  // Target USD per token at start ($10 per 2.5M = $0.000004)
  graduationConfig: GraduationConfig;
}

// Calculate dynamic P0 based on PROMPT price (CORRECTED: inverse relationship)
export function calculateDynamicP0(config: DynamicBondingConfig): number {
  // P0 = Target USD per token / PROMPT USD rate
  // Example: $0.000004 / $0.10 = 0.00004 PROMPT per token
  // Example: $0.000004 / $1.00 = 0.000004 PROMPT per token (10x less PROMPT = 10x more tokens)
  return config.targetUsdPerToken / config.promptUsdRate;
}

// Calculate dynamic P1 based on graduation threshold
export function calculateDynamicP1(config: DynamicBondingConfig): number {
  const graduationThreshold = getGraduationThreshold(config.graduationConfig);
  const P0 = calculateDynamicP0(config);
  const CURVE_SUPPLY = 800_000_000;
  
  // P1 = (2 * graduationThreshold / CURVE_SUPPLY) - P0
  return (2 * graduationThreshold / CURVE_SUPPLY) - P0;
}

// Base configuration type
export type BondingCurveConfig = {
  CURVE_SUPPLY: number;
  LP_RESERVE: number;
  TOTAL_SUPPLY: number;
  AGENT_CREATION_COST: number;
  TRADING_FEE_PERCENTAGE: number;
  AGENT_REVENUE_PERCENTAGE: number;
  PLATFORM_REVENUE_PERCENTAGE: number;
  MAX_PRICE_IMPACT_WARNING: number;
  MAX_DAILY_VOLUME_LIMIT: number;
  GRADUATION_WARNING_THRESHOLD: number;
  HIGH_SLIPPAGE_THRESHOLD: number;
  LP_PROMPT_PERCENTAGE: number;
  PLATFORM_KEEP_PERCENTAGE: number;
  LIQUIDITY_LOCK_YEARS: number;
  P0: number;
  P1: number;
  GRADUATION_PROMPT_AMOUNT: number;
};

// Create dynamic bonding curve configuration
export function createDynamicBondingConfig(
  promptUsdRate: number,
  mode: 'database' | 'smart_contract' = 'database'
): BondingCurveConfig {
  const config: DynamicBondingConfig = {
    promptUsdRate,
    targetUsdPerToken: 0.000004, // $10 for 2.5M tokens
    graduationConfig: {
      mode,
      targetMarketCapUSD: 65000, // $65K production target
      promptUsdRate
    }
  };
  
  const P0 = calculateDynamicP0(config);
  const P1 = calculateDynamicP1(config);
  const graduationThreshold = getGraduationThreshold(config.graduationConfig);
  
  return {
    ...BONDING_CURVE_V4_CONFIG_BASE,
    P0,
    P1,
    GRADUATION_PROMPT_AMOUNT: graduationThreshold
  };
}

// Base configuration (non-dynamic values)
const BONDING_CURVE_V4_CONFIG_BASE = {
  // Core parameters
  CURVE_SUPPLY: 800_000_000, // 800M tokens on bonding curve
  LP_RESERVE: 200_000_000,   // 200M tokens for LP
  TOTAL_SUPPLY: 1_000_000_000, // 1B total supply
  
  AGENT_CREATION_COST: 100, // 100 PROMPT creation fee (separate from curve)
  
  // Trading fees (virtuals.io standard)
  TRADING_FEE_PERCENTAGE: 0.01, // 1% total
  AGENT_REVENUE_PERCENTAGE: 0.007, // 70% of fees
  PLATFORM_REVENUE_PERCENTAGE: 0.003, // 30% of fees
  
  // Safety limits
  MAX_PRICE_IMPACT_WARNING: 5, // Warn if >5% price impact
  MAX_DAILY_VOLUME_LIMIT: 10000, // 10k PROMPT daily limit per agent
  
  // UX thresholds
  GRADUATION_WARNING_THRESHOLD: 0.95, // Warn when 95% to graduation
  HIGH_SLIPPAGE_THRESHOLD: 3, // Warn if >3% slippage
  
  // LP & Migration
  LP_PROMPT_PERCENTAGE: 0.7, // 70% of raised PROMPT goes to LP
  PLATFORM_KEEP_PERCENTAGE: 0.3, // 30% stays as platform revenue
  LIQUIDITY_LOCK_YEARS: 10, // 10-year LP lock
};

// Export default configuration (legacy - requires FX for proper initialization)
// Note: This should not be used directly. Always call createDynamicBondingConfig(fxRate) with live FX.
export const BONDING_CURVE_V4_CONFIG: BondingCurveConfig = {
  ...BONDING_CURVE_V4_CONFIG_BASE,
  P0: 0.0000075, // Placeholder - should be calculated dynamically
  P1: 0.00075,   // Placeholder - should be calculated dynamically
  GRADUATION_PROMPT_AMOUNT: 750_000
};

/**
 * Get price slope for a given config (can be dynamic)
 */
function getPriceSlope(config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG): number {
  return (config.P1 - config.P0) / config.CURVE_SUPPLY;
}

/**
 * Get current price using linear formula: P(S) = P0 + slope * S
 */
export function getCurrentPriceV4(tokensSold: number, config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG): number {
  const { P0, P1, CURVE_SUPPLY } = config;
  const slope = getPriceSlope(config);
  
  if (tokensSold <= 0) return P0;
  if (tokensSold >= CURVE_SUPPLY) return P1;
  
  return P0 + (slope * tokensSold);
}

/**
 * Calculate tokens sold from PROMPT raised using quadratic formula
 * For linear curve: prompt_raised = integral of price from 0 to s
 * prompt_raised = p0*s + 0.5*slope*s^2
 * Solve: 0.5*slope*s^2 + p0*s - prompt_raised = 0
 */
export function tokensSoldFromPromptRaisedV4(promptRaised: number, config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG): number {
  const { P0, CURVE_SUPPLY } = config;
  const slope = getPriceSlope(config);
  
  if (promptRaised <= 0) return 0;
  
  // For very small slope, use simple division
  if (Math.abs(slope) < 1e-15) {
    return Math.min(promptRaised / P0, CURVE_SUPPLY);
  }
  
  // Quadratic formula: ax² + bx + c = 0
  const a = slope / 2;
  const b = P0;
  const c = -promptRaised;
  
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) return CURVE_SUPPLY;
  
  const tokensSold = (-b + Math.sqrt(discriminant)) / (2 * a);
  return Math.min(Math.max(tokensSold, 0), CURVE_SUPPLY);
}

/**
 * Calculate PROMPT raised from tokens sold using integral
 * prompt_raised = p0*s + 0.5*slope*s^2
 */
export function promptRaisedFromTokensSoldV4(tokensSold: number, config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG): number {
  const { P0, CURVE_SUPPLY } = config;
  const slope = getPriceSlope(config);
  
  if (tokensSold <= 0) return 0;
  
  const s = Math.min(tokensSold, CURVE_SUPPLY);
  return P0 * s + (slope * s * s) / 2;
}

/**
 * Get price directly from PROMPT raised
 */
export function getPriceFromPromptV4(promptRaised: number, config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG): number {
  const tokensSold = tokensSoldFromPromptRaisedV4(promptRaised, config);
  return getCurrentPriceV4(tokensSold, config);
}

/**
 * Calculate buy cost and metrics
 */
export function calculateBuyCostV4(
  currentTokensSold: number,
  tokenAmount: number,
  includeFees: boolean = true,
  config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG
): {
  cost: number;
  averagePrice: number;
  newTokensSold: number;
  priceImpact: number;
  newPrice: number;
  slippage: number;
} {
  const { CURVE_SUPPLY, TRADING_FEE_PERCENTAGE } = config;
  
  if (tokenAmount <= 0) {
    const currentPrice = getCurrentPriceV4(currentTokensSold, config);
    return {
      cost: 0,
      averagePrice: currentPrice,
      newTokensSold: currentTokensSold,
      priceImpact: 0,
      newPrice: currentPrice,
      slippage: 0
    };
  }
  
  const startTokensSold = Math.max(0, currentTokensSold);
  const endTokensSold = Math.min(startTokensSold + tokenAmount, CURVE_SUPPLY);
  const actualTokenAmount = endTokensSold - startTokensSold;
  
  const startPromptRaised = promptRaisedFromTokensSoldV4(startTokensSold, config);
  const endPromptRaised = promptRaisedFromTokensSoldV4(endTokensSold, config);
  
  let cost = endPromptRaised - startPromptRaised;
  
  if (includeFees) {
    cost = cost / (1 - TRADING_FEE_PERCENTAGE);
  }
  
  const currentPrice = getCurrentPriceV4(startTokensSold, config);
  const newPrice = getCurrentPriceV4(endTokensSold, config);
  const averagePrice = actualTokenAmount > 0 ? cost / actualTokenAmount : newPrice;
  
  const priceImpact = currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice) * 100 : 0;
  const slippage = currentPrice > 0 ? ((averagePrice - currentPrice) / currentPrice) * 100 : 0;
  
  return {
    cost,
    averagePrice,
    newTokensSold: endTokensSold,
    priceImpact,
    newPrice,
    slippage
  };
}

/**
 * Calculate sell return and metrics
 */
export function calculateSellReturnV4(
  currentTokensSold: number,
  tokenAmount: number,
  includeFees: boolean = true,
  config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG
): {
  return: number;
  averagePrice: number;
  newTokensSold: number;
  priceImpact: number;
  newPrice: number;
  slippage: number;
} {
  const { TRADING_FEE_PERCENTAGE } = config;
  
  if (tokenAmount <= 0) {
    const currentPrice = getCurrentPriceV4(currentTokensSold, config);
    return {
      return: 0,
      averagePrice: currentPrice,
      newTokensSold: currentTokensSold,
      priceImpact: 0,
      newPrice: currentPrice,
      slippage: 0
    };
  }
  
  const startTokensSold = Math.max(0, currentTokensSold);
  const endTokensSold = Math.max(0, startTokensSold - tokenAmount);
  const actualTokenAmount = startTokensSold - endTokensSold;
  
  const startPromptRaised = promptRaisedFromTokensSoldV4(startTokensSold, config);
  const endPromptRaised = promptRaisedFromTokensSoldV4(endTokensSold, config);
  
  let returnAmount = startPromptRaised - endPromptRaised;
  
  if (includeFees) {
    returnAmount = returnAmount * (1 - TRADING_FEE_PERCENTAGE);
  }
  
  const currentPrice = getCurrentPriceV4(startTokensSold, config);
  const newPrice = getCurrentPriceV4(endTokensSold, config);
  const averagePrice = actualTokenAmount > 0 ? returnAmount / actualTokenAmount : newPrice;
  
  const priceImpact = currentPrice > 0 ? ((currentPrice - newPrice) / currentPrice) * 100 : 0;
  const slippage = currentPrice > 0 ? ((currentPrice - averagePrice) / currentPrice) * 100 : 0;
  
  return {
    return: returnAmount,
    averagePrice,
    newTokensSold: endTokensSold,
    priceImpact,
    newPrice,
    slippage
  };
}

/**
 * Calculate tokens purchasable with given PROMPT amount
 */
export function calculateTokensFromPromptV4(
  currentTokensSold: number,
  promptAmount: number,
  includeFees: boolean = true,
  config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG
): {
  tokenAmount: number;
  remainingPrompt: number;
  newTokensSold: number;
  averagePrice: number;
  newPrice: number;
  priceImpact: number;
} {
  const { CURVE_SUPPLY, TRADING_FEE_PERCENTAGE } = config;
  
  if (promptAmount <= 0) {
    const currentPrice = getCurrentPriceV4(currentTokensSold, config);
    return {
      tokenAmount: 0,
      remainingPrompt: 0,
      newTokensSold: currentTokensSold,
      averagePrice: currentPrice,
      newPrice: currentPrice,
      priceImpact: 0
    };
  }
  
  let availablePrompt = promptAmount;
  if (includeFees) {
    availablePrompt = promptAmount * (1 - TRADING_FEE_PERCENTAGE);
  }
  
  const startTokensSold = Math.max(0, currentTokensSold);
  const startPromptRaised = promptRaisedFromTokensSoldV4(startTokensSold, config);
  const targetPromptRaised = startPromptRaised + availablePrompt;
  
  const maxPromptRaised = promptRaisedFromTokensSoldV4(CURVE_SUPPLY, config);
  const actualTargetPrompt = Math.min(targetPromptRaised, maxPromptRaised);
  
  const endTokensSold = tokensSoldFromPromptRaisedV4(actualTargetPrompt, config);
  const tokenAmount = endTokensSold - startTokensSold;
  
  const actualPromptUsed = actualTargetPrompt - startPromptRaised;
  const actualPromptPaid = includeFees ? actualPromptUsed / (1 - TRADING_FEE_PERCENTAGE) : actualPromptUsed;
  const remainingPrompt = promptAmount - actualPromptPaid;
  
  const currentPrice = getCurrentPriceV4(startTokensSold, config);
  const newPrice = getCurrentPriceV4(endTokensSold, config);
  const averagePrice = tokenAmount > 0 ? actualPromptPaid / tokenAmount : newPrice;
  const priceImpact = currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice) * 100 : 0;
  
  return {
    tokenAmount,
    remainingPrompt: Math.max(0, remainingPrompt),
    newTokensSold: endTokensSold,
    averagePrice,
    newPrice,
    priceImpact
  };
}

/**
 * Calculate graduation progress
 */
export function calculateGraduationProgressV4(currentPromptRaised: number, config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG): {
  progress: number;
  remaining: number;
  isGraduated: boolean;
  isNearGraduation: boolean;
  progressDisplay: string;
  countdownMessage: string;
} {
  const { GRADUATION_PROMPT_AMOUNT, GRADUATION_WARNING_THRESHOLD } = config;
  
  const progress = Math.min((currentPromptRaised / GRADUATION_PROMPT_AMOUNT) * 100, 100);
  const remaining = Math.max(0, GRADUATION_PROMPT_AMOUNT - currentPromptRaised);
  const isGraduated = currentPromptRaised >= GRADUATION_PROMPT_AMOUNT;
  const isNearGraduation = progress >= GRADUATION_WARNING_THRESHOLD * 100;
  
  const progressDisplay = isGraduated ? "100%" : `${progress.toFixed(1)}%`;
  
  let countdownMessage: string;
  if (isGraduated) {
    countdownMessage = "✅ Graduated to DEX!";
  } else if (isNearGraduation) {
    countdownMessage = `🚀 Almost there! ${formatTokenAmountV4(remaining)} PROMPT to go`;
  } else {
    countdownMessage = `📈 ${formatTokenAmountV4(remaining)} PROMPT needed for graduation`;
  }
  
  return {
    progress,
    remaining,
    isGraduated,
    isNearGraduation,
    progressDisplay,
    countdownMessage
  };
}

/**
 * Calculate fees breakdown
 */
export function calculateFeesV4(
  amount: number,
  transactionType: 'buy' | 'sell',
  config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG
): {
  totalFees: number;
  agentRevenue: number;
  platformRevenue: number;
  netAmount: number;
} {
  const { TRADING_FEE_PERCENTAGE, AGENT_REVENUE_PERCENTAGE, PLATFORM_REVENUE_PERCENTAGE } = config;
  
  const totalFees = amount * TRADING_FEE_PERCENTAGE;
  const agentRevenue = amount * AGENT_REVENUE_PERCENTAGE;
  const platformRevenue = amount * PLATFORM_REVENUE_PERCENTAGE;
  
  const netAmount = transactionType === 'buy' 
    ? amount - totalFees 
    : amount + totalFees;
  
  return {
    totalFees,
    agentRevenue,
    platformRevenue,
    netAmount
  };
}

/**
 * Calculate LP creation parameters
 */
export function calculateLPCreationV4(finalPromptRaised: number, config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG): {
  lpPromptAmount: number;
  lpTokenAmount: number;
  platformKeepAmount: number;
  totalValue: number;
} {
  const { LP_PROMPT_PERCENTAGE, PLATFORM_KEEP_PERCENTAGE, LP_RESERVE } = config;
  
  const lpPromptAmount = finalPromptRaised * LP_PROMPT_PERCENTAGE;
  const platformKeepAmount = finalPromptRaised * PLATFORM_KEEP_PERCENTAGE;
  const lpTokenAmount = LP_RESERVE;
  const totalValue = lpPromptAmount; // Value in PROMPT
  
  return {
    lpPromptAmount,
    lpTokenAmount,
    platformKeepAmount,
    totalValue
  };
}

/**
 * Calculate market statistics
 */
export function calculateMarketStatsV4(currentPromptRaised: number, config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG): {
  currentPrice: number;
  marketCap: number;
  totalVolume: number;
  tokensSold: number;
  liquidityDepth: number;
} {
  const { TOTAL_SUPPLY } = config;
  
  const tokensSold = tokensSoldFromPromptRaisedV4(currentPromptRaised, config);
  const currentPrice = getCurrentPriceV4(tokensSold, config);
  const marketCap = currentPrice * TOTAL_SUPPLY;
  const totalVolume = currentPromptRaised;
  const liquidityDepth = currentPromptRaised * 0.1; // Rough estimate
  
  return {
    currentPrice,
    marketCap,
    totalVolume,
    tokensSold,
    liquidityDepth
  };
}

/**
 * Validate trade amounts and check limits
 */
export function validateTradeAmountV4(
  promptAmount: number,
  tokenAmount: number,
  tradeType: 'buy' | 'sell',
  currentPromptRaised: number,
  config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const { MAX_PRICE_IMPACT_WARNING, HIGH_SLIPPAGE_THRESHOLD, GRADUATION_PROMPT_AMOUNT } = config;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  if (tradeType === 'buy' && promptAmount <= 0) {
    errors.push('PROMPT amount must be greater than 0');
  }
  
  if (tradeType === 'sell' && tokenAmount <= 0) {
    errors.push('Token amount must be greater than 0');
  }
  
  // Check if already graduated
  if (currentPromptRaised >= GRADUATION_PROMPT_AMOUNT) {
    errors.push('Agent has graduated - trade on DEX instead');
  }
  
  // Calculate impact for warnings
  if (tradeType === 'buy' && promptAmount > 0) {
    const currentTokensSold = tokensSoldFromPromptRaisedV4(currentPromptRaised, config);
    const result = calculateTokensFromPromptV4(currentTokensSold, promptAmount, true, config);
    
    if (result.priceImpact > MAX_PRICE_IMPACT_WARNING) {
      warnings.push(`High price impact: ${result.priceImpact.toFixed(1)}%`);
    }
    
    if (Math.abs(result.priceImpact) > HIGH_SLIPPAGE_THRESHOLD) {
      warnings.push(`High slippage: ${Math.abs(result.priceImpact).toFixed(1)}%`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Formatting utilities
export function formatTokenAmountV4(amount: number, decimals: number = 2): string {
  if (amount >= 1e9) return `${(amount / 1e9).toFixed(decimals)}B`;
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(decimals)}M`;
  if (amount >= 1e3) return `${(amount / 1e3).toFixed(decimals)}K`;
  return amount.toFixed(decimals);
}

export function formatPriceV4(price: number): string {
  if (price >= 1) return price.toFixed(6);
  if (price >= 0.001) return price.toFixed(8);
  return price.toExponential(2);
}

export function formatPromptAmountV4(amount: number, showSymbol: boolean = true): string {
  const formatted = formatTokenAmountV4(amount);
  return showSymbol ? `${formatted} PROMPT` : formatted;
}

// Legacy compatibility functions for migration
export function isAgentGraduatedV4(promptRaised: number, config: BondingCurveConfig = BONDING_CURVE_V4_CONFIG): boolean {
  return promptRaised >= config.GRADUATION_PROMPT_AMOUNT;
}

export function isBondingCurveCompleteV4(promptRaised: number): boolean {
  return isAgentGraduatedV4(promptRaised);
}

export function isAgentMigratingV4(promptRaised: number, tokenAddress?: string | null): boolean {
  return isAgentGraduatedV4(promptRaised) && !tokenAddress;
}