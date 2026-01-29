# WebSocket Integration Brief for trade.promptbox.com

## Connection Method

**Supabase Realtime** (WebSocket under the hood) — no custom WebSocket URL needed, use the Supabase SDK.

---

## Connection Details

| Property | Value |
|----------|-------|
| WebSocket URL | `wss://cjzazuuwapsliacmjxfg.supabase.co/realtime/v1/websocket` |
| Supabase URL | `https://cjzazuuwapsliacmjxfg.supabase.co` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemF6dXV3YXBzbGlhY21qeGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDk1ODgsImV4cCI6MjA2NzU4NTU4OH0.RuRyIGlY0362B3yLcMZEGuCyhAYVIK9K7mcW7BiXpAc` |

---

## Architecture: Per-Agent Channels

Each agent gets its own subscription channel with a filter. This is more efficient than a global feed.

---

## Channels to Subscribe

| Channel Name | Table | Event | Filter | Purpose |
|--------------|-------|-------|--------|---------|
| `on-chain-trades:{agentId}` | `on_chain_trades` | `INSERT` | `agent_id=eq.{agentId}` | Live buy/sell trades |
| `agent-realtime-{agentId}` | `agents` | `UPDATE` | `id=eq.{agentId}` | Price/supply updates |

---

## Implementation Example

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cjzazuuwapsliacmjxfg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqemF6dXV3YXBzbGlhY21qeGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDk1ODgsImV4cCI6MjA2NzU4NTU4OH0.RuRyIGlY0362B3yLcMZEGuCyhAYVIK9K7mcW7BiXpAc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to trades for a specific agent
function subscribeToTrades(agentId: string) {
  const channel = supabase
    .channel(`on-chain-trades:${agentId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'on_chain_trades',
        filter: `agent_id=eq.${agentId}`,
      },
      (payload) => {
        console.log('New trade:', payload.new);
        // Handle new trade event
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });

  // Return cleanup function
  return () => supabase.removeChannel(channel);
}

// Subscribe to agent updates (price, supply, etc.)
function subscribeToAgent(agentId: string) {
  const channel = supabase
    .channel(`agent-realtime-${agentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'agents',
        filter: `id=eq.${agentId}`,
      },
      (payload) => {
        console.log('Agent updated:', payload.new);
        // Handle agent update
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
```

---

## Trade Payload Shape

```typescript
interface OnChainTrade {
  id: string;
  agent_id: string;
  transaction_hash: string;
  block_number: number;
  block_timestamp?: string;
  trader_address: string;
  is_buy: boolean;                // true = buy, false = sell
  prompt_amount_gross: number;    // Total PROMPT before fees
  prompt_amount_net: number;      // PROMPT after fees
  token_amount: number;           // Agent tokens traded
  fee: number;                    // Fee amount
  price: number;                  // Price per token
  supply_after: number;           // Token supply after trade
  reserve_after: number;          // Reserve after trade
  created_at: string;             // ISO timestamp
}
```

---

## Agent Update Payload Shape

```typescript
interface AgentUpdate {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  prompt_raised: number;
  on_chain_price: number;
  on_chain_supply: number;
  on_chain_reserve: number;
  circulating_supply: number;
  market_cap: number;
  token_holders: number;
  volume_24h: number;
  // ... other fields
}
```

---

## React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function useRealtimeTrades(agentId: string | undefined) {
  const [trades, setTrades] = useState<OnChainTrade[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`on-chain-trades:${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'on_chain_trades',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          const newTrade = payload.new as OnChainTrade;
          setTrades(prev => [newTrade, ...prev].slice(0, 50));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  return { trades, isConnected };
}
```

---

## Key Notes

1. **No polling needed** — trades broadcast automatically on INSERT
2. **Supabase SDK handles reconnection** automatically
3. **Filter is critical** — always include `agent_id=eq.{agentId}` to avoid receiving all trades
4. **Tables enabled for realtime**: `on_chain_trades`, `agents`
5. **Channel naming** — use descriptive names like `on-chain-trades:{agentId}` for debugging

---

## Tables Enabled for Realtime

The following tables are configured in `supabase_realtime` publication:

- `on_chain_trades` — Live trade events
- `agents` — Agent state updates (price, supply, etc.)

---

## Debugging

Check subscription status in browser console:
```
[Realtime] Subscription status: SUBSCRIBED
[Realtime] New on-chain trade: { ... }
```

If not receiving events:
1. Verify `agent_id` format (must be valid UUID)
2. Check that trades are being inserted into `on_chain_trades` table
3. Confirm realtime is enabled on the table

---

**Last Updated**: 2025-01-29  
**API Version**: v1
