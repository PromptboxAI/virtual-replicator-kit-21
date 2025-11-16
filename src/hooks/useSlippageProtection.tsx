import { useState, useCallback } from 'react';
import Big from 'big.js';

export interface SlippageConfig {
  maxSlippagePercent: number; // e.g., 5 for 5%
  minReceived?: string; // Minimum tokens to receive
  enabled: boolean;
}

export interface SlippageResult {
  protected: boolean;
  maxSlippage: number;
  estimatedReceived: string;
  minReceived: string;
  priceImpact: string;
}

/**
 * Hook for managing slippage protection in trades
 * Prevents trades from executing if slippage exceeds threshold
 */
export function useSlippageProtection() {
  const [config, setConfig] = useState<SlippageConfig>({
    maxSlippagePercent: 5, // 5% default
    enabled: true
  });

  const calculateSlippage = useCallback((
    expectedPrice: string,
    actualPrice: string,
    amount: string
  ): SlippageResult => {
    try {
      const expected = Big(expectedPrice);
      const actual = Big(actualPrice);
      const amountBig = Big(amount);

      // Calculate price impact
      const priceDiff = actual.minus(expected).abs();
      const priceImpact = priceDiff.div(expected).times(100);

      // Calculate estimated and minimum received
      const estimatedReceived = amountBig.div(expected);
      const minReceived = estimatedReceived.times(
        Big(1).minus(Big(config.maxSlippagePercent).div(100))
      );

      return {
        protected: config.enabled && priceImpact.gt(config.maxSlippagePercent),
        maxSlippage: config.maxSlippagePercent,
        estimatedReceived: estimatedReceived.toFixed(8),
        minReceived: minReceived.toFixed(8),
        priceImpact: priceImpact.toFixed(2)
      };
    } catch (error) {
      console.error('Slippage calculation error:', error);
      return {
        protected: false,
        maxSlippage: config.maxSlippagePercent,
        estimatedReceived: '0',
        minReceived: '0',
        priceImpact: '0'
      };
    }
  }, [config]);

  const validateTrade = useCallback((
    slippage: SlippageResult
  ): { valid: boolean; reason?: string } => {
    if (!config.enabled) {
      return { valid: true };
    }

    if (Big(slippage.priceImpact).gt(config.maxSlippagePercent)) {
      return {
        valid: false,
        reason: `Price impact (${slippage.priceImpact}%) exceeds maximum slippage (${config.maxSlippagePercent}%)`
      };
    }

    if (config.minReceived && Big(slippage.estimatedReceived).lt(config.minReceived)) {
      return {
        valid: false,
        reason: `Estimated received (${slippage.estimatedReceived}) below minimum (${config.minReceived})`
      };
    }

    return { valid: true };
  }, [config]);

  return {
    config,
    setConfig,
    calculateSlippage,
    validateTrade
  };
}
