# MFE Integration Guide

## ⚠️ Important: Do Not Re-Mock Endpoints

The MFE (Micro-Frontend at `trade.promptbox.com`) consumes the **Promptbox Public API**. 

**Do not create mock implementations** of these endpoints in the MFE codebase. All data comes from the live API.

---

## 📚 API Documentation

- **Full API Reference**: See `TRADE_PROMPTBOX_INTEGRATION_PLAN.md`
- **Base URL**: `https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1`
- **Authentication**: Supabase Anon Key (provided separately)

### Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/healthz` | GET | System mode & health status |
| `/list-tokens` | GET | Paginated token list with filters |
| `/get-token-metadata` | GET | Detailed token info by address |
| `/get-liquidity` | POST | Liquidity pool data |
| `/get-ohlc` | POST | Historical OHLC chart data |
| `/build-trade-tx` | POST | Build transaction params for trades |

---

## 🎯 Mode Detection

### Check System Mode

All MFE pages should call `GET /healthz` on mount to determine the current system mode:

```typescript
const response = await fetch('https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/healthz', {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }
});

const health = await response.json();
console.log('System mode:', health.mode); // 'mock' | 'sepolia' | 'mainnet'
```

### Response Format

```typescript
{
  ok: boolean;
  ts: number;                     // Unix timestamp
  mode: 'mock' | 'sepolia' | 'mainnet';
  apiVersion: 'v1';
  settings: {
    testMode: boolean;
    deploymentMode: 'database' | 'smart_contract';
  }
}
```

### Mode Meanings

- **`mock`**: Database-only mode (no blockchain interaction)
- **`sepolia`**: Base Sepolia testnet (test mode enabled)
- **`mainnet`**: Base mainnet (production with real tokens)

### Display Mode Badge

The MFE should display a badge showing the current mode:

```typescript
function ModeBadge({ mode }: { mode: string }) {
  const config = {
    mock: { label: 'Mock Data', variant: 'secondary', icon: '🧪' },
    sepolia: { label: 'Testnet', variant: 'warning', icon: '🟠' },
    mainnet: { label: 'Mainnet', variant: 'success', icon: '🟢' }
  };
  
  const { label, variant, icon } = config[mode] || config.mock;
  
  return (
    <Badge variant={variant}>
      {icon} {label}
    </Badge>
  );
}
```

**Important**: The MFE does NOT control the mode. The mode is controlled by the Promptbox backend via `admin_settings` table.

---

## 🔐 Ownership & Authentication

### Creator Permissions

Only the agent creator (identified by `creator_id` matching authenticated user) can:

- Update agent profile (name, description, avatar)
- Modify social links (Twitter, Discord, etc.)
- Change marketing content
- Adjust trading parameters (if allowed)
- Update prompt threshold settings

### Read-Only for Non-Creators

All other users have **read-only** access to agent data. The MFE should:

1. Fetch token metadata to get `creator_id` and `creator_wallet_address`
2. Compare with the current authenticated user
3. Hide edit buttons/forms if user is not the creator

```typescript
function useIsCreator(token: PromptboxToken) {
  const { user } = useAuth(); // Your auth hook
  
  return (
    user?.id === token.creator_id ||
    user?.wallet?.address?.toLowerCase() === token.creator_wallet_address?.toLowerCase()
  );
}
```

### Backend Enforcement

The Promptbox API enforces ownership via Row-Level Security (RLS) policies. Even if the MFE sends an update request, the database will reject it if the user is not the creator.

---

## 🔄 Real-time Updates

### Chart Updates

The Promptbox backend broadcasts real-time trade events via Supabase Realtime. The MFE can subscribe to live updates:

