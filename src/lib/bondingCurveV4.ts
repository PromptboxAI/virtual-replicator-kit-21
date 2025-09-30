/**
 * Bonding Curve V4 - Corrected Linear Model
 * Fixes 100x token issue with proper pricing parameters
 * Phase 6: Critical Fix Implementation
 */

// V4 Configuration - CORRECTED parameters to fix token pricing
export const BONDING_CURVE_V4_CONFIG = {
  // Core parameters (corrected for proper pricing)
  CURVE_SUPPLY: 800_000_000, // 800M tokens on bonding curve
  LP_RESERVE: 200_000_000,   // 200M tokens for LP
  TOTAL_SUPPLY: 1_000_000_000, // 1B total supply
  
  // CORRECTED Linear pricing model
  P0: 0.0000075, // Starting price (PROMPT per token) - 7.5x higher than V3
  P1: 0.00075,   // Ending price at graduation - ~7.2x higher than V3
  
  // CORRECTED Graduation & Economics - Now uses dynamic graduation config
  GRADUATION_PROMPT_AMOUNT: 42000, // Default 42K PROMPT (test mode fixed amount)
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
} as const;

// Derived constants
const PRICE_SLOPE = (BONDING_CURVE_V4_CONFIG.P1 - BONDING_CURVE_V4_CONFIG.P0) / BONDING_CURVE_V4_CONFIG.CURVE_SUPPLY;

/**
 * Get current price using linear formula: P(S) = P0 + slope * S
 */
export function getCurrentPriceV4(tokensSold: number): number {
  const { P0, P1, CURVE_SUPPLY } = BONDING_CURVE_V4_CONFIG;
  
  if (tokensSold <= 0) return P0;
  if (tokensSold >= CURVE_SUPPLY) return P1;
  
  return P0 + (PRICE_SLOPE * tokensSold);
}

/**
 * Calculate tokens sold from PROMPT raised using quadratic formula
 * For linear curve: prompt_raised = integral of price from 0 to s
 * prompt_raised = p0*s + 0.5*slope*s^2
 * Solve: 0.5*slope*s^2 + p0*s - prompt_raised = 0
 */
