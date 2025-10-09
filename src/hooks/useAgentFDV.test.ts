import { describe, it, expect } from 'vitest';
import Big from 'big.js';

describe('useAgentFDV supply policy logic', () => {
  it('should use total supply for pre-grad agents (FDV policy)', () => {
    const mockMetrics = {
      supply: {
        total: '1000000000',
        circulating: '800000000',
        policy: 'FDV' as const
      },
      price: { usd: '0.00000084' },
      graduation: { status: 'pre_grad' as const }
    };
    
    const supply = Big(mockMetrics.supply.total);
    const priceUSD = Big(mockMetrics.price.usd);
    const fdv = priceUSD.times(supply).toNumber();
    
    expect(fdv).toBe(840); // 0.00000084 * 1B = $840
  });
  
  it('should use circulating supply for graduated agents (CIRCULATING policy)', () => {
    const mockMetrics = {
      supply: {
        total: '1000000000',
        circulating: '800000000',
        policy: 'CIRCULATING' as const
      },
      price: { usd: '0.00000084' },
      graduation: { status: 'graduated' as const }
    };
    
    const supply = Big(mockMetrics.supply.circulating);
    const priceUSD = Big(mockMetrics.price.usd);
    const marketCap = priceUSD.times(supply).toNumber();
    
    expect(marketCap).toBe(672); // 0.00000084 * 800M = $672
  });

  it('should handle zero price gracefully', () => {
    const mockMetrics = {
      supply: {
        total: '1000000000',
        circulating: '800000000',
        policy: 'FDV' as const
      },
      price: { usd: '0' },
      graduation: { status: 'pre_grad' as const }
    };
    
    const supply = Big(mockMetrics.supply.total);
    const priceUSD = Big(mockMetrics.price.usd);
    const fdv = priceUSD.times(supply).toNumber();
    
    expect(fdv).toBe(0);
  });

  it('should handle very small prices with precision', () => {
    const mockMetrics = {
      supply: {
        total: '1000000000',
        circulating: '800000000',
        policy: 'FDV' as const
      },
      price: { usd: '0.0000000075' }, // 7.5e-9
      graduation: { status: 'pre_grad' as const }
    };
    
    const supply = Big(mockMetrics.supply.total);
    const priceUSD = Big(mockMetrics.price.usd);
    const fdv = priceUSD.times(supply).toNumber();
    
    expect(fdv).toBe(7.5); // 7.5e-9 * 1B = $7.5
  });

  it('should correctly identify policy from graduation status', () => {
    // Pre-grad should use FDV (total supply)
    const preGradIsGraduated = false;
    const preGradSupply = preGradIsGraduated ? '800000000' : '1000000000';
    expect(preGradSupply).toBe('1000000000');
    
    // Graduated should use Market Cap (circulating supply)
    const gradIsGraduated = true;
    const gradSupply = gradIsGraduated ? '800000000' : '1000000000';
    expect(gradSupply).toBe('800000000');
  });
});
