# Promptbox Public API Integration Guide

## Overview

The Promptbox Platform provides a public API for accessing agent/token data on Base Sepolia (testnet) and Base Mainnet. This API is designed for trading platforms like `trade.promptbox.com` to fetch real-time agent data.

## Base URL

```
https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1
```

## Authentication

All endpoints use Supabase anon key authentication (already configured in environment variables).

---

## Endpoints

### 1. List Tokens

**GET** `/list-tokens`

Returns a paginated list of agents/tokens with filtering and sorting options.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | integer | Page number (default: 1) | `1` |
| `limit` | integer | Results per page (max: 100, default: 50) | `50` |
| `testMode` | boolean | Filter by test mode | `true`, `false` |
| `category` | string | Filter by category | `Trading Bot` |
| `graduated` | boolean | Filter by graduation status | `true`, `false` |
| `chainId` | integer | Filter by chain ID | `84532` (Sepolia), `8453` (Mainnet) |
| `deploymentStatus` | string | Filter by deployment status | `deployed`, `not_deployed`, `deploying`, `deployment_failed` |
| `networkEnvironment` | string | Filter by network | `testnet`, `mainnet` |
| `hasContract` | boolean | Only show agents with token_address | `true` |
| `sortBy` | string | Sort field | `created_at`, `market_cap`, `volume_24h`, `token_holders`, `prompt_raised` |
| `sortOrder` | string | Sort direction | `asc`, `desc` |

#### Example Request

```bash
# Get deployed testnet tokens on Base Sepolia
curl "https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/list-tokens?chainId=84532&deploymentStatus=deployed&hasContract=true&limit=20"
```

#### Response Schema

```typescript
{
  success: boolean;
  tokens: Array<{
    id: string;
    name: string;
    symbol: string;
    description: string;
    category: string;
    token_address: string | null;
    token_address_normalized: string | null;
    chain_id: number;
    current_price: number;
    market_cap: number;
    market_cap_usd: number | null;
    volume_24h: number;
    token_holders: number;
    prompt_raised: number;
    token_graduated: boolean;
    deployment_status: 'not_deployed' | 'deploying' | 'deployed' | 'deployment_failed';
    network_environment: 'testnet' | 'mainnet';
    deployed_at: string | null;
    created_at: string;
    updated_at: string;
    // ... other fields
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    testMode: boolean | null;
    category: string | null;
    graduated: boolean | null;
    chainId: number | null;
    deploymentStatus: string | null;
    networkEnvironment: string | null;
    hasContract: boolean | null;
  };
  sort: {
    by: string;
    order: string;
  };
  cached_at: string;
}
```

---

### 2. Get Token Metadata

**GET** `/get-token-metadata`

Returns detailed metadata for a specific token by ID or address.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | uuid | Either id or address | Agent ID |
| `address` | string | Either id or address | Contract address |
| `chainId` | integer | Required with address | Chain ID (84532 or 8453) |

#### Example Requests

```bash
# By ID
curl "https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/get-token-metadata?id=123e4567-e89b-12d3-a456-426614174000"

# By address
curl "https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/get-token-metadata?address=0x1234...&chainId=84532"
```

#### Response Schema

```typescript
{
  success: boolean;
  token: {
    // Same fields as in list-tokens
  };
  cached_at: string;
}
```

---

### 3. Get OHLC Data

**GET** `/get-ohlc`

Returns historical OHLC (Open, High, Low, Close) candlestick data for trading charts.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | uuid | Yes | Agent ID |
| `timeframe` | string | No | Timeframe (default: `5m`) |
| `limit` | integer | No | Number of candles (default: 300, max: 1000) |

**Supported Timeframes:** `1m`, `5m`, `15m`, `1h`, `4h`, `1d`

#### Example Request

```bash
curl "https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1/get-ohlc?agentId=123e4567-e89b-12d3-a456-426614174000&timeframe=5m&limit=100"
```

#### Response Schema

```typescript
{
  success: boolean;
  agentId: string;
  timeframe: string;
  data: Array<{
    t: string;  // ISO timestamp
    o: string;  // Open price (in PROMPT)
    h: string;  // High price
    l: string;  // Low price
    c: string;  // Close price
    v: string;  // Volume (in agent tokens)
    fx: string; // PROMPT/USD exchange rate
  }>;
  cached_at: string;
}
```

---

### 4. Get Liquidity

**GET** `/get-liquidity`

Returns liquidity pool information for graduated agents.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | uuid | Yes | Agent ID |

---

## TypeScript Types

```typescript
// Core agent/token type
export interface PromptboxToken {
  id: string;
  name: string;
  symbol: string;
  description: string;
  category: string;
  token_address: string | null;
  token_address_normalized: string | null;
  chain_id: number;
  deployment_status: 'not_deployed' | 'deploying' | 'deployed' | 'deployment_failed';
  network_environment: 'testnet' | 'mainnet';
  deployed_at: string | null;
  current_price: number;
  market_cap: number;
  market_cap_usd: number | null;
  volume_24h: number;
  token_holders: number;
  prompt_raised: number;
  token_graduated: boolean;
  created_at: string;
  updated_at: string;
}

// OHLC candle type
export interface OHLCCandle {
  t: string;  // Timestamp
  o: string;  // Open
  h: string;  // High
  l: string;  // Low
  c: string;  // Close
  v: string;  // Volume
  fx: string; // FX rate
}
```

