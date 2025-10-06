# Chart Migration Guide: Per-Bucket FX + Correct Market Cap

## ✅ What's Done (Phase 0-2)

### Phase 0: Graduation Policy
- ✅ `graduation_policies` table
- ✅ `agent_graduation` table  
- ✅ `agent_usd_raised` view (FX at trade time)
- ✅ `evaluate_graduation()` RPC

### Phase 1: OHLCV Infrastructure
- ✅ `agent_ohlcv` table (PROMPT-only candles)
- ✅ `get_24h_change(p_agent_id, p_timeframe)` RPC
- ✅ `get_ohlc_with_fx(p_agent_id, p_tf, p_limit)` RPC
- ✅ `get-ohlc` edge function
- ✅ `useOHLCData` hook
- ✅ `useAgentMetrics` hook

### Phase 2: Simple Components
- ✅ `PriceDisplay` - now uses per-agent FX
- ✅ `useAgentFDV` - now uses metrics with correct supply

## 🚧 What's Left (Phase 3: Chart Refactor)

###  Remaining Files Using Hardcoded `PROMPT_USD_RATE`:

1. **EnhancedTradingViewChart.tsx** (19 occurrences)
   - Main chart component
   - Needs full refactor to use `useOHLCData` + `useAgentMetrics`

2. **AdminGraduationSettings.tsx** (2 occurrences)
   - Admin UI - OK to keep for now

3. **formatters.ts** (3 occurrences)
   - Utility functions - deprecated, should not be used

4. **CreateAgent.tsx** (1 occurrence)
   - Sets `created_prompt_usd_rate` - correct behavior

5. **GraduationService.ts** (2 occurrences)
   - Uses `created_prompt_usd_rate` from agent - correct behavior

## 📋 Chart Refactor Checklist

### For `EnhancedTradingViewChart.tsx`:

**Step 1: Replace data fetching**
```tsx
// ❌ OLD
import { ChartDataService, OHLCVData } from '@/services/chartDataService';
import { PROMPT_USD_RATE } from '@/lib/formatters';

// ✅ NEW
import { useOHLCData } from '@/hooks/useOHLCData';
import { useAgentMetrics } from '@/hooks/useAgentMetrics';
import Big from 'big.js';
```

**Step 2: Use new hooks**
```tsx
// ✅ NEW
const { metrics, loading: metricsLoading } = useAgentMetrics(agentId, 5000);
const { candlesUSD, loading: ohlcLoading } = useOHLCData(agentId, timeframe, 100, 10000);
const loading = metricsLoading || ohlcLoading;
const isGraduated = metrics?.graduation.status === 'graduated';
```

**Step 3: Calculate supply correctly**
```tsx
// ✅ Pre-grad: use total_supply (FDV)
// ✅ Post-grad: use circulating_supply (Market Cap)
const supply = isGraduated 
  ? Big(metrics.supply.circulating) 
  : Big(metrics.supply.total);
```

**Step 4: Convert candles with per-bucket FX**
```tsx
const processedData = candlesUSD.map(candle => {
  // Candle is already in USD from per-bucket FX
  const priceUSD = Big(candle.close);
  
  return chartType === 'candlestick' ? {
    time: (new Date(candle.time).getTime() / 1000) as Time,
    open: viewMode === 'marketcap' ? Big(candle.open).times(supply).toNumber() : candle.open,
    high: viewMode === 'marketcap' ? Big(candle.high).times(supply).toNumber() : candle.high,
    low: viewMode === 'marketcap' ? Big(candle.low).times(supply).toNumber() : candle.low,
    close: viewMode === 'marketcap' ? priceUSD.times(supply).toNumber() : candle.close,
  } : {
    time: (new Date(candle.time).getTime() / 1000) as Time,
    value: viewMode === 'marketcap' ? priceUSD.times(supply).toNumber() : candle.close,
  };
});
```

**Step 5: Update tooltip labels**
```tsx
// ✅ Pre-grad: "FDV (USD)"
// ✅ Post-grad: "Market Cap (Circulating, USD)"
const label = viewMode === 'marketcap' 
  ? (isGraduated ? 'Market Cap (Circulating)' : 'FDV')
  : 'Price';
```

**Step 6: Show dual-unit tooltips**
```tsx
// Use Units.formatTooltip() from src/lib/units.ts
import { Units } from '@/lib/units';

// In tooltip:
Units.formatTooltip(promptValue, metrics.price.fx)
// → "$0.0040 (0.00004 PROMPT)" with correct FX
```

## 🎯 Acceptance Criteria

1. **Latest chart close === top-right price** (same unit, within rounding)
2. **Pre-grad cards say "FDV"**, post-grad say **"Market Cap (Circulating)"**
3. **`/get-agent-metrics` returns `change24h`** (PROMPT-based) matching chart
4. **Graduation flips correctly**:
   - $79k raised → `pre_grad`
   - $81k raised → `graduated` with snapshot
5. **No hardcoded FX in charts** (except admin/agent creation)

## 🔧 ESLint Rule (Add to prevent regression)

```js
// .eslintrc.js
rules: {
  'no-restricted-imports': ['error', {
    paths: [{
      name: '@/lib/formatters',
      importNames: ['PROMPT_USD_RATE'],
      message: 'Use per-agent FX from useAgentMetrics() instead of hardcoded PROMPT_USD_RATE'
    }]
  }]
}
```

## 📝 Notes

- **Admin settings** can keep PROMPT_USD_RATE for default FX configuration
- **Agent creation** sets `created_prompt_usd_rate` at creation time - correct
- **Graduation service** reads `created_prompt_usd_rate` from agent - correct
- **Charts and price displays** must use dynamic FX from metrics/OHLC
