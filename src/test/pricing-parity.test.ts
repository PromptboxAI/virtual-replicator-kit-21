import { expect, it, describe } from 'vitest';
import Big from 'big.js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Phase 6: Pricing parity tests
 * Ensures chart data matches card displays using API endpoints
 */

async function fetchMetrics(agentId: string) {
  const { data, error } = await supabase.functions.invoke('get-agent-metrics', {
    body: { agentId }
  });
  if (error) throw error;
  return data;
}

async function fetchOHLC(agentId: string, limit = 1) {
  const { data, error } = await supabase.functions.invoke('get-ohlc', {
    body: { agentId, timeframe: '5m', limit }
  });
  if (error) throw error;
  return data;
}

describe('Pricing parity (Phase E)', () => {
  const testAgentId = import.meta.env.VITE_TEST_AGENT_ID || 'skip';

  it.skipIf(testAgentId === 'skip')('latest chart close equals card price (USD)', async () => {
    const metrics = await fetchMetrics(testAgentId);
    const ohlc = await fetchOHLC(testAgentId, 1);
    
    // New API shape: buckets array with string fields
    const lastBucket = ohlc.buckets[ohlc.buckets.length - 1];
    const chartPriceUsd = Big(lastBucket.c).times(lastBucket.fx);
    const cardPriceUsd = Big(metrics.price.usd || 0);

    // Should match within 8 decimal places
    expect(Number(chartPriceUsd.toString())).toBeCloseTo(Number(cardPriceUsd.toString()), 8);
  });

  it.skipIf(testAgentId === 'skip')('cap policy matches graduation status', async () => {
    const metrics = await fetchMetrics(testAgentId);
    
    // Pre-grad should use FDV (total supply), post-grad should use Circulating
    if (metrics.graduation.status === 'graduated') {
      expect(metrics.supply.policy).toBe('CIRCULATING');
    } else {
      expect(metrics.supply.policy).toBe('FDV');
    }
  });

  it.skipIf(testAgentId === 'skip')('market-cap series matches card cap for current status', async () => {
    const metrics = await fetchMetrics(testAgentId);
    const ohlc = await fetchOHLC(testAgentId, 1);
    
    // Use supply.policy from metrics
    const supply = metrics.supply.policy === 'FDV' 
      ? metrics.supply.total 
      : metrics.supply.circulating;
    
    const lastBucket = ohlc.buckets[ohlc.buckets.length - 1];
    const mcapUsd = Big(lastBucket.c)
      .times(lastBucket.fx)
      .times(supply);
    
    const cardCapUsd = metrics.supply.policy === 'FDV'
      ? Big(metrics.fdv.usd || 0)
      : Big(metrics.marketCap.usd || 0);

    // Should match within 6 decimal places
    expect(Number(mcapUsd.toString())).toBeCloseTo(Number(cardCapUsd.toString()), 6);
  });
});

describe('Graduation policy (Phase E)', () => {
  const testAgentId = import.meta.env.VITE_TEST_AGENT_ID || 'skip';

  it.skipIf(testAgentId === 'skip')('does not graduate below $80k USD raised', async () => {
    const metrics = await fetchMetrics(testAgentId);
    const usdRaised = Number(metrics.graduation.met.usd_raised_total || 0);
    
    if (usdRaised < 80000) {
      // Should NOT be graduated if under $80k threshold
      expect(metrics.graduation.status).not.toBe('graduated');
    }
  });

  it.skipIf(testAgentId === 'skip')('graduates at $80k USD raised threshold (FX at trade time)', async () => {
    const metrics = await fetchMetrics(testAgentId);
    const usdRaised = Number(metrics.graduation.met.usd_raised_total || 0);
    
    if (usdRaised >= 80000) {
      // Should be graduated if $80k threshold met (using FX at trade time)
      expect(metrics.graduation.status).toBe('graduated');
    }
  });
});
