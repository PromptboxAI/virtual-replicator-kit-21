/**
 * Bonding Curve V3 - Linear Model
 * Aligned with database functions and Virtuals.io specifications
 * Phase 3: Frontend Implementation
 */

// Database integration available for future enhancements

// V3 Configuration - matches database exactly
export const BONDING_CURVE_V3_CONFIG = {
  // Core parameters (aligned with database)
  CURVE_SUPPLY: 800_000_000, // 800M tokens on bonding curve
  LP_RESERVE: 200_000_000,   // 200M tokens for LP
  TOTAL_SUPPLY: 1_000_000_000, // 1B total supply
  
  // Linear pricing model
  P0: 0.000001, // Starting price (PROMPT per token)
  P1: 0.000104, // Ending price at graduation
  
  // Graduation & Economics
  GRADUATION_PROMPT_AMOUNT: 42000, // 42k PROMPT to graduate
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
const PRICE_SLOPE = (BONDING_CURVE_V3_CONFIG.P1 - BONDING_CURVE_V3_CONFIG.P0) / BONDING_CURVE_V3_CONFIG.CURVE_SUPPLY;

/**
 * Get current price using linear formula: P(S) = P0 + slope * S
 */
export function getCurrentPriceV3(tokensSold: number): number {
  const { P0 } = BONDING_CURVE_V3_CONFIG;
  return P0 + PRICE_SLOPE * Math.max(0, tokensSold);
}

/**
 * Calculate tokens sold from PROMPT raised (inverse integral)
 * Solves: P0*S + slope*S²/2 = promptRaised
 */
export function tokensSoldFromPromptRaisedV3(promptRaised: number): number {
  const { P0 } = BONDING_CURVE_V3_CONFIG;
  
  if (promptRaised <= 0) return 0;
  
  const a = PRICE_SLOPE / 2;
  const b = P0;
  const c = -promptRaised;
  
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return 0;
  
  const tokensSold = (-b + Math.sqrt(discriminant)) / (2 * a);
  return Math.max(0, Math.min(tokensSold, BONDING_CURVE_V3_CONFIG.CURVE_SUPPLY));
}

/**
 * Calculate PROMPT raised from tokens sold (integral)
 */
export function promptRaisedFromTokensSoldV3(tokensSold: number): number {
  const { P0 } = BONDING_CURVE_V3_CONFIG;
  const clampedSupply = Math.max(0, Math.min(tokensSold, BONDING_CURVE_V3_CONFIG.CURVE_SUPPLY));
  return P0 * clampedSupply + PRICE_SLOPE * clampedSupply * clampedSupply / 2;
}

/**
 * Calculate buy cost with enhanced precision and safety checks
 */
export function calculateBuyCostV3(currentTokensSold: number, tokenAmount: number): {
  cost: number;
  averagePrice: number;
  newTokensSold: number;
  priceImpact: number;
  slippage: number;
  isHighImpact: boolean;
  maxPurchasable: number;
} {
  const { P0, CURVE_SUPPLY, MAX_PRICE_IMPACT_WARNING } = BONDING_CURVE_V3_CONFIG;
  
  const maxPurchasable = CURVE_SUPPLY - currentTokensSold;
  const actualTokenAmount = Math.min(tokenAmount, maxPurchasable);
  
  if (actualTokenAmount <= 0) {
    return {
      cost: 0,
      averagePrice: 0,
      newTokensSold: currentTokensSold,
      priceImpact: 0,
      slippage: 0,
      isHighImpact: false,
      maxPurchasable
    };
  }
  
  const newTokensSold = currentTokensSold + actualTokenAmount;
  
  // Calculate cost using linear integral
  const cost = P0 * actualTokenAmount + 
    PRICE_SLOPE * (newTokensSold * newTokensSold - currentTokensSold * currentTokensSold) / 2;
  
  const averagePrice = cost / actualTokenAmount;
  
  // Price impact & slippage calculations
  const currentPrice = getCurrentPriceV3(currentTokensSold);
  const newPrice = getCurrentPriceV3(newTokensSold);
  const priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;
  const slippage = ((averagePrice - currentPrice) / currentPrice) * 100;
  const isHighImpact = priceImpact > MAX_PRICE_IMPACT_WARNING;
  
  return {
    cost,
    averagePrice,
    newTokensSold,
    priceImpact,
    slippage,
    isHighImpact,
    maxPurchasable
  };
}

/**
 * Calculate sell return with enhanced precision
 */
export function calculateSellReturnV3(currentTokensSold: number, tokenAmount: number): {
  return: number;
  averagePrice: number;
  newTokensSold: number;
  priceImpact: number;
  slippage: number;
  isHighImpact: boolean;
} {
  const { P0, MAX_PRICE_IMPACT_WARNING } = BONDING_CURVE_V3_CONFIG;
  
  const actualTokenAmount = Math.min(tokenAmount, currentTokensSold);
  
  if (actualTokenAmount <= 0) {
    return {
      return: 0,
      averagePrice: 0,
      newTokensSold: currentTokensSold,
      priceImpact: 0,
      slippage: 0,
      isHighImpact: false
    };
  }
  
  const newTokensSold = currentTokensSold - actualTokenAmount;
  
  // Calculate return using linear integral
  const returnAmount = P0 * actualTokenAmount + 
    PRICE_SLOPE * (currentTokensSold * currentTokensSold - newTokensSold * newTokensSold) / 2;
  
  const averagePrice = returnAmount / actualTokenAmount;
  
  // Price impact & slippage calculations
  const currentPrice = getCurrentPriceV3(currentTokensSold);
  const newPrice = getCurrentPriceV3(newTokensSold);
  const priceImpact = ((currentPrice - newPrice) / currentPrice) * 100;
  const slippage = ((currentPrice - averagePrice) / currentPrice) * 100;
  const isHighImpact = priceImpact > MAX_PRICE_IMPACT_WARNING;
  
  return {
    return: returnAmount,
    averagePrice,
    newTokensSold,
    priceImpact,
    slippage,
    isHighImpact
  };
}

/**
 * Enhanced graduation progress with countdown features
 */
export function calculateGraduationProgressV3(currentPromptRaised: number): {
  progress: number;
  remaining: number;
  isGraduated: boolean;
  isNearGraduation: boolean;
  estimatedTokensToGraduation: number;
  progressDisplay: string;
  countdownMessage: string;
} {
  const { GRADUATION_PROMPT_AMOUNT, GRADUATION_WARNING_THRESHOLD } = BONDING_CURVE_V3_CONFIG;
  
  const progress = Math.min((currentPromptRaised / GRADUATION_PROMPT_AMOUNT) * 100, 100);
  const remaining = Math.max(GRADUATION_PROMPT_AMOUNT - currentPromptRaised, 0);
  const isGraduated = currentPromptRaised >= GRADUATION_PROMPT_AMOUNT;
  const isNearGraduation = progress >= (GRADUATION_WARNING_THRESHOLD * 100);
  
  // Calculate tokens needed to reach graduation
  const currentTokensSold = tokensSoldFromPromptRaisedV3(currentPromptRaised);
  const graduationTokensSold = tokensSoldFromPromptRaisedV3(GRADUATION_PROMPT_AMOUNT);
  const estimatedTokensToGraduation = Math.max(0, graduationTokensSold - currentTokensSold);
  
  // Progress display formatting
  const progressDisplay = `${progress.toFixed(1)}%`;
  
  // Countdown message
  let countdownMessage = '';
  if (isGraduated) {
    countdownMessage = '🎓 Graduated! Ready for DEX launch';
  } else if (remaining < 100) {
    countdownMessage = `⚡ ${remaining.toFixed(1)} PROMPT to DEX launch`;
  } else if (remaining < 1000) {
    countdownMessage = `🚀 ${remaining.toFixed(0)} PROMPT remaining to graduate`;
  } else {
    countdownMessage = `📈 ${(remaining / 1000).toFixed(1)}k PROMPT to graduation`;
  }
  
  return {
    progress,
    remaining,
    isGraduated,
    isNearGraduation,
    estimatedTokensToGraduation,
    progressDisplay,
    countdownMessage
  };
}

/**
 * Calculate tokens purchasable with PROMPT amount
 */
export function calculateTokensFromPromptV3(currentTokensSold: number, promptAmount: number): {
  tokenAmount: number;
  remainingPrompt: number;
  newTokensSold: number;
  wouldTriggerGraduation: boolean;
  graduationPromptNeeded: number;
} {
  const { CURVE_SUPPLY, GRADUATION_PROMPT_AMOUNT } = BONDING_CURVE_V3_CONFIG;
  
  const maxPurchasable = CURVE_SUPPLY - currentTokensSold;
  const currentPromptRaised = promptRaisedFromTokensSoldV3(currentTokensSold);
  const graduationPromptNeeded = Math.max(0, GRADUATION_PROMPT_AMOUNT - currentPromptRaised);
  
  if (maxPurchasable <= 0 || promptAmount <= 0) {
    return {
      tokenAmount: 0,
      remainingPrompt: promptAmount,
      newTokensSold: currentTokensSold,
      wouldTriggerGraduation: false,
      graduationPromptNeeded
    };
  }
  
  // Use quadratic formula to solve for token amount
  const a = PRICE_SLOPE / 2;
  const b = BONDING_CURVE_V3_CONFIG.P0 + PRICE_SLOPE * currentTokensSold;
  const c = -promptAmount;
  
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return {
      tokenAmount: 0,
      remainingPrompt: promptAmount,
      newTokensSold: currentTokensSold,
      wouldTriggerGraduation: false,
      graduationPromptNeeded
    };
  }
  
  const tokenAmount = Math.floor((-b + Math.sqrt(discriminant)) / (2 * a));
  const clampedTokenAmount = Math.min(tokenAmount, maxPurchasable);
  
  const newTokensSold = currentTokensSold + clampedTokenAmount;
  const newPromptRaised = promptRaisedFromTokensSoldV3(newTokensSold);
  const wouldTriggerGraduation = newPromptRaised >= GRADUATION_PROMPT_AMOUNT;
  
  // Calculate actual cost and remaining
  const actualCost = calculateBuyCostV3(currentTokensSold, clampedTokenAmount).cost;
  const remainingPrompt = Math.max(0, promptAmount - actualCost);
  
  return {
    tokenAmount: clampedTokenAmount,
    remainingPrompt,
    newTokensSold,
    wouldTriggerGraduation,
    graduationPromptNeeded: Math.max(0, graduationPromptNeeded - promptAmount)
  };
}

