// Hybrid Graduation System - Phase 3
export interface GraduationConfig {
  mode: 'database' | 'smart_contract';
  targetMarketCapUSD: number;
  promptUsdRate: number;
}

export const getGraduationThreshold = (config: GraduationConfig): number => {
  const { mode, targetMarketCapUSD, promptUsdRate } = config;

  if (mode === 'database') {
    // Test mode: Fixed reasonable threshold
    return 42000; // 42K PROMPT for testing
  } else {
    // Production mode: Dynamic USD-pegged
    // Target: $75,000 market cap at graduation
    const TARGET_USD = targetMarketCapUSD || 75000;

    // Calculate PROMPT needed for target USD market cap
    const dynamicThreshold = TARGET_USD / promptUsdRate;

    // Apply bounds (never below 25K or above 200K PROMPT)
    return Math.max(25000, Math.min(200000, dynamicThreshold));
  }
};

// Default configuration
export const DEFAULT_GRADUATION_CONFIG: GraduationConfig = {
  mode: 'database', // Test mode by default
  targetMarketCapUSD: 75000, // $75K target
  promptUsdRate: 0.10 // $0.10 per PROMPT
};

// Examples:
// Database mode: Always 42,000 PROMPT
// Smart contract mode at $0.10 PROMPT: 750,000 PROMPT (capped at 200K)
// Smart contract mode at $0.50 PROMPT: 150,000 PROMPT
// Smart contract mode at $2.00 PROMPT: 37,500 PROMPT
// Smart contract mode at $5.00 PROMPT: 25,000 PROMPT (min threshold)