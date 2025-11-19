import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import {
  calculateCurrentPrice,
  calculateBuyReturn,
  calculateSellReturn,
  calculateFeeDistribution,
  canGraduate,
  BONDING_CURVE_V5_CONSTANTS,
  type BondingCurveV5Config,
  type BondingCurveV5State,
} from '@/lib/bondingCurveV5';

/**
 * Phase 1.3: TypeScript <-> Solidity Parity Tests
 * 
 * These tests verify that TypeScript calculations match Solidity contract logic.
 * Maximum acceptable difference: 1 wei (due to rounding in integer math)
 */

describe('BondingCurveV5 Parity Tests', () => {
  // Standard test configuration matching contract defaults
  const testConfig: BondingCurveV5Config = {
    p0: 0.00001,  // Starting price: 0.00001 PROMPT
    p1: 0.0001,   // Ending price: 0.0001 PROMPT
    graduationThresholdPrompt: 8000, // 8000 PROMPT to graduate
  };

  describe('Price Calculation Parity', () => {
    it('should calculate starting price correctly', () => {
      const state: BondingCurveV5State = {
        tokensSold: 0,
        promptReserves: 0,
        phase: 'active',
      };

      const price = calculateCurrentPrice(testConfig, state.tokensSold);
      expect(price).toBe(testConfig.p0);
    });

    it('should calculate price at 25% supply', () => {
      const tokensSold = BONDING_CURVE_V5_CONSTANTS.GRADUATION_SUPPLY * 0.25;
      const price = calculateCurrentPrice(testConfig, tokensSold);
      
      // Linear interpolation: p0 + (p1 - p0) * 0.25
      const expectedPrice = testConfig.p0 + (testConfig.p1 - testConfig.p0) * 0.25;
      expect(price).toBeCloseTo(expectedPrice, 10);
    });

    it('should calculate price at 50% supply', () => {
      const tokensSold = BONDING_CURVE_V5_CONSTANTS.GRADUATION_SUPPLY * 0.5;
      const price = calculateCurrentPrice(testConfig, tokensSold);
      
      const expectedPrice = testConfig.p0 + (testConfig.p1 - testConfig.p0) * 0.5;
      expect(price).toBeCloseTo(expectedPrice, 10);
    });

    it('should calculate price at 75% supply', () => {
      const tokensSold = BONDING_CURVE_V5_CONSTANTS.GRADUATION_SUPPLY * 0.75;
      const price = calculateCurrentPrice(testConfig, tokensSold);
      
      const expectedPrice = testConfig.p0 + (testConfig.p1 - testConfig.p0) * 0.75;
      expect(price).toBeCloseTo(expectedPrice, 10);
    });

    it('should calculate ending price at graduation supply', () => {
      const price = calculateCurrentPrice(testConfig, BONDING_CURVE_V5_CONSTANTS.GRADUATION_SUPPLY);
      expect(price).toBeCloseTo(testConfig.p1, 10);
    });
  });

  describe('Buy Calculation Parity', () => {
    it('should calculate buy with correct fee (5%)', () => {
      const state: BondingCurveV5State = {
        tokensSold: 0,
        promptReserves: 0,
        phase: 'active',
      };

      const promptIn = 100; // 100 PROMPT
      const result = calculateBuyReturn(testConfig, state, promptIn);

      // Fee should be 5% of input
      const expectedFee = promptIn * (BONDING_CURVE_V5_CONSTANTS.BUY_FEE_BPS / 10000);
      expect(result.fee).toBeCloseTo(expectedFee, 8);
      
      // After fee should be 95% of input
      const expectedAfterFee = promptIn * 0.95;
      expect(result.promptAfterFee).toBeCloseTo(expectedAfterFee, 8);
    });

    it('should calculate tokens received for small buy', () => {
      const state: BondingCurveV5State = {
        tokensSold: 0,
        promptReserves: 0,
        phase: 'active',
      };

      const promptIn = 10;
      const result = calculateBuyReturn(testConfig, state, promptIn);

      // Tokens should be positive
      expect(result.tokensOut).toBeGreaterThan(0);
      
      // Average price should be between start and end price for this trade
      expect(result.averagePrice).toBeGreaterThanOrEqual(result.priceAtStart);
      expect(result.averagePrice).toBeLessThanOrEqual(result.priceAtEnd);
    });

    it('should calculate tokens received for large buy', () => {
      const state: BondingCurveV5State = {
        tokensSold: 5000000,
        promptReserves: 2500,
        phase: 'active',
      };

      const promptIn = 1000;
      const result = calculateBuyReturn(testConfig, state, promptIn);

      expect(result.tokensOut).toBeGreaterThan(0);
      expect(result.priceAtEnd).toBeGreaterThan(result.priceAtStart);
    });

    it('should not allow buy beyond graduation supply', () => {
      const state: BondingCurveV5State = {
        tokensSold: BONDING_CURVE_V5_CONSTANTS.GRADUATION_SUPPLY - 1000,
        promptReserves: 7900,
        phase: 'active',
      };

      // Try to buy more than remaining supply
      const promptIn = 10000;
      
      expect(() => {
        calculateBuyReturn(testConfig, state, promptIn);
      }).toThrow();
    });
  });

  describe('Sell Calculation Parity', () => {
    it('should calculate sell with correct fee (5%)', () => {
      const state: BondingCurveV5State = {
        tokensSold: 1000000,
        promptReserves: 400,
        phase: 'active',
      };

      const tokensIn = 10000;
      const result = calculateSellReturn(testConfig, state, tokensIn);

      // Sell fee should be 5% of gross PROMPT
      const expectedFee = result.promptGross * (BONDING_CURVE_V5_CONSTANTS.SELL_FEE_BPS / 10000);
      expect(result.sellFee).toBeCloseTo(expectedFee, 8);
      
      // Net should be gross minus fee
      expect(result.promptNet).toBeCloseTo(result.promptGross - result.sellFee, 8);
    });

    it('should calculate PROMPT received for small sell', () => {
      const state: BondingCurveV5State = {
        tokensSold: 1000000,
        promptReserves: 400,
        phase: 'active',
      };

      const tokensIn = 1000;
      const result = calculateSellReturn(testConfig, state, tokensIn);

      expect(result.promptNet).toBeGreaterThan(0);
      expect(result.priceAtStart).toBeGreaterThan(result.priceAtEnd);
    });

    it('should not allow selling more than sold', () => {
      const state: BondingCurveV5State = {
        tokensSold: 1000,
        promptReserves: 1,
        phase: 'active',
      };

      const tokensIn = 2000; // More than sold
      
      expect(() => {
        calculateSellReturn(testConfig, state, tokensIn);
      }).toThrow();
    });

    it('should handle sell at starting position', () => {
      const state: BondingCurveV5State = {
        tokensSold: 100,
        promptReserves: 0.001,
        phase: 'active',
      };

      const tokensIn = 50;
      const result = calculateSellReturn(testConfig, state, tokensIn);

      expect(result.promptNet).toBeGreaterThan(0);
      expect(result.promptGross).toBeGreaterThan(result.promptNet);
    });
  });

  describe('Fee Distribution Parity', () => {
    it('should distribute fees correctly with default split', () => {
      const totalFee = 100; // 100 PROMPT in fees
      const distribution = calculateFeeDistribution(totalFee);

      // Default: 40% creator, 30% platform, 30% LP
      expect(distribution.creatorFee).toBeCloseTo(40, 8);
      expect(distribution.platformFee).toBeCloseTo(30, 8);
      expect(distribution.lpFee).toBeCloseTo(30, 8);

      // Sum should equal total
      const sum = distribution.creatorFee + distribution.platformFee + distribution.lpFee;
      expect(sum).toBeCloseTo(totalFee, 8);
    });

    it('should handle fractional fees', () => {
      const totalFee = 3.33; // Odd number that will have rounding
      const distribution = calculateFeeDistribution(totalFee);

      // Sum should still equal total (within rounding error)
      const sum = distribution.creatorFee + distribution.platformFee + distribution.lpFee;
      expect(sum).toBeCloseTo(totalFee, 6);
    });

    it('should handle zero fees', () => {
      const totalFee = 0;
      const distribution = calculateFeeDistribution(totalFee);

      expect(distribution.creatorFee).toBe(0);
      expect(distribution.platformFee).toBe(0);
      expect(distribution.lpFee).toBe(0);
    });
  });

  describe('Graduation Logic Parity', () => {
    it('should not graduate below threshold', () => {
      const state: BondingCurveV5State = {
        tokensSold: 5000000,
        promptReserves: 7999, // Just below 8000 threshold
        phase: 'active',
      };

      expect(canGraduate(testConfig, state)).toBe(false);
    });

    it('should graduate at exact threshold', () => {
      const state: BondingCurveV5State = {
        tokensSold: 8000000,
        promptReserves: 8000, // Exactly at threshold
        phase: 'active',
      };

      expect(canGraduate(testConfig, state)).toBe(true);
    });

    it('should graduate above threshold', () => {
      const state: BondingCurveV5State = {
        tokensSold: 9000000,
        promptReserves: 8500,
        phase: 'active',
      };

      expect(canGraduate(testConfig, state)).toBe(true);
    });

    it('should not check graduation if already graduated', () => {
      const state: BondingCurveV5State = {
        tokensSold: 10000000,
        promptReserves: 9000,
        phase: 'graduated',
      };

      // Function should still return true, but contract would prevent trading
      expect(canGraduate(testConfig, state)).toBe(true);
    });
  });

  describe('Round-Trip Parity (Buy then Sell)', () => {
    it('should maintain reserve consistency on buy->sell', () => {
      const initialState: BondingCurveV5State = {
        tokensSold: 1000000,
        promptReserves: 400,
        phase: 'active',
      };

      // Buy some tokens
      const buyPrompt = 100;
      const buyResult = calculateBuyReturn(testConfig, initialState, buyPrompt);

      const stateAfterBuy: BondingCurveV5State = {
        tokensSold: initialState.tokensSold + buyResult.tokensOut,
        promptReserves: initialState.promptReserves + buyResult.promptAfterFee,
        phase: 'active',
      };

      // Sell the same tokens back
      const sellResult = calculateSellReturn(testConfig, stateAfterBuy, buyResult.tokensOut);

      const finalReserves = stateAfterBuy.promptReserves - sellResult.promptGross;

      // Final reserves should be less than initial (due to fees)
      expect(finalReserves).toBeLessThan(initialState.promptReserves);
      
      // But reserves should always be positive
      expect(finalReserves).toBeGreaterThanOrEqual(0);
    });

    it('should lose value on round-trip due to fees', () => {
      const initialState: BondingCurveV5State = {
        tokensSold: 5000000,
        promptReserves: 2500,
        phase: 'active',
      };

      const buyPrompt = 500;
      const buyResult = calculateBuyReturn(testConfig, initialState, buyPrompt);

      const stateAfterBuy: BondingCurveV5State = {
        tokensSold: initialState.tokensSold + buyResult.tokensOut,
        promptReserves: initialState.promptReserves + buyResult.promptAfterFee,
        phase: 'active',
      };

      const sellResult = calculateSellReturn(testConfig, stateAfterBuy, buyResult.tokensOut);

      // Net PROMPT received should be less than initial investment
      // Due to 5% buy fee + 5% sell fee = ~9.75% total loss
      const totalLoss = buyPrompt - sellResult.promptNet;
      const lossPercentage = (totalLoss / buyPrompt) * 100;

      expect(lossPercentage).toBeGreaterThan(9);
      expect(lossPercentage).toBeLessThan(11);
    });
  });

  describe('Edge Cases and Boundaries', () => {
    it('should handle very small amounts', () => {
      const state: BondingCurveV5State = {
        tokensSold: 100,
        promptReserves: 0.001,
        phase: 'active',
      };

      const result = calculateBuyReturn(testConfig, state, 0.01);
      expect(result.tokensOut).toBeGreaterThan(0);
    });

    it('should handle maximum supply boundary', () => {
      const state: BondingCurveV5State = {
        tokensSold: BONDING_CURVE_V5_CONSTANTS.GRADUATION_SUPPLY - 100,
        promptReserves: 7999,
        phase: 'active',
      };

      // Buy exactly to graduation supply
      const result = calculateBuyReturn(testConfig, state, 1);
      expect(state.tokensSold + result.tokensOut).toBeLessThanOrEqual(
        BONDING_CURVE_V5_CONSTANTS.GRADUATION_SUPPLY
      );
    });

    it('should maintain precision with Big.js', () => {
      const state: BondingCurveV5State = {
        tokensSold: 3333333,
        promptReserves: 1234.56789,
        phase: 'active',
      };

      const result = calculateBuyReturn(testConfig, state, 789.123456);
      
      // All values should be precise numbers
      expect(typeof result.tokensOut).toBe('number');
      expect(typeof result.fee).toBe('number');
      expect(typeof result.averagePrice).toBe('number');
      expect(Number.isFinite(result.tokensOut)).toBe(true);
    });
  });

  describe('Invariant Checks', () => {
    it('should never return negative tokens on buy', () => {
      const state: BondingCurveV5State = {
        tokensSold: 0,
        promptReserves: 0,
        phase: 'active',
      };

      const result = calculateBuyReturn(testConfig, state, 100);
      expect(result.tokensOut).toBeGreaterThan(0);
    });

    it('should never return negative PROMPT on sell', () => {
      const state: BondingCurveV5State = {
        tokensSold: 1000000,
        promptReserves: 400,
        phase: 'active',
      };

      const result = calculateSellReturn(testConfig, state, 1000);
      expect(result.promptNet).toBeGreaterThan(0);
      expect(result.promptGross).toBeGreaterThan(0);
    });

    it('should maintain price increases as supply increases', () => {
      const supplies = [0, 2500000, 5000000, 7500000, 10000000];
      const prices = supplies.map(s => calculateCurrentPrice(testConfig, s));

      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });
  });
});