/**
 * Enhanced LP creation calculation
 */
export function calculateLPCreationV3(finalPromptRaised: number): {
  lpPromptAmount: number;
  lpTokenAmount: number;
  platformKeepAmount: number;
  lpTokensGenerated: number;
  lockDurationYears: number;
} {
  const { LP_RESERVE, LP_PROMPT_PERCENTAGE, PLATFORM_KEEP_PERCENTAGE, LIQUIDITY_LOCK_YEARS } = BONDING_CURVE_V3_CONFIG;
  
  const lpPromptAmount = finalPromptRaised * LP_PROMPT_PERCENTAGE;
  const platformKeepAmount = finalPromptRaised * PLATFORM_KEEP_PERCENTAGE;
  const lpTokenAmount = LP_RESERVE;
  
  // Estimate LP tokens (simplified - actual depends on DEX)
  const lpTokensGenerated = Math.sqrt(lpPromptAmount * lpTokenAmount);
  
  return {
    lpPromptAmount,
    lpTokenAmount,
    platformKeepAmount,
    lpTokensGenerated,
    lockDurationYears: LIQUIDITY_LOCK_YEARS
  };
}

/**
 * Enhanced fee calculation with breakdown
 */
export function calculateFeesV3(amount: number, transactionType: 'buy' | 'sell'): {
  totalFees: number;
  agentRevenue: number;
  platformRevenue: number;
  netAmount: number;
  feePercentage: number;
  feeBreakdown: {
    agentPercentage: number;
    platformPercentage: number;
  };
} {
  const { AGENT_REVENUE_PERCENTAGE, PLATFORM_REVENUE_PERCENTAGE, TRADING_FEE_PERCENTAGE } = BONDING_CURVE_V3_CONFIG;
  
  const agentRevenue = amount * AGENT_REVENUE_PERCENTAGE;
  const platformRevenue = amount * PLATFORM_REVENUE_PERCENTAGE;
  const totalFees = agentRevenue + platformRevenue;
  
  const netAmount = transactionType === 'buy' 
    ? amount + totalFees
    : amount - totalFees;
  
  return {
    totalFees,
    agentRevenue,
    platformRevenue,
    netAmount,
    feePercentage: TRADING_FEE_PERCENTAGE * 100,
    feeBreakdown: {
      agentPercentage: (AGENT_REVENUE_PERCENTAGE * 100),
      platformPercentage: (PLATFORM_REVENUE_PERCENTAGE * 100)
    }
  };
}

