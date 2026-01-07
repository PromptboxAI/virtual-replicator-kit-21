// Hybrid Graduation System - Phase 3
export interface GraduationConfig {
  mode: 'database' | 'smart_contract';
  targetMarketCapUSD: number;
  promptUsdRate: number;
}

export const getGraduationThreshold = (config: GraduationConfig): number => {
  const { mode, targetMarketCapUSD, promptUsdRate } = config;

  if (mode === 'database') {
    // Test/Demo mode: Fixed amount, no USD dependency (test tokens only)
    return 42160; // 42,160 PROMPT (V7 threshold)
  } else {
    // Production mode: Dynamic USD-pegged targeting $50K-$75K
    // Target: $65,000 market cap at graduation (middle of $50K-$75K range)
    const TARGET_USD = targetMarketCapUSD || 65000;

    // Calculate PROMPT needed for target USD market cap
    const dynamicThreshold = TARGET_USD / promptUsdRate;

    // Apply bounds (50K-750K PROMPT to allow proper scaling)
    // Dynamically calculated based on live FX rate
    // At $1.00: 65K PROMPT = $65K (within 50K-75K range)
    return Math.max(50000, Math.min(750000, dynamicThreshold));
  }
};

// Default configuration
export const DEFAULT_GRADUATION_CONFIG: GraduationConfig = {
  mode: 'database', // Test mode by default
  targetMarketCapUSD: 65000, // $65K target (middle of $50K-$75K range)
  promptUsdRate: null // Must be fetched from live FX (no default)
};

// Examples:
// Database mode: Always 42,000 PROMPT (fixed test amount, no USD dependency)
// Smart contract mode: Dynamically calculated based on live FX rate and target USD market cap
// Smart contract mode at $1.00 PROMPT: 65,000 PROMPT = $65K
// Smart contract mode at $2.00 PROMPT: 50,000 PROMPT (min threshold = $100K)