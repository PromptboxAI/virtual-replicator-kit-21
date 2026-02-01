# Production Readiness Plan

## Promptbox Trading Platform - V8 On-Chain Architecture

**Audit Date:** January 30, 2026
**Status:** ❌ NOT PRODUCTION READY
**Estimated Effort:** 7-12 days

---

## Executive Summary

| Category | Critical | High | Medium | Status |
|----------|----------|------|--------|--------|
| **Security** | 2 | 4 | 3 | ❌ NOT READY |
| **Error Handling** | 2 | 4 | 4 | ⚠️ NEEDS WORK |
| **Mainnet Migration** | 4 | 6 | 3 | ❌ NOT READY |
| **Performance** | 1 | 3 | 4 | ⚠️ NEEDS WORK |
| **Database/RLS** | 2 | 4 | 2 | ❌ NOT READY |

---

## Table of Contents

1. [Recent Fixes Verified](#1-recent-fixes-verified)
2. [Phase 1: Security Fixes (BLOCKERS)](#2-phase-1-security-fixes-blockers)
3. [Phase 2: Mainnet Migration (BLOCKERS)](#3-phase-2-mainnet-migration-blockers)
4. [Phase 3: Error Handling](#4-phase-3-error-handling)
5. [Phase 4: Performance Optimization](#5-phase-4-performance-optimization)
6. [Phase 5: Frontend Fixes (trade.promptbox.com)](#6-phase-5-frontend-fixes-tradepromptboxcom)
7. [Testing Checklist](#7-testing-checklist)
8. [Deployment Checklist](#8-deployment-checklist)

---

## 1. Recent Fixes Verified

These issues have been resolved and verified:

| Fix | File | Status |
|-----|------|--------|
| WebSocket realtime for trades | `src/hooks/useRealtimeTrades.tsx` | ✅ Complete |
| Enable realtime on `on_chain_trades` | `supabase/migrations/20260129185900_*.sql` | ✅ Complete |
| `ZERO_ADDRESS` constant added | `supabase/functions/index-prototype-events/index.ts:53` | ✅ Complete |
| Call indexer before holder query | `supabase/functions/sync-on-chain-trades/index.ts:188-216` | ✅ Complete |
| WagmiWrapper on agent routes | `src/App.tsx:160-176` | ✅ Complete |
| Remove database fallback for V8 | `src/hooks/useBondingCurveV8.tsx` | ✅ Complete |
| RPC retry in edge functions | `supabase/functions/sync-on-chain-trades/index.ts:59-84` | ✅ Complete |

---

## 2. Phase 1: Security Fixes (BLOCKERS)

**Priority:** 🔴 CRITICAL
**Estimated Effort:** 2-3 days
**Risk if Skipped:** Data breach, fund loss, regulatory issues

### 2.1 Enable RLS on Trade Tables

**Issue:** `agent_token_buy_trades` and `agent_token_sell_trades` have NO Row Level Security enabled. Anyone can read all trade history.

**File to Create:** `supabase/migrations/YYYYMMDD_enable_trade_rls.sql`

```sql
-- Enable RLS on trade tables
ALTER TABLE agent_token_buy_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_token_sell_trades ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own trades
CREATE POLICY "Users can view own buy trades"
  ON agent_token_buy_trades
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own sell trades"
  ON agent_token_sell_trades
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Policy: Service role can manage all trades (for edge functions)
CREATE POLICY "Service role full access buy trades"
  ON agent_token_buy_trades
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access sell trades"
  ON agent_token_sell_trades
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Public can view aggregated trade data (for charts)
-- Only allow SELECT on specific columns, not user_id
CREATE POLICY "Public can view trade prices"
  ON agent_token_buy_trades
  FOR SELECT
  TO anon
  USING (true);
-- Note: Create a VIEW that excludes user_id for public access
```

### 2.2 Remove User Balance UPDATE Policy

**Issue:** Users can directly UPDATE their own token balances, bypassing server validation.

**File to Create:** `supabase/migrations/YYYYMMDD_fix_balance_policy.sql`

```sql
-- Remove dangerous UPDATE policy
DROP POLICY IF EXISTS "Users can update own balance" ON user_token_balances;

-- Only service role can update balances
CREATE POLICY "Service role manages balances"
  ON user_token_balances
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can only VIEW their own balances
CREATE POLICY "Users can view own balances"
  ON user_token_balances
  FOR SELECT
  USING (user_id = auth.uid()::text);
```

### 2.3 Add Missing Foreign Key Constraints

**Issue:** `agent_token_holders` and `user_token_balances` have TEXT user_id with no FK constraint.

**File to Create:** `supabase/migrations/YYYYMMDD_add_foreign_keys.sql`

```sql
-- Note: This requires data migration if existing data has invalid user_ids

-- Add FK to agent_token_holders (if user_id column can be converted)
-- First, clean up any orphaned records
DELETE FROM agent_token_holders
WHERE user_id NOT IN (SELECT id::text FROM auth.users);

-- Then add constraint (may need column type change)
-- ALTER TABLE agent_token_holders
--   ADD CONSTRAINT fk_agent_token_holders_user
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For now, add a trigger to validate user_id on INSERT
CREATE OR REPLACE FUNCTION validate_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id::text = NEW.user_id) THEN
    RAISE EXCEPTION 'Invalid user_id: %', NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_agent_token_holders_user
  BEFORE INSERT ON agent_token_holders
  FOR EACH ROW EXECUTE FUNCTION validate_user_id();
```

### 2.4 Move Client-Side Writes to Edge Functions

**Issue:** These files perform direct database writes that should be server-validated:

| File | Table | Action Required |
|------|-------|-----------------|
| `src/hooks/useContractDeployment.tsx:85-101` | `deployed_contracts` | Create edge function |
| `src/components/NewAgentCreator.tsx` | `agents` | Use existing edge function |
| `src/components/V6DeploymentPanel.tsx:120-140` | `deployed_contracts` | Create edge function |
| `src/components/EnhancedTradingInterface.tsx` | trade tables | Use edge function |

**Create:** `supabase/functions/sync-contract-deployment/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const {
      contractAddress,
      contractType,
      transactionHash,
      network,
      deployerAddress
    } = await req.json();

    // Validate required fields
    if (!contractAddress || !contractType || !transactionHash) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate contract address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return new Response(
        JSON.stringify({ error: 'Invalid contract address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Verify transaction on-chain before recording
    // const publicClient = createPublicClient({...});
    // const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash });

    const { data, error } = await supabase
      .from('deployed_contracts')
      .insert({
        contract_address: contractAddress,
        contract_type: contractType,
        transaction_hash: transactionHash,
        network: network || 'base_sepolia',
        deployer_address: deployerAddress,
        verified: false, // Will be verified by separate process
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 3. Phase 2: Mainnet Migration (BLOCKERS)

**Priority:** 🔴 CRITICAL
**Estimated Effort:** 3-5 days
**Risk if Skipped:** Cannot launch on mainnet

### 3.1 Hardcoded References Inventory

| Category | Count | Primary Files |
|----------|-------|---------------|
| Chain ID `84532` | 25+ | `chainConfig.ts`, `contractsV8.ts`, `contractsV6.ts` |
| `sepolia.basescan.org` | 13+ | `Header.tsx`, `WalletStatus.tsx`, various components |
| `base_sepolia` DB queries | 8+ | `useActivePromptContract.tsx`, `useContractDeployment.tsx` |
| Contract addresses | 15+ | `contractsV8.ts`, `contractsV6.ts`, `DeployV8.s.sol` |

### 3.2 Create Environment-Based Chain Configuration

**File to Update:** `src/lib/chainConfig.ts`

```typescript
import { base, baseSepolia } from 'viem/chains';

// Environment-based network selection
const NETWORK_MODE = import.meta.env.VITE_NETWORK_MODE || 'testnet';

export const CHAIN_CONFIG = {
  mainnet: {
    chain: base,
    chainId: 8453,
    name: 'Base',
    rpcUrl: import.meta.env.VITE_BASE_MAINNET_RPC || 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    explorerName: 'Basescan',
    isTestnet: false,
  },
  testnet: {
    chain: baseSepolia,
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: import.meta.env.VITE_BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    explorerName: 'Basescan (Sepolia)',
    isTestnet: true,
  },
} as const;

export const ACTIVE_CHAIN = CHAIN_CONFIG[NETWORK_MODE as keyof typeof CHAIN_CONFIG];
export const DEFAULT_CHAIN = ACTIVE_CHAIN;

// Helper for explorer URLs
export function getExplorerUrl(type: 'tx' | 'address' | 'token', hash: string): string {
  return `${ACTIVE_CHAIN.explorerUrl}/${type}/${hash}`;
}

// Database network string
export function getNetworkString(): string {
  return NETWORK_MODE === 'mainnet' ? 'base_mainnet' : 'base_sepolia';
}
```

### 3.3 Create Environment-Based Contract Configuration

**File to Update:** `src/lib/contractsV8.ts`

```typescript
const NETWORK_MODE = import.meta.env.VITE_NETWORK_MODE || 'testnet';

const V8_CONTRACTS_BY_NETWORK = {
  mainnet: {
    BONDING_CURVE: import.meta.env.VITE_MAINNET_BONDING_CURVE || '0x...',
    AGENT_FACTORY: import.meta.env.VITE_MAINNET_AGENT_FACTORY || '0x...',
    GRADUATION_MANAGER: import.meta.env.VITE_MAINNET_GRADUATION_MANAGER || '0x...',
    TRADING_ROUTER: import.meta.env.VITE_MAINNET_TRADING_ROUTER || '0x...',
  },
  testnet: {
    BONDING_CURVE: '0xc511a151b0E04D5Ba87968900eE90d310530D5fB',
    AGENT_FACTORY: '0xe8214F54e4a670A92B8A6Fc2Da1DB70b091A4a79',
    GRADUATION_MANAGER: '0x3c6878857FB1d1a1155b016A4b904c479395B2D9',
    TRADING_ROUTER: '0xce81D37B4f2855Ce1081D172dF7013b8beAE79B0',
  },
} as const;

export const V8_CONTRACTS = V8_CONTRACTS_BY_NETWORK[NETWORK_MODE as keyof typeof V8_CONTRACTS_BY_NETWORK];

// PROMPT token address (same pattern)
const PROMPT_TOKEN_BY_NETWORK = {
  mainnet: import.meta.env.VITE_MAINNET_PROMPT_TOKEN || '0x...',
  testnet: '0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673',
};

export const PROMPT_TOKEN_ADDRESS = PROMPT_TOKEN_BY_NETWORK[NETWORK_MODE as keyof typeof PROMPT_TOKEN_BY_NETWORK];
```

### 3.4 Environment Variables Required

**File to Create:** `.env.mainnet.example`

```bash
# Network Mode
VITE_NETWORK_MODE=mainnet

# RPC Endpoints
VITE_BASE_MAINNET_RPC=https://mainnet.base.org
VITE_BASE_MAINNET_RPC_BACKUP=https://base.llamarpc.com

# V8 Contract Addresses (Mainnet)
VITE_MAINNET_BONDING_CURVE=0x...
VITE_MAINNET_AGENT_FACTORY=0x...
VITE_MAINNET_GRADUATION_MANAGER=0x...
VITE_MAINNET_TRADING_ROUTER=0x...
VITE_MAINNET_PROMPT_TOKEN=0x...

# V6 Contract Addresses (Mainnet)
VITE_MAINNET_VAULT=0x...
VITE_MAINNET_UNISWAP_FACTORY=0x...
VITE_MAINNET_UNISWAP_ROUTER=0x...

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### 3.5 Files Requiring Updates

Search and replace these patterns:

| Find | Replace With |
|------|--------------|
| `84532` | `ACTIVE_CHAIN.chainId` |
| `baseSepolia` | `ACTIVE_CHAIN.chain` |
| `'base_sepolia'` | `getNetworkString()` |
| `https://sepolia.basescan.org` | `ACTIVE_CHAIN.explorerUrl` |
| Hardcoded contract addresses | `V8_CONTRACTS.XXX` |

**Files to update:**

```
src/components/Header.tsx
src/components/WalletStatus.tsx
src/components/admin/PlatformAllocationsList.tsx
src/components/V6DeploymentPanel.tsx
src/components/ContractDeployment.tsx
src/components/GraduationStatusDisplay.tsx
src/components/FactoryContractTest.tsx
src/components/RevenueDashboard.tsx
src/components/PromptTokenDeployer.tsx
src/components/NewAgentCreator.tsx
src/components/AgentCreationSuccess.tsx
src/pages/Faucet.tsx
src/pages/GraduationTest.tsx
src/hooks/useActivePromptContract.tsx
src/hooks/useContractDeployment.tsx
src/hooks/useWeb3ContractDeployment.tsx
src/hooks/useBondingCurveV8.tsx
src/hooks/useNetworkMode.tsx
```

### 3.6 Edge Function Updates

Update all edge functions to use environment-based network:

```typescript
// In each edge function
const NETWORK = Deno.env.get('NETWORK_MODE') || 'testnet';
const CHAIN_ID = NETWORK === 'mainnet' ? 8453 : 84532;
const NETWORK_STRING = NETWORK === 'mainnet' ? 'base_mainnet' : 'base_sepolia';
```

---

## 4. Phase 3: Error Handling

**Priority:** 🟠 HIGH
**Estimated Effort:** 1-2 days
**Risk if Skipped:** Poor UX, support burden, user confusion

### 4.1 Add User Notifications for Silent Errors

**Files to Update:**

#### `src/hooks/useBondingCurveV8.tsx`

```typescript
// Line 104-107: Add toast for blockchain read failure
} catch (error: any) {
  console.error('[useBondingCurveV8] Blockchain read failed:', error);
  toast({
    title: 'Connection Error',
    description: 'Failed to read blockchain data. Please check your connection.',
    variant: 'destructive',
  });
  throw new Error(`Failed to read blockchain state: ${error.message}`);
}

// Line 157-160: Add toast for quote failure
} catch (error) {
  console.error('Quote buy error:', error);
  toast({
    title: 'Quote Error',
    description: 'Unable to get price quote. Please try again.',
    variant: 'destructive',
  });
  return null;
}

// Line 247-249: Notify user about sync failure
} catch (e) {
  console.warn('[useBondingCurveV8] Database sync failed (non-critical):', e);
  toast({
    title: 'Sync Notice',
    description: 'Trade executed but history sync delayed. Data will update shortly.',
    variant: 'default',
  });
}
```

#### `src/hooks/useAgentTokens.tsx`

```typescript
// Line 87-88: Add user notification
} catch (error) {
  console.error('Token balance fetch error:', error);
  toast({
    title: 'Balance Error',
    description: 'Unable to fetch token balance.',
    variant: 'destructive',
  });
}
```

### 4.2 Add RPC Fallback to Frontend Hooks

**Create:** `src/lib/rpcClient.ts`

```typescript
import { createPublicClient, http, type PublicClient } from 'viem';
import { ACTIVE_CHAIN } from './chainConfig';

const RPC_ENDPOINTS = [
  ACTIVE_CHAIN.rpcUrl,
  'https://base-sepolia.blockpi.network/v1/rpc/public',
  'https://base-sepolia-rpc.publicnode.com',
];

let currentClientIndex = 0;
let publicClient: PublicClient | null = null;

export async function getPublicClient(): Promise<PublicClient> {
  if (publicClient) {
    try {
      await publicClient.getBlockNumber();
      return publicClient;
    } catch {
      // Current client failed, try next
      currentClientIndex = (currentClientIndex + 1) % RPC_ENDPOINTS.length;
    }
  }

  // Try each endpoint
  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    const index = (currentClientIndex + i) % RPC_ENDPOINTS.length;
    try {
      const client = createPublicClient({
        chain: ACTIVE_CHAIN.chain,
        transport: http(RPC_ENDPOINTS[index], { timeout: 10000 }),
      });
      await client.getBlockNumber();
      publicClient = client;
      currentClientIndex = index;
      return client;
    } catch {
      continue;
    }
  }

  throw new Error('All RPC endpoints failed');
}

export async function withRpcFallback<T>(
  operation: (client: PublicClient) => Promise<T>
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
    try {
      const client = await getPublicClient();
      return await operation(client);
    } catch (error: any) {
      lastError = error;
      currentClientIndex = (currentClientIndex + 1) % RPC_ENDPOINTS.length;
      publicClient = null;
    }
  }

  throw lastError || new Error('All RPC endpoints failed');
}
```

### 4.3 Fix Unhandled Promise Rejections

**File:** `supabase/functions/execute-trade/index.ts` (Lines 210-232)

```typescript
// Add .catch() to prevent unhandled rejection
supabase.functions.invoke('trigger-agent-graduation', {
  body: {
    graduationEventId: transactionResult.graduation_event_id,
    agentId: agentId
  }
}).then(result => {
  if (result.error) {
    console.error('❌ Graduation trigger failed:', result.error);
  } else {
    console.log('✅ Graduation trigger initiated successfully');
  }
}).catch(error => {
  console.error('❌ Graduation trigger exception:', error);
});
```

---

## 5. Phase 4: Performance Optimization

**Priority:** 🟡 MEDIUM
**Estimated Effort:** 1-2 days
**Risk if Skipped:** Slow UI, high RPC costs, poor UX

### 5.1 Reduce Polling Intervals

| File | Current | Recommended | Line |
|------|---------|-------------|------|
| `useAgentPrice.tsx` | 500ms | 2000ms | ~95 |
| `useBondingCurveV8.tsx` | 1000ms | 2000ms | 109 |
| `TradingDebugPanel.tsx` | 2000ms | 5000ms | 167 |

**Example fix for `useBondingCurveV8.tsx`:**

```typescript
// Line 109
refetchInterval: 2000, // Changed from 1000ms
```

### 5.2 Add Query Caching

**Update React Query configurations:**

```typescript
// In hooks using useQuery
useQuery({
  queryKey: ['...'],
  queryFn: async () => {...},
  staleTime: 5000,      // Data fresh for 5 seconds
  gcTime: 30000,        // Keep in cache for 30 seconds
  refetchInterval: 2000, // Poll every 2 seconds
});
```

### 5.3 Reduce Large Payload Limits

**File:** `src/components/audit/PriceHistoryValidator.tsx`

```typescript
// Change from .limit(1000) to .limit(100) with pagination
const { data, error } = await supabase
  .from('price_history')
  .select('*')
  .eq('agent_id', agentId)
  .order('timestamp', { ascending: false })
  .limit(100); // Reduced from 1000
```

### 5.4 Consolidate Supabase Channels

**File:** `src/hooks/useAgentRealtime.tsx`

```typescript
// Instead of 3 separate channels, use one with multiple listeners
const channel = supabase
  .channel(`agent-updates:${agentId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'agents',
    filter: `id=eq.${agentId}`,
  }, handleAgentUpdate)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'on_chain_trades',
    filter: `agent_id=eq.${agentId}`,
  }, handleNewTrade)
  .subscribe();
```

---

## 6. Phase 5: Frontend Fixes (trade.promptbox.com)

These fixes are for the trading frontend that you control:

### 6.1 Real-Time Trade Watcher

**Create:** `src/hooks/useTradeWatcher.tsx`

```typescript
import { useCallback, useEffect, useState } from 'react';
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { formatEther, parseAbiItem, type Address } from 'viem';
import { V8_CONTRACTS, uuidToBytes32 } from '@/lib/contractsV8';

const tradeEvent = parseAbiItem(
  'event Trade(bytes32 indexed agentId, address indexed trader, bool isBuy, uint256 promptAmountGross, uint256 promptAmountNet, uint256 tokenAmount, uint256 fee, uint256 price, uint256 supplyAfter, uint256 reserveAfter, uint256 timestamp)'
);

export interface RecentTrade {
  txHash: string;
  trader: string;
  isBuy: boolean;
  promptAmount: number;
  tokenAmount: number;
  price: number;
  timestamp: number;
  isOptimistic?: boolean;
}

export function useTradeWatcher(agentId: string | undefined) {
  const publicClient = usePublicClient();
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [lastTradeTime, setLastTradeTime] = useState<number>(0);

  useWatchContractEvent({
    address: V8_CONTRACTS.BONDING_CURVE as Address,
    abi: [tradeEvent],
    eventName: 'Trade',
    enabled: !!agentId,
    onLogs: (logs) => {
      const agentIdBytes32 = agentId ? uuidToBytes32(agentId) : null;

      for (const log of logs) {
        const args = log.args as any;
        if (args?.agentId !== agentIdBytes32) continue;

        const trade: RecentTrade = {
          txHash: log.transactionHash,
          trader: args.trader,
          isBuy: args.isBuy,
          promptAmount: Number(formatEther(args.promptAmountNet)),
          tokenAmount: Number(formatEther(args.tokenAmount)),
          price: Number(formatEther(args.price)),
          timestamp: Number(args.timestamp) * 1000,
          isOptimistic: false,
        };

        setRecentTrades(prev => {
          if (prev.some(t => t.txHash === trade.txHash)) return prev;
          return [trade, ...prev].slice(0, 50);
        });

        setLastTradeTime(Date.now());
      }
    },
  });

  const addOptimisticTrade = useCallback((trade: Omit<RecentTrade, 'isOptimistic'>) => {
    setRecentTrades(prev => [{ ...trade, isOptimistic: true }, ...prev].slice(0, 50));
    setLastTradeTime(Date.now());
  }, []);

  const confirmTrade = useCallback((txHash: string) => {
    setRecentTrades(prev =>
      prev.map(t => t.txHash === txHash ? { ...t, isOptimistic: false } : t)
    );
  }, []);

  return {
    recentTrades,
    lastTradeTime,
    addOptimisticTrade,
    confirmTrade,
  };
}
```

### 6.2 Enhanced useAgent Hook

**Update:** `src/hooks/useAgent.tsx`

```typescript
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useV8LiveState } from './useV8LiveState';

export function useAgent(agentId: string | undefined) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch from database
  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    async function fetchAgent() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', agentId)
          .maybeSingle();

        if (error) {
          setError(error.message);
          setAgent(null);
        } else if (!data) {
          setError('Agent not found');
          setAgent(null);
        } else {
          setAgent(data);
          setError(null);
        }
      } catch (err: any) {
        setError('Failed to load agent');
        setAgent(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAgent();
  }, [agentId]);

  // For V8 agents: get real-time blockchain data
  const isV8 = agent?.is_v8 || !!agent?.prototype_token_address;
  const { state: liveState, isLoading: liveLoading } = useV8LiveState(
    isV8 ? agentId : undefined,
    { pollingInterval: 2000, watchEvents: true }
  );

  // Merge database metadata with blockchain real-time data
  const mergedAgent = useMemo(() => {
    if (!agent) return null;
    if (!isV8 || !liveState) return agent;

    return {
      ...agent,
      current_price: liveState.currentPrice,
      circulating_supply: liveState.tokensSold,
      prompt_raised: liveState.promptReserve,
      token_graduated: liveState.graduated,
      market_cap: liveState.currentPrice * 1_000_000_000,
    };
  }, [agent, liveState, isV8]);

  return {
    agent: mergedAgent,
    loading: loading || (isV8 && liveLoading),
    error,
    isV8,
  };
}
```

---

## 7. Testing Checklist

### Pre-Launch Testing

- [ ] **Security Tests**
  - [ ] Verify RLS policies block unauthorized access
  - [ ] Test that users cannot modify others' balances
  - [ ] Verify edge functions validate all inputs
  - [ ] Test SQL injection attempts are blocked

- [ ] **Trading Tests**
  - [ ] Execute buy transaction and verify database updates
  - [ ] Execute sell transaction and verify database updates
  - [ ] Test with 0 balance (should fail gracefully)
  - [ ] Test with insufficient balance
  - [ ] Test slippage protection
  - [ ] Verify holder count updates after trade

- [ ] **Mainnet Readiness Tests**
  - [ ] Switch to mainnet config and verify chain ID
  - [ ] Verify all explorer URLs point to mainnet
  - [ ] Verify contract addresses are correct
  - [ ] Test RPC fallback with primary endpoint down

- [ ] **Error Handling Tests**
  - [ ] Disconnect wallet mid-transaction
  - [ ] Simulate RPC failure
  - [ ] Test with slow network connection
  - [ ] Verify all errors show user-friendly messages

- [ ] **Performance Tests**
  - [ ] Load test with 100+ concurrent users
  - [ ] Verify polling doesn't overwhelm RPC
  - [ ] Check memory usage over extended session
  - [ ] Verify WebSocket connections are cleaned up

---

## 8. Deployment Checklist

### Pre-Deployment

- [ ] All security migrations applied
- [ ] Environment variables set for mainnet
- [ ] Mainnet contracts deployed and verified
- [ ] Database backed up
- [ ] Monitoring/alerting configured

### Deployment Steps

1. **Database Migration**
   ```bash
   supabase db push
   ```

2. **Deploy Edge Functions**
   ```bash
   supabase functions deploy --all
   ```

3. **Update Environment Variables**
   ```bash
   # Set production env vars
   VITE_NETWORK_MODE=mainnet
   # ... other mainnet vars
   ```

4. **Deploy Frontend**
   ```bash
   npm run build
   # Deploy to hosting provider
   ```

5. **Verify Deployment**
   - [ ] Check all endpoints responding
   - [ ] Verify WebSocket connections working
   - [ ] Test one small trade on mainnet
   - [ ] Monitor error logs for 1 hour

### Rollback Plan

If issues are detected:

1. Revert frontend to previous version
2. Edge functions: `supabase functions deploy [function-name] --version [previous]`
3. Database: Restore from backup if needed
4. Switch `VITE_NETWORK_MODE` back to `testnet`

---

## Appendix A: File Change Summary

| File | Changes Required |
|------|------------------|
| `src/lib/chainConfig.ts` | Environment-based chain selection |
| `src/lib/contractsV8.ts` | Environment-based contract addresses |
| `src/lib/contractsV6.ts` | Environment-based contract addresses |
| `src/lib/wagmi.ts` | Dynamic chain configuration |
| `src/hooks/useBondingCurveV8.tsx` | Error toasts, RPC fallback |
| `src/hooks/useAgentPrice.tsx` | Reduce polling, error handling |
| `src/hooks/useAgent.tsx` | Merge blockchain data |
| `src/hooks/useAgentTokens.tsx` | Error notifications |
| `src/components/Header.tsx` | Dynamic explorer URL |
| `src/components/WalletStatus.tsx` | Dynamic explorer URL |
| 10+ other components | Replace hardcoded URLs |
| `supabase/migrations/*.sql` | RLS policies, FK constraints |
| `supabase/functions/*/index.ts` | Network-based config |

---

## Appendix B: Contact & Support

**For Questions:**
- Technical issues: Review error logs in Supabase dashboard
- Security concerns: Prioritize Phase 1 fixes immediately
- Mainnet deployment: Complete Phase 2 before any mainnet activity

**Estimated Timeline:**
- Phase 1 (Security): 2-3 days
- Phase 2 (Mainnet): 3-5 days
- Phase 3 (Errors): 1-2 days
- Phase 4 (Performance): 1-2 days
- Phase 5 (Frontend): 1-2 days
- Testing: 2-3 days

**Total: 10-17 days to production ready**
