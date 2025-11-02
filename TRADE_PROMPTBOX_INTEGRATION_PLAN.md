# Integration Plan for trade.promptbox.com
**Status**: ✅ Ready for Implementation  
**Last Updated**: 2025-10-22  
**API Version**: v2.6 (Phase 1-2 Fields Complete)

---

## 🎯 Overview

trade.promptbox.com is a **consumer** of the Promptbox Public API. This document provides everything needed to integrate with our fully-featured token metadata API.

---

## ✅ What's Available Now

### API Endpoints (All Live & Ready)
- ✅ `GET /healthz` - System mode and health status
- ✅ `GET /list-tokens` - Paginated token list with advanced filtering
- ✅ `GET /get-token-metadata` - Detailed token info by address
- ✅ `POST /get-liquidity` - Liquidity pool data for graduated agents
- ✅ `GET /get-ohlc` - Historical OHLC candlestick data
- ✅ `POST /refresh-token-cache` - Manual cache refresh (system use)

### Database Infrastructure
- ✅ Materialized view `token_metadata_cache` (updated with Phase 1-2 fields)
- ✅ Includes: `deployment_status`, `network_environment`, `deployed_at`
- ✅ All indexes optimized for fast queries
- ✅ Public API access configured (no JWT required)

---

## 🔧 Integration Steps

### Step 1: Configure API Client

**Base URL**: `https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1`  
**Auth**: Supabase Anon Key (provided separately)

Create `src/lib/promptboxApi.ts`:

