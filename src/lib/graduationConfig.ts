// Hybrid Graduation System - Phase 3
export interface GraduationConfig {
  mode: 'database' | 'smart_contract';
  targetMarketCapUSD: number;
  promptUsdRate: number;
}

export const getGraduationThreshold = (config: GraduationConfig): number => {
  const { mode, targetMarketCapUSD, promptUsdRate } = config;

  if (mode === 'database') {
    // Test/Demo mode: Competitive with Pump.fun (~$15K)
    return 150000; // 150K PROMPT (~$15K at $0.10)
  } else {
    // Production mode: Dynamic USD-pegged targeting $50K-$75K
    // Target: $60,000 market cap at graduation (competitive middle ground)
    const TARGET_USD = targetMarketCapUSD || 60000;

    // Calculate PROMPT needed for target USD market cap
    const dynamicThreshold = TARGET_USD / promptUsdRate;

    // Apply bounds (100K-500K PROMPT = $10K-$50K at $0.10, scales with PROMPT price)
    return Math.max(100000, Math.min(500000, dynamicThreshold));
  }
};

// Default configuration
export const DEFAULT_GRADUATION_CONFIG: GraduationConfig = {
  mode: 'database', // Test mode by default
  targetMarketCapUSD: 60000, // $60K target (competitive middle ground)
  promptUsdRate: 0.10 // $0.10 per PROMPT
};

// Examples:
// Database mode: Always 150,000 PROMPT (~$15K competitive with Pump.fun)
// Smart contract mode at $0.10 PROMPT: 500,000 PROMPT (capped at 500K = $50K)
// Smart contract mode at $0.20 PROMPT: 300,000 PROMPT = $60K
// Smart contract mode at $0.50 PROMPT: 120,000 PROMPT = $60K  
// Smart contract mode at $1.00 PROMPT: 100,000 PROMPT (min threshold = $100K)
// Smart contract mode at $2.00 PROMPT: 100,000 PROMPT (min threshold = $200K)