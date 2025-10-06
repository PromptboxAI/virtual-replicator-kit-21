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

describe('Pricing parity (Phase 6)', () => {
  const testAgentId = import.meta.env.VITE_TEST_AGENT_ID || 'skip';

  it.skipIf(testAgentId === 'skip')('latest chart close equals card price (USD)', async () => {
    const metrics = await fetchMetrics(testAgentId);
    const ohlc = await fetchOHLC(testAgentId, 1);
    
    const lastBucket = ohlc.buckets[0];
    const chartPriceUsd = Big(lastBucket.close_prompt).times(lastBucket.fx_rate);
    const cardPriceUsd = Big(metrics.price.usd || 0);

    // Should match within 8 decimal places
    expect(Number(chartPriceUsd.toString())).toBeCloseTo(Number(cardPriceUsd.toString()), 8);
  });

  it.skipIf(testAgentId === 'skip')('market-cap series matches card cap for current status', async () => {
    const metrics = await fetchMetrics(testAgentId);
    const ohlc = await fetchOHLC(testAgentId, 1);
    
    const graduated = metrics.graduation.status === 'graduated';
    const supply = graduated ? metrics.supply.circulating : metrics.supply.total;
    
    const lastBucket = ohlc.buckets[0];
    const mcapUsd = Big(lastBucket.close_prompt)
      .times(lastBucket.fx_rate)
      .times(supply);
    
    const cardCapUsd = graduated 
      ? Big(metrics.marketCap.usd || 0)
      : Big(metrics.fdv.usd || 0);

    // Should match within 6 decimal places
    expect(Number(mcapUsd.toString())).toBeCloseTo(Number(cardCapUsd.toString()), 6);
  });
});

describe('Graduation policy (Phase 6)', () => {
  const testAgentId = import.meta.env.VITE_TEST_AGENT_ID || 'skip';

  it.skipIf(testAgentId === 'skip')('does not graduate below $80k raised even if FDV is high', async () => {
    const metrics = await fetchMetrics(testAgentId);
    const usdRaised = Number(metrics.graduation.met.usd_raised_total || 0);
    
    if (usdRaised < 80000) {
      // Should NOT be graduated if under threshold
      expect(metrics.graduation.status).not.toBe('graduated');
    }
  });

  it.skipIf(testAgentId === 'skip')('graduates at $80k USD raised threshold', async () => {
    const metrics = await fetchMetrics(testAgentId);
    const usdRaised = Number(metrics.graduation.met.usd_raised_total || 0);
    
    if (usdRaised >= 80000) {
      // Should be graduated if threshold met
      expect(metrics.graduation.status).toBe('graduated');
    }
  });
});