/**
 * Enhanced formatting functions
 */
export function formatTokenAmountV3(amount: number, decimals: number = 2): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(decimals)}B`;
  } else if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(decimals)}M`;
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(decimals)}K`;
  }
  return amount.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function formatPriceV3(price: number): string {
  if (price === 0) return '0';
  if (price < 0.000001) {
    return price.toFixed(10).replace(/\.?0+$/, '');
  }
  if (price < 0.01) {
    return price.toFixed(8).replace(/\.?0+$/, '');
  }
  return price.toFixed(6);
}

export function formatPromptAmountV3(amount: number, showSymbol: boolean = true): string {
  const formatted = amount.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: amount < 1 ? 3 : amount < 100 ? 2 : 0
  });
  return showSymbol ? `${formatted} PROMPT` : formatted;
}

/**
 * Safety and validation functions
 */
export function validateTradeAmountV3(
  tokenAmount: number, 
  promptAmount: number, 
  currentTokensSold: number,
  tradeType: 'buy' | 'sell'
): {
  isValid: boolean;
  errorMessage?: string;
  warningMessage?: string;
  suggestions?: string[];
} {
  const { CURVE_SUPPLY, HIGH_SLIPPAGE_THRESHOLD } = BONDING_CURVE_V3_CONFIG;
  
  if (tradeType === 'buy') {
    const maxPurchasable = CURVE_SUPPLY - currentTokensSold;
    
    if (tokenAmount > maxPurchasable) {
      return {
        isValid: false,
        errorMessage: `Cannot buy ${formatTokenAmountV3(tokenAmount)} tokens. Maximum available: ${formatTokenAmountV3(maxPurchasable)}`,
        suggestions: [`Try buying ${formatTokenAmountV3(maxPurchasable)} tokens instead`]
      };
    }
    
    const { priceImpact, isHighImpact } = calculateBuyCostV3(currentTokensSold, tokenAmount);
    
    if (isHighImpact) {
      return {
        isValid: true,
        warningMessage: `High price impact: ${priceImpact.toFixed(2)}%. Your trade will significantly affect the token price.`,
        suggestions: [
          'Consider splitting your purchase into smaller trades',
          'Wait for more liquidity to develop'
        ]
      };
    }
    
    if (priceImpact > HIGH_SLIPPAGE_THRESHOLD) {
      return {
        isValid: true,
        warningMessage: `Moderate slippage: ${priceImpact.toFixed(2)}%. You may receive fewer tokens than expected.`
      };
    }
  } else {
    if (tokenAmount > currentTokensSold) {
      return {
        isValid: false,
        errorMessage: `Cannot sell ${formatTokenAmountV3(tokenAmount)} tokens. Maximum available: ${formatTokenAmountV3(currentTokensSold)}`
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Market statistics and analytics
 */
export function calculateMarketStatsV3(currentPromptRaised: number): {
  currentPrice: number;
  tokensSold: number;
  marketCap: number;
  totalVolume: number;
  graduationProgress: number;
  priceIncrease24h?: number;
  volumeIncrease24h?: number;
} {
  const tokensSold = tokensSoldFromPromptRaisedV3(currentPromptRaised);
  const currentPrice = getCurrentPriceV3(tokensSold);
  const marketCap = BONDING_CURVE_V3_CONFIG.TOTAL_SUPPLY * currentPrice;
  const { progress } = calculateGraduationProgressV3(currentPromptRaised);
  
  return {
    currentPrice,
    tokensSold,
    marketCap,
    totalVolume: currentPromptRaised, // Total PROMPT raised = total volume
    graduationProgress: progress,
    // TODO: Add 24h metrics when historical data is available
  };
}

// Legacy compatibility functions
export const isAgentGraduatedV3 = (promptRaised: number): boolean => 
  promptRaised >= BONDING_CURVE_V3_CONFIG.GRADUATION_PROMPT_AMOUNT;

export const isBondingCurveCompleteV3 = (promptRaised: number): boolean => 
  promptRaised >= BONDING_CURVE_V3_CONFIG.GRADUATION_PROMPT_AMOUNT;

export const isAgentMigratingV3 = (promptRaised: number, tokenAddress?: string | null): boolean => 
  isAgentGraduatedV3(promptRaised) && !Boolean(tokenAddress);