```typescript
const PROMPTBOX_API_BASE = import.meta.env.VITE_PROMPTBOX_API_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Health check interface
export interface HealthCheckResponse {
  ok: boolean;
  ts: number;
  mode: 'mock' | 'sepolia' | 'mainnet';
  apiVersion: string;
  settings?: {
    testMode: boolean;
    deploymentMode: 'database' | 'smart_contract';
  };
}

// Check system health and mode
export async function checkHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(
    `${PROMPTBOX_API_BASE}/healthz`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }

  return response.json();
}

export interface ListTokensParams {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filters
  testMode?: boolean;
  category?: string;
  graduated?: boolean;
  chainId?: number;
  
  // ✅ NEW: Phase 1-2 Filters (No workarounds needed!)
  deploymentStatus?: 'not_deployed' | 'deploying' | 'deployed' | 'deployment_failed';
  networkEnvironment?: 'testnet' | 'mainnet';
  hasContract?: boolean; // Still supported as alias for deployed
  
  // Sorting
  sortBy?: 'created_at' | 'current_price' | 'market_cap' | 'volume_24h' | 'deployed_at';
  sortOrder?: 'asc' | 'desc';
}

export async function listTokens(params: ListTokensParams) {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, val]) => {
      if (val !== undefined && val !== null) {
        acc[key] = String(val);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  const response = await fetch(
    `${PROMPTBOX_API_BASE}/list-tokens?${queryString}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function getTokenMetadata(address: string, chainId: number) {
  const response = await fetch(
    `${PROMPTBOX_API_BASE}/get-token-metadata?address=${address}&chainId=${chainId}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function getOHLC(agentId: string, timeframe: string = '1h') {
  const response = await fetch(
    `${PROMPTBOX_API_BASE}/get-ohlc?agentId=${agentId}&timeframe=${timeframe}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function getLiquidity(agentId: string) {
  const response = await fetch(
    `${PROMPTBOX_API_BASE}/get-liquidity`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agentId })
    }
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
```

---

### Step 2: TypeScript Types

Create `src/types/promptbox.ts`:

```typescript
export interface PromptboxToken {
  // Core Identity
  id: string;
  name: string;
  symbol: string;
  description: string;
  category: string | null;
  avatar_url: string | null;
  
  // Contract & Blockchain
  token_address: string | null;
  chain_id: number;
  block_number: number | null;
  
  // ✅ NEW: Phase 1-2 Deployment Fields
  deployment_status: 'not_deployed' | 'deploying' | 'deployed' | 'deployment_failed';
  network_environment: 'testnet' | 'mainnet';
  deployed_at: string | null; // ISO 8601 timestamp
  deployment_tx_hash: string | null;
  deployment_method: string | null;
  deployment_verified: boolean;
  
  // Creator Info
  creator_id: string | null;
  creator_wallet_address: string | null;
  creator_ens_name: string | null;
  
  // Trading & Market Data
  current_price: number;
  market_cap: number;
  market_cap_usd: number | null;
  volume_24h: number;
  price_change_24h: number;
  total_supply: number;
  circulating_supply: number;
  bonding_curve_supply: number;
  prompt_raised: number;
  token_holders: number;
  
  // Pricing Model
  pricing_model: string;
  created_p0: number;
  created_p1: number;
  created_prompt_usd_rate: number;
  prompt_usd_rate: number;
  target_market_cap_usd: number;
  
  // Status & Graduation
  is_active: boolean;
  status: string;
  token_graduated: boolean;
  graduation_threshold: number;
  graduation_event_id: string | null;
  graduation_mode: string;
  
  // Trading Settings
  allow_automated_trading: boolean;
  max_trade_amount: number;
  creation_locked: boolean;
  creation_expires_at: string | null;
  creator_prebuy_amount: number;
  
  // Framework & Mode
  test_mode: boolean;
  framework: string;
  creation_mode: string;
  
  // Social & Marketing
  website_url: string | null;
  twitter_url: string | null;
  twitter_username: string | null;
  discord_url: string | null;
  telegram_url: string | null;
  youtube_url: string | null;
  whitepaper_url: string | null;
  screenshots: string[] | null;
  demo_videos: string[] | null;
  marketing_description: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface PromptboxTokenListResponse {
  success: boolean;
  apiVersion: 'v1';
  tokens: PromptboxToken[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    testMode?: boolean;
    category?: string;
    graduated?: boolean;
    chainId?: number;
    deploymentStatus?: string;
    networkEnvironment?: string;
    hasContract?: boolean;
  };
  sort: {
    by: string;
    order: string;
  };
  cached_at: string;
}

export interface PromptboxTokenMetadataResponse {
  success: boolean;
  apiVersion: 'v1';
  token: PromptboxToken;
  cached_at: string;
}

export interface OHLCCandle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PromptboxOHLCResponse {
  success: boolean;
  apiVersion: 'v1';
  agentId: string;
  timeframe: string;
  buckets: OHLCCandle[];
  count: number;
}

export interface PromptboxLiquidityResponse {
  success: boolean;
  apiVersion: 'v1';
  liquidity: {
    creation_mode: 'database' | 'smart_contract';
    graduation_mode: 'database' | 'smart_contract';
    status: 'pre_grad' | 'post_grad';
    lp_percent: string;
    source: 'actual' | 'projected';
    lp_prompt: string;
    lp_usd: string;
    lp_pair_symbol: string | null;
    lp_pair_amount: string | null;
    asof: string;
    fx: string;
  } | null;
}
```

---

### Step 3: React Query Hooks

Update `src/hooks/useAgents.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { listTokens } from '@/lib/promptboxApi';
import type { PromptboxToken } from '@/types/promptbox';

export function useAgents() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['promptbox-tokens', 'tradeable'],
    queryFn: () => listTokens({
      chainId: 84532, // Base Sepolia
      deploymentStatus: 'deployed', // ✅ NEW: Use proper filter instead of workaround
      networkEnvironment: 'testnet',
      testMode: true,
      limit: 50
    }),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // Refresh every minute
  });

  return {
    agents: data?.tokens || [],
    loading: isLoading,
    error: error?.message || null,
    pagination: data?.pagination
  };
}
```

Create `src/hooks/useTokenByAddress.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getTokenMetadata } from '@/lib/promptboxApi';

export function useTokenByAddress(address: string | undefined, chainId: number = 84532) {
  return useQuery({
    queryKey: ['promptbox-token', address, chainId],
    queryFn: () => getTokenMetadata(address!, chainId),
    enabled: !!address,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000 // Refresh every 30 seconds
  });
}
```

Create `src/hooks/useTokenOHLC.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getOHLC } from '@/lib/promptboxApi';

export function useTokenOHLC(agentId: string | undefined, timeframe: string = '1h') {
  return useQuery({
    queryKey: ['promptbox-ohlc', agentId, timeframe],
    queryFn: () => getOHLC(agentId!, timeframe),
    enabled: !!agentId,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000 // Refresh every 2 minutes
  });
}
```

---

### Step 4: Environment Configuration

Add to `.env`:

```bash
# Promptbox Public API
VITE_PROMPTBOX_API_URL=https://cjzazuuwapsliacmjxfg.supabase.co/functions/v1
VITE_SUPABASE_ANON_KEY=[PROVIDED_BY_PROMPTBOX_TEAM]
```

---

## 📊 Example API Queries

### Get All Deployed Tokens on Base Sepolia
```typescript
const response = await listTokens({
  chainId: 84532,
  deploymentStatus: 'deployed',
  networkEnvironment: 'testnet',
  sortBy: 'deployed_at',
  sortOrder: 'desc'
});
```

### Get Recently Deployed Tokens (Last 7 Days)
```typescript
const response = await listTokens({
  chainId: 84532,
  deploymentStatus: 'deployed',
  sortBy: 'deployed_at',
  sortOrder: 'desc',
  limit: 20
});