---

## React Query Integration Example

```typescript
import { useQuery } from '@tanstack/react-query';

const PROMPTBOX_API_BASE = 'https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1';

// Hook to fetch tradeable tokens
export function useTradableTokens() {
  return useQuery({
    queryKey: ['tradeable-tokens', 84532],
    queryFn: async () => {
      const response = await fetch(
        `${PROMPTBOX_API_BASE}/list-tokens?` +
        `chainId=84532&` +
        `deploymentStatus=deployed&` +
        `hasContract=true&` +
        `limit=50`
      );
      
      if (!response.ok) throw new Error('Failed to fetch tokens');
      
      const data = await response.json();
      return data.tokens as PromptboxToken[];
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });
}

// Hook to fetch OHLC data for charts
export function useOHLCData(agentId: string | undefined, timeframe: string = '5m') {
  return useQuery({
    queryKey: ['ohlc', agentId, timeframe],
    queryFn: async () => {
      const response = await fetch(
        `${PROMPTBOX_API_BASE}/get-ohlc?` +
        `agentId=${agentId}&` +
        `timeframe=${timeframe}&` +
        `limit=300`
      );
      
      if (!response.ok) throw new Error('Failed to fetch OHLC data');
      
      const data = await response.json();
      return data.data as OHLCCandle[];
    },
    enabled: !!agentId,
    staleTime: 10_000, // 10 seconds
    refetchInterval: 30_000, // Refetch every 30 seconds
  });
}

// Hook to fetch token by address
export function useTokenByAddress(address: string | undefined, chainId: number = 84532) {
  return useQuery({
    queryKey: ['token', address, chainId],
    queryFn: async () => {
      const response = await fetch(
        `${PROMPTBOX_API_BASE}/get-token-metadata?` +
        `address=${address}&` +
        `chainId=${chainId}`
      );
      
      if (!response.ok) throw new Error('Token not found');
      
      const data = await response.json();
      return data.token as PromptboxToken;
    },
    enabled: !!address,
    staleTime: 60_000, // 1 minute
  });
}
```

---

## Agent Identification

### UUID vs Contract Address

- **Primary Key:** Agents are identified by UUID (`id` field)
- **Contract Address:** Only available for deployed agents (`token_address` field)
- **Query Options:** You can query by either `id` or `address` + `chainId`

### Chain IDs

- **Base Sepolia (Testnet):** `84532`
- **Base Mainnet:** `8453`

---

## Deployment Status

Agents can have the following deployment statuses:

| Status | Description |
|--------|-------------|
| `not_deployed` | Database-only agent (test mode) |
| `deploying` | Contract deployment in progress |
| `deployed` | Successfully deployed on-chain |
| `deployment_failed` | Deployment failed - retry available |

**For Trading:** Only show agents with `deployment_status: 'deployed'` and `token_address` not null.

---

## Caching Strategy

### Client-Side Caching (Recommended)

Use React Query or SWR for automatic caching:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

### Server-Side Caching

API responses include `Cache-Control` headers:
- `/list-tokens`: 30 seconds
- `/get-token-metadata`: 60 seconds
- `/get-ohlc`: 10 seconds

---

## Rate Limiting

Currently no rate limiting is enforced. For production:
- Recommended: Max 100 requests/minute per IP
- Use client-side caching to minimize requests
- Batch requests when possible

---

## Best Practices

1. **Filter for Tradeable Agents:**
   ```
   ?deploymentStatus=deployed&hasContract=true
   ```

2. **Always Specify Chain ID:**
   ```
   ?chainId=84532
   ```

3. **Use Pagination:**
   ```
   ?page=1&limit=50
   ```

4. **Cache Aggressively:**
   - Use React Query with 30-60 second stale time
   - Don't refetch on every route change

5. **Handle Network Switching:**
   - Store user's network preference
   - Filter by `chainId` based on preference

6. **Display BaseScan Links:**
   ```typescript
   const basescanUrl = networkEnvironment === 'mainnet'
     ? `https://basescan.org/address/${token_address}`
     : `https://sepolia.basescan.org/address/${token_address}`;
   ```

---

## Testing

### Testnet Setup

1. Get testnet PROMPT tokens from faucet (coming soon)
2. Filter for Base Sepolia: `chainId=84532`
3. Create test agents via `/create` page
4. Verify contracts on BaseScan Sepolia

### Mainnet Migration (TGE)

When platform switches to mainnet:
1. Update `chainId` filter to `8453`
2. Contracts will have new addresses
3. Testnet agents remain accessible for reference

---

## Support

For issues or questions:
- GitHub Issues: [Promptbox Platform](https://github.com/your-org/promptbox-platform)
- Discord: [Promptbox Community](https://discord.gg/promptbox)
- Docs: [docs.promptbox.com](https://docs.promptbox.com)
