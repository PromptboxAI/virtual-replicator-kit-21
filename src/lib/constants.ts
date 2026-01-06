/**
 * V7 Bonding Curve Constants
 * 
 * Key changes from V6:
 * - P1: 0.0003 PROMPT (was 0.00024)
 * - Tradeable Cap: 248M (was 252M)
 * - Graduation Threshold: 42,160 PROMPT (was 42,000)
 * - Fee Split: 50/50 creator/platform (was 40/40/20)
 * - LP Allocation: 140M fixed
 */

export const V7_CONSTANTS = {
  // ============ Token Supply ============
  TOTAL_SUPPLY: 1_000_000_000,
  
  // ============ Allocations ============
  LP_ALLOCATION: 140_000_000,        // Fixed LP allocation
  TEAM_MILESTONE: 250_000_000,       // FDV-based unlocks ($2M->$80M)
  TEAM_VESTED: 200_000_000,          // 1yr cliff + 6mo vest
  ECOSYSTEM: 50_000_000,             // For PROMPT stakers
  VARIABLE_POOL: 360_000_000,        // Holder rewards pool
  TRADEABLE_CAP: 248_000_000,        // Max shares tradeable on curve
  
  // ============ Pricing ============
  DEFAULT_P0: 0.00004,               // Starting price (PROMPT per share)
  DEFAULT_P1: 0.0003,                // Ending price at cap
  
  // ============ Graduation ============
  GRADUATION_THRESHOLD: 42160,       // Exact threshold in PROMPT
  GRADUATION_THRESHOLD_UI: 42000,    // Rounded for UI display
  
  // ============ Trading Fees ============
  TRADING_FEE_BPS: 500,              // 5% total trading fee
  CREATOR_FEE_BPS: 5000,             // 50% of fee -> creator
  PLATFORM_FEE_BPS: 5000,            // 50% of fee -> platform vault
  BASIS_POINTS: 10000,
  
  // ============ Creation ============
  CREATION_FEE: 100,                 // 100 PROMPT to create agent
  
  // ============ LP Lock ============
  LP_LOCK_PERCENT: 95,               // 95% of LP locked
  LP_LOCK_DURATION_YEARS: 3,         // 3 year lock
  
  // ============ Vesting ============
  HOLDER_REWARD_PERCENT: 5,          // 5% of HELD goes to holders
  HOLDER_VEST_DAYS: 30,              // 30-day linear vest
  
  // ============ Team Milestone Thresholds ============
  MILESTONE_FDVS: [
    2_000_000,   // $2M FDV
    5_000_000,   // $5M FDV
    10_000_000,  // $10M FDV
    20_000_000,  // $20M FDV
    40_000_000,  // $40M FDV
    80_000_000,  // $80M FDV
  ],
  MILESTONE_UNLOCK_PERCENT: 16.67,   // Each milestone unlocks ~16.67%
  
  // ============ Decimals ============
  PROMPT_DECIMALS: 18,
  SHARE_DECIMALS: 18,
} as const;

// Type for V7 constants
export type V7ConstantsType = typeof V7_CONSTANTS;

// Helper function to get fee amounts
export function calculateV7Fees(tradeAmount: number): {
  totalFee: number;
  creatorFee: number;
  platformFee: number;
  netAmount: number;
} {
  const totalFee = tradeAmount * (V7_CONSTANTS.TRADING_FEE_BPS / V7_CONSTANTS.BASIS_POINTS);
  const creatorFee = totalFee * (V7_CONSTANTS.CREATOR_FEE_BPS / V7_CONSTANTS.BASIS_POINTS);
  const platformFee = totalFee * (V7_CONSTANTS.PLATFORM_FEE_BPS / V7_CONSTANTS.BASIS_POINTS);
  
  return {
    totalFee,
    creatorFee,
    platformFee,
    netAmount: tradeAmount - totalFee,
  };
}

// Export individual values for convenience
export const {
  TOTAL_SUPPLY,
  LP_ALLOCATION,
  TRADEABLE_CAP,
  DEFAULT_P0,
  DEFAULT_P1,
  GRADUATION_THRESHOLD,
  TRADING_FEE_BPS,
  CREATOR_FEE_BPS,
  PLATFORM_FEE_BPS,
  BASIS_POINTS,
  CREATION_FEE,
} = V7_CONSTANTS;