// Filter client-side for last 7 days
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const recentTokens = response.tokens.filter(token => 
  token.deployed_at && new Date(token.deployed_at) >= sevenDaysAgo
);
```

### Get Graduated Tokens Only
```typescript
const response = await listTokens({
  chainId: 84532,
  graduated: true,
  deploymentStatus: 'deployed'
});
```

### Get Token by Contract Address
```typescript
const response = await getTokenMetadata(
  '0x1234...abcd',
  84532
);

console.log(`Deployed ${response.token.deployed_at}`);
console.log(`Status: ${response.token.deployment_status}`);
```

---

## 🎨 UI Display Examples

### Show Deployment Status Badge
```typescript
function DeploymentStatusBadge({ token }: { token: PromptboxToken }) {
  const statusConfig = {
    deployed: { label: 'Deployed', variant: 'success' },
    deploying: { label: 'Deploying...', variant: 'warning' },
    not_deployed: { label: 'Database Only', variant: 'secondary' },
    deployment_failed: { label: 'Failed', variant: 'destructive' }
  };
  
  const config = statusConfig[token.deployment_status];
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
```

### Show Network Badge
```typescript
function NetworkBadge({ token }: { token: PromptboxToken }) {
  return (
    <Badge variant={token.network_environment === 'mainnet' ? 'default' : 'outline'}>
      {token.network_environment === 'mainnet' ? '🟢 Mainnet' : '🟠 Testnet'}
    </Badge>
  );
}
```

### Show Time Since Deployment
```typescript
function DeploymentTime({ token }: { token: PromptboxToken }) {
  if (!token.deployed_at) return null;
  
  const deployedDate = new Date(token.deployed_at);
  const timeAgo = formatDistanceToNow(deployedDate, { addSuffix: true });
  
  return (
    <span className="text-sm text-muted-foreground">
      Deployed {timeAgo}
    </span>
  );
}
```

---

## 🔄 Data Refresh Strategy

### Recommended Caching Times
- **Token List**: 30 seconds stale, 1 minute refetch
- **Token Metadata**: 10 seconds stale, 30 seconds refetch
- **OHLC Data**: 1 minute stale, 2 minutes refetch
- **Liquidity Data**: 30 seconds stale, 1 minute refetch

### Background Refetching
React Query will automatically refetch on:
- Window focus
- Network reconnect
- Interval (as configured above)

---

## ✅ Testing Checklist

### API Integration
- [ ] Token list loads on index page
- [ ] Individual token pages load by address
- [ ] Price charts display with OHLC data
- [ ] Filters work (status, network, category)
- [ ] Sorting works (by price, market cap, deployed date)
- [ ] Pagination works correctly

### Phase 1-2 Fields Display
- [ ] Deployment status badge shows correctly
- [ ] Network environment badge displays
- [ ] "Deployed X ago" timestamp renders
- [ ] Contract address links to BaseScan
- [ ] Deployment filters work in UI

### Performance
- [ ] Initial load < 2 seconds
- [ ] Cached data loads instantly
- [ ] Background refetch doesn't block UI
- [ ] No duplicate API calls

---

## 🚨 Important Notes

### DO NOT:
- ❌ Create your own `list-tokens` edge function
- ❌ Create your own `get-token-metadata` edge function  
- ❌ Query the `agents` table directly
- ❌ Duplicate the public API endpoints
- ❌ Use `hasContract=true` workaround (no longer needed)

### DO:
- ✅ Use the existing Promptbox API exclusively
- ✅ Implement React Query for optimal caching
- ✅ Use `deploymentStatus` filter instead of workarounds
- ✅ Build beautiful trading UI components
- ✅ Focus on user experience

---

## 📞 Support

**API Questions**: Contact Promptbox Platform Team  
**Integration Issues**: Check console logs for API errors  
**Rate Limits**: Currently unlimited (will notify if changed)

---

## 🎉 You're All Set!

With Phase 1-2 fields now available, you have access to complete deployment tracking with no workarounds needed. Build amazing trading experiences! 🚀