```typescript
import { supabase } from '@/integrations/supabase/client';

function useChartRealtime(agentId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`chart-updates-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_token_buy_trades',
          filter: `agent_id=eq.${agentId}`
        },
        (payload) => {
          console.log('New buy trade:', payload);
          // Update chart with new data point
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_token_sell_trades',
          filter: `agent_id=eq.${agentId}`
        },
        (payload) => {
          console.log('New sell trade:', payload);
          // Update chart with new data point
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);
}
```

### Implementation Reference

See `src/hooks/useChartRealtime.tsx` for a complete example implementation.

---

## 🛠️ Transaction Building

### Build Trade Transactions

The MFE should use the `/build-trade-tx` endpoint to construct transaction parameters:

```typescript
const response = await fetch('https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/build-trade-tx', {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentId: 'uuid',
    tradeType: 'buy', // or 'sell'
    amount: 1000,     // Amount in tokens
    userAddress: '0x...'
  })
});

const { transaction } = await response.json();
```

### Response Format

```typescript
{
  success: true;
  apiVersion: 'v1';
  transaction: {
    to: string;        // Contract address
    data: string;      // Encoded function call
    value: string;     // ETH value (usually '0')
    gasLimit: string;  // Estimated gas limit
    from: string;      // User's address
  };
  tokenAddress: string;
  tradeType: 'buy' | 'sell';
  amount: number;
}
```

### Execute Transaction

The MFE forwards the transaction to the user's wallet (MetaMask, Privy, etc.):

```typescript
const txHash = await wallet.sendTransaction(transaction);
await wallet.waitForTransaction(txHash);
```

**No bonding curve math in the MFE.** All pricing calculations are done by the backend.

---

## 📊 Data Caching Strategy

### Recommended Cache Times

| Data Type | Stale Time | Refetch Interval |
|-----------|------------|------------------|
| Token List | 30 seconds | 1 minute |
| Token Metadata | 10 seconds | 30 seconds |
| OHLC Data | 1 minute | 2 minutes |
| Liquidity Data | 30 seconds | 1 minute |
| Health/Mode | 30 seconds | 1 minute |

### React Query Example

```typescript
import { useQuery } from '@tanstack/react-query';

export function useTokenList() {
  return useQuery({
    queryKey: ['tokens', 'list'],
    queryFn: () => listTokens({ chainId: 84532, deploymentStatus: 'deployed' }),
    staleTime: 30000,      // 30 seconds
    refetchInterval: 60000  // 1 minute
  });
}
```

---

## ✅ API Version Compatibility

All API responses include an `apiVersion` field:

```typescript
{
  success: true,
  apiVersion: 'v1',
  // ... rest of response
}
```

The MFE should check this field to ensure compatibility:

```typescript
const response = await fetch(endpoint);
const data = await response.json();

if (data.apiVersion !== 'v1') {
  console.warn('API version mismatch. Expected v1, got', data.apiVersion);
  // Handle version incompatibility
}
```

---

## 🔍 Debugging

### Check API Health

Always start with `/healthz` when debugging:

```bash
curl -X GET 'https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/healthz' \
  -H 'apikey: YOUR_ANON_KEY'
```

### Check Edge Function Logs

Navigate to Supabase Dashboard → Edge Functions → Function Name → Logs to see real-time function execution logs.

### Common Issues

1. **"Token not found"**: Check that the token has `deployment_status: 'deployed'` and `token_address` is not null
2. **"Mode mismatch"**: Verify `/healthz` returns expected mode before assuming behavior
3. **"Unauthorized"**: Ensure the Supabase anon key is correct and not expired

---

## 📞 Support

For questions or issues:

- **API Issues**: Check Supabase Edge Function logs
- **Data Issues**: Query `token_metadata_cache` materialized view directly
- **Mode Issues**: Verify `admin_settings` table values

---

## 🚀 Quick Start Checklist

- [ ] MFE calls `/healthz` on mount to detect mode
- [ ] Mode badge displayed in UI based on `/healthz` response
- [ ] Token list fetched from `/list-tokens` (not local mock)
- [ ] Individual token pages use `/get-token-metadata` by address
- [ ] Charts use `/get-ohlc` for historical data
- [ ] Real-time updates subscribed via `useChartRealtime` hook
- [ ] Trades use `/build-trade-tx` → wallet forwarding (no local curve math)
- [ ] All API responses checked for `apiVersion: 'v1'`
- [ ] Edit functionality hidden for non-creators
- [ ] Cache times configured per recommendations above

---

**Last Updated**: 2025-11-02  
**API Version**: v1
