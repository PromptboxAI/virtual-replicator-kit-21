

# Fix Agent Creation 401/500 Errors

## Summary
This plan addresses three issues observed during V8 agent creation:
1. 401 errors when updating `agents` and inserting into `agent_runtime_status` 
2. 500 errors from `sync-on-chain-trades` due to RPC failures
3. Ensuring reliable agent initialization even when client-side operations fail

---

## Changes Overview

### 1. Move `agent_runtime_status` Initialization to Edge Function

**Problem**: Client-side INSERT to `agent_runtime_status` fails because the anonymous Supabase client has no INSERT policy.

**Solution**: Move the runtime status initialization into the `sync-agent-deployment` edge function, which already uses the service_role and is called as a recovery mechanism.

**File**: `supabase/functions/sync-agent-deployment/index.ts`

- Add runtime status upsert after successful agent sync:
  ```typescript
  // After updating the agent record successfully
  await supabase.from('agent_runtime_status').upsert({
    agent_id: agentId,
    is_active: false,
    current_goal: `Awaiting AI configuration`,
    performance_metrics: {},
    revenue_generated: 0,
    tasks_completed: 0
  }, { onConflict: 'agent_id' });
  ```

---

### 2. Add Retry Logic for RPC Calls in `sync-on-chain-trades`

**Problem**: The fallback logic only tests RPC connectivity at client initialization. If an RPC fails during `getLogs()` or `readContract()`, there's no retry with alternative endpoints.

**Solution**: Wrap critical RPC calls in a retry helper that cycles through endpoints on failure.

**File**: `supabase/functions/sync-on-chain-trades/index.ts`

- Create a `withRpcRetry` helper function:
  ```typescript
  async function withRpcRetry<T>(
    operation: (client: ReturnType<typeof createPublicClient>) => Promise<T>,
    chain: typeof baseSepolia
  ): Promise<T> {
    for (let i = 0; i < RPC_ENDPOINTS.length; i++) {
      try {
        const client = createPublicClient({
          chain,
          transport: http(RPC_ENDPOINTS[i], { timeout: 15000 }),
        });
        return await operation(client);
      } catch (error) {
        console.warn(`RPC ${RPC_ENDPOINTS[i]} failed, trying next...`);
        if (i === RPC_ENDPOINTS.length - 1) throw error;
      }
    }
    throw new Error('All RPC endpoints exhausted');
  }
  ```

- Wrap `getLogs()` calls with this helper
- Wrap `readContract()` calls for `getAgentState` 

---

### 3. Remove Client-Side `agent_runtime_status` INSERT

**Problem**: The INSERT always fails with 401, generating console noise.

**Solution**: Remove the client-side INSERT from `CreateAgent.tsx` since it's now handled by the edge function.

**File**: `src/pages/CreateAgent.tsx`

- Remove or comment out lines 908-925 (the `agent_runtime_status` INSERT block)
- This eliminates the redundant 401 error in console

---

### 4. Improve Error Handling for Non-Critical Failures

**Problem**: Console shows multiple errors that don't affect the actual outcome but confuse users/developers.

**Solution**: Downgrade non-critical error logging and add clearer success indicators.

**File**: `src/pages/CreateAgent.tsx`

- Change `console.error` to `console.warn` for non-blocking failures
- Add a final success log when agent creation completes despite recovery being needed:
  ```typescript
  console.log('[CreateAgent] Agent created successfully via recovery path');
  ```

---

## Technical Details

### Why RLS Blocks Client Updates

The `agents` table has an UPDATE policy:
```sql
((creator_id = auth.uid()::text) OR (creator_id = auth.jwt() ->> 'sub'))
```

Since the app uses Privy (not Supabase Auth), `auth.uid()` returns NULL and `auth.jwt()` contains no 'sub' claim. This causes all client-side UPDATE attempts to fail with 401.

The recovery mechanism via `sync-agent-deployment` works because it uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS entirely.

### RPC Fallback Strategy

The improved retry logic will:
1. Attempt the primary RPC (configurable via `BASE_SEPOLIA_RPC` env var)
2. Fall back to `base-sepolia.blockpi.network`
3. Fall back to `base-sepolia-rpc.publicnode.com`
4. Only throw after all 3 fail

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/sync-agent-deployment/index.ts` | Add `agent_runtime_status` upsert |
| `supabase/functions/sync-on-chain-trades/index.ts` | Add `withRpcRetry` wrapper for RPC calls |
| `src/pages/CreateAgent.tsx` | Remove client-side runtime status INSERT |

---

## Expected Outcome

After implementation:
- No more 401 errors for `agent_runtime_status` inserts
- No more 500 errors from RPC failures (with automatic fallback)
- Agent creation will show cleaner console output
- The recovery flow via `sync-agent-deployment` will also initialize runtime status