export function tokensSoldFromPromptRaisedV4(promptRaised: number): number {
  const { P0, CURVE_SUPPLY } = BONDING_CURVE_V4_CONFIG;
  
  if (promptRaised <= 0) return 0;
  
  // For very small slope, use simple division
  if (Math.abs(PRICE_SLOPE) < 1e-15) {
    return Math.min(promptRaised / P0, CURVE_SUPPLY);
  }
  
  // Quadratic formula: ax² + bx + c = 0
  const a = PRICE_SLOPE / 2;
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
export function promptRaisedFromTokensSoldV4(tokensSold: number): number {
  const { P0, CURVE_SUPPLY } = BONDING_CURVE_V4_CONFIG;
  
  if (tokensSold <= 0) return 0;
  
  const s = Math.min(tokensSold, CURVE_SUPPLY);
  return P0 * s + (PRICE_SLOPE * s * s) / 2;
}

/**
 * Get price directly from PROMPT raised
 */
export function getPriceFromPromptV4(promptRaised: number): number {
  const tokensSold = tokensSoldFromPromptRaisedV4(promptRaised);
  return getCurrentPriceV4(tokensSold);
}

/**
 * Calculate buy cost and metrics
 */
export function calculateBuyCostV4(
  currentTokensSold: number,
  tokenAmount: number,
  includeFees: boolean = true
): {
  cost: number;
  averagePrice: number;
  newTokensSold: number;
  priceImpact: number;
  newPrice: number;
  slippage: number;
} {
  const { CURVE_SUPPLY, TRADING_FEE_PERCENTAGE } = BONDING_CURVE_V4_CONFIG;
  
  if (tokenAmount <= 0) {
    const currentPrice = getCurrentPriceV4(currentTokensSold);
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
  
  const startPromptRaised = promptRaisedFromTokensSoldV4(startTokensSold);
  const endPromptRaised = promptRaisedFromTokensSoldV4(endTokensSold);
  
  let cost = endPromptRaised - startPromptRaised;
  
  if (includeFees) {
    cost = cost / (1 - TRADING_FEE_PERCENTAGE);
  }
  
  const currentPrice = getCurrentPriceV4(startTokensSold);
  const newPrice = getCurrentPriceV4(endTokensSold);
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
  includeFees: boolean = true
): {
  return: number;
  averagePrice: number;
  newTokensSold: number;
  priceImpact: number;
  newPrice: number;
  slippage: number;
} {
  const { TRADING_FEE_PERCENTAGE } = BONDING_CURVE_V4_CONFIG;
  
  if (tokenAmount <= 0) {
    const currentPrice = getCurrentPriceV4(currentTokensSold);
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
  
  const startPromptRaised = promptRaisedFromTokensSoldV4(startTokensSold);
  const endPromptRaised = promptRaisedFromTokensSoldV4(endTokensSold);
  
  let returnAmount = startPromptRaised - endPromptRaised;
  
  if (includeFees) {
    returnAmount = returnAmount * (1 - TRADING_FEE_PERCENTAGE);
  }
  
  const currentPrice = getCurrentPriceV4(startTokensSold);
  const newPrice = getCurrentPriceV4(endTokensSold);
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
  includeFees: boolean = true
): {
  tokenAmount: number;
  remainingPrompt: number;
  newTokensSold: number;
  averagePrice: number;
  newPrice: number;
  priceImpact: number;
} {
  const { CURVE_SUPPLY, TRADING_FEE_PERCENTAGE } = BONDING_CURVE_V4_CONFIG;
  
  if (promptAmount <= 0) {
    const currentPrice = getCurrentPriceV4(currentTokensSold);
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
  const startPromptRaised = promptRaisedFromTokensSoldV4(startTokensSold);
  const targetPromptRaised = startPromptRaised + availablePrompt;
  
  const maxPromptRaised = promptRaisedFromTokensSoldV4(CURVE_SUPPLY);
  const actualTargetPrompt = Math.min(targetPromptRaised, maxPromptRaised);
  
  const endTokensSold = tokensSoldFromPromptRaisedV4(actualTargetPrompt);
  const tokenAmount = endTokensSold - startTokensSold;
  
  const actualPromptUsed = actualTargetPrompt - startPromptRaised;
  const actualPromptPaid = includeFees ? actualPromptUsed / (1 - TRADING_FEE_PERCENTAGE) : actualPromptUsed;
  const remainingPrompt = promptAmount - actualPromptPaid;
  
  const currentPrice = getCurrentPriceV4(startTokensSold);
  const newPrice = getCurrentPriceV4(endTokensSold);
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
export function calculateGraduationProgressV4(currentPromptRaised: number): {
  progress: number;
  remaining: number;
  isGraduated: boolean;
  isNearGraduation: boolean;
  progressDisplay: string;
  countdownMessage: string;
} {
  const { GRADUATION_PROMPT_AMOUNT, GRADUATION_WARNING_THRESHOLD } = BONDING_CURVE_V4_CONFIG;
  
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
  transactionType: 'buy' | 'sell'
): {
  totalFees: number;
  agentRevenue: number;
  platformRevenue: number;
  netAmount: number;
} {
  const { TRADING_FEE_PERCENTAGE, AGENT_REVENUE_PERCENTAGE, PLATFORM_REVENUE_PERCENTAGE } = BONDING_CURVE_V4_CONFIG;
  
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
export function calculateLPCreationV4(finalPromptRaised: number): {
  lpPromptAmount: number;
  lpTokenAmount: number;
  platformKeepAmount: number;
  totalValue: number;
} {
  const { LP_PROMPT_PERCENTAGE, PLATFORM_KEEP_PERCENTAGE, LP_RESERVE } = BONDING_CURVE_V4_CONFIG;
  
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
export function calculateMarketStatsV4(currentPromptRaised: number): {
  currentPrice: number;
  marketCap: number;
  totalVolume: number;
  tokensSold: number;
  liquidityDepth: number;
} {
  const { TOTAL_SUPPLY } = BONDING_CURVE_V4_CONFIG;
  
  const tokensSold = tokensSoldFromPromptRaisedV4(currentPromptRaised);
  const currentPrice = getCurrentPriceV4(tokensSold);
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
  currentPromptRaised: number
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const { MAX_PRICE_IMPACT_WARNING, HIGH_SLIPPAGE_THRESHOLD, GRADUATION_PROMPT_AMOUNT } = BONDING_CURVE_V4_CONFIG;
  
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
    const currentTokensSold = tokensSoldFromPromptRaisedV4(currentPromptRaised);
    const result = calculateTokensFromPromptV4(currentTokensSold, promptAmount);
    
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
export function isAgentGraduatedV4(promptRaised: number): boolean {
  return promptRaised >= BONDING_CURVE_V4_CONFIG.GRADUATION_PROMPT_AMOUNT;
}

export function isBondingCurveCompleteV4(promptRaised: number): boolean {
  return isAgentGraduatedV4(promptRaised);
}

export function isAgentMigratingV4(promptRaised: number, tokenAddress?: string | null): boolean {
  return isAgentGraduatedV4(promptRaised) && !tokenAddress;
}