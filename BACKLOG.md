# Promptbox Backlog (Day 6.5 and Near-Term)

_Last updated: 2025-11-04 (ET)_

This backlog captures **low-risk, high-value** backend (Promptbox proper) hardening items deferred from Day 6, plus a small set of optional MFE follow-ups. Organized by **Priority** and designed to be implemented without disrupting current trading flows.

---

## Legend
- **Repo**: `promptbox` = Promptbox.com backend (Supabase: cjzazu…) · `mfe` = trade.promptbox.com (Supabase: aqihmc…)
- **Priority**: P0 (now), P1 (next), P2 (later)
- **Status**: TODO / IN PROGRESS / DONE / PARKED
- **Estimate**: Eng hours (excluding review/deploy)

---

## Dependencies & Blockers

| Item | Blocks | Blocked By | Can Deploy Independently? |
|------|--------|------------|---------------------------|
| Error Envelope Shim | MFE shim switch (A) | None | ✅ Yes |
| Rate Limiting for list-tokens | None | None | ✅ Yes |
| get-liquidity Caching Policy | None | None | ✅ Yes |
| Standardize Error Envelopes | None | Error Envelope Shim (recommended) | ✅ Yes |
| Telemetry & Observability | None | None | ✅ Yes |
| Pagination + ETag for list-tokens | None | None | ✅ Yes |
| MFE: Switch to Shim | None | Error Envelope Shim (MUST be live) | ❌ No |
| MFE: Rate-Limit Feedback | None | Rate Limiting deployed | ❌ No |
| MFE: Health Badge Polish | None | None | ✅ Yes |

---

## 🔵 Promptbox Proper (Backend API)

### 1) Error Envelope Shim for Trading
- **Repo**: `promptbox`
- **Priority**: **P0**
- **Status**: TODO
- **Why**: Deliver consistent API errors without risky refactor of `execute-bonding-curve-trade-v4`.
- **Scope**:
  - New function: `supabase/functions/execute-trade-shim/index.ts`
  - Internally calls `execute-bonding-curve-trade-v4` (service role).
  - Normalize output:
    - Success → `{ ok: true, apiVersion: 'v1', data: {...} }`
    - Failure → `{ ok: false, apiVersion: 'v1', error, code, details }`
  - Adopt a small code taxonomy: `VALIDATION_ERROR`, `BUSINESS_RULE_VIOLATION`, `INTERNAL_ERROR`.
- **Acceptance**:
  - Standard envelope for all paths (4xx/5xx) with stable `code`.
  - Logs include requestId, route, code.
- **Estimate**: 1.5h
- **Risk**: Low (no change to core trade logic).
- **Note**: MFE can switch to `/execute-trade-shim` later.

**Testing**:
```bash
# Success case
curl -X POST https://cjzazuymrhmxkhuflzvq.supabase.co/functions/v1/execute-trade-shim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"agentId":"test-123","userId":"user-456","tradeType":"buy","amountPrompt":"10"}'

# Expected: {"ok":true,"apiVersion":"v1","data":{...}}

# Validation error
curl -X POST https://cjzazuymrhmxkhuflzvq.supabase.co/functions/v1/execute-trade-shim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{"agentId":"","userId":"user-456","tradeType":"buy"}'

# Expected: {"ok":false,"apiVersion":"v1","error":"Validation failed","code":"VALIDATION_ERROR","details":{...}}
```

**Edge Cases**:
- Missing authentication token → `401` with standard envelope
- Invalid `tradeType` → `VALIDATION_ERROR`
- Insufficient balance → `BUSINESS_RULE_VIOLATION`
- Network timeout to v4 → `INTERNAL_ERROR` with 503

**Security**:
- ⚠️ Never expose internal stack traces in `error` field
- ⚠️ Sanitize `details` object - no wallet addresses/private keys in logs
- ✅ Log full errors server-side with `requestId` for debugging
- ✅ Validate all inputs before forwarding to v4

**Rollback**:
- **If**: Response format breaks existing clients
- **Action**: Remove function from `config.toml`, redeploy
- **Time**: <5 min
- **Impact**: None (MFE not using it yet; old endpoint unaffected)

---

### 2) Rate Limiting for `list-tokens`
- **Repo**: `promptbox`
- **Priority**: **P1**
- **Status**: TODO
- **Why**: Prevent bursts/scraping; caching exists but doesn't throttle.
- **Scope**:
  - Shared helper: `supabase/functions/_shared/rateLimit.ts` (already exists)
  - Apply to `list-tokens` (optionally `get-token-metadata`, `resolve-token`).
  - Sliding window: **100 req/min** per IP+route.
  - On 429 add headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
  - Use standard error envelope.
- **Acceptance**:
  - 101 rapid calls in 60s produce ≥1 **429** with headers.
  - Normal use unaffected.
- **Estimate**: 1h
- **Risk**: Possible NAT/CDN false positives (acceptable for now).
- **Future (P2)**: Redis store; per-API-key limits; token-bucket bursts.

**Testing**:
```bash
# Trigger rate limit
for i in {1..105}; do
  curl -s https://cjzazuymrhmxkhuflzvq.supabase.co/functions/v1/list-tokens \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" &
done
wait

# Expected on 101st+: 
# Status: 429
# Headers: X-RateLimit-Limit: 100, X-RateLimit-Remaining: 0, X-RateLimit-Reset: [timestamp]
# Body: {"ok":false,"apiVersion":"v1","error":"Rate limit exceeded","code":"RATE_LIMIT_EXCEEDED"}
```

**Edge Cases**:
- Shared NAT IP → Multiple users may hit limit
- CDN/proxy forwarding → Use `X-Forwarded-For` header
- Burst then pause → Sliding window should recover

**Security**:
- ⚠️ Consider Cloudflare/proxy IP headers for true client IP detection
- ✅ Log rate-limited requests with IP and `requestId`
- ✅ Future: Rate limit by API key when authentication is added

**Rollback**:
- **If**: False positives block legitimate users
- **Action**: Increase threshold in `rateLimit.ts` from `100→500/min` or disable check temporarily
- **Time**: <2 min
- **Impact**: Temporary elevated load until proper fix deployed

---

### 3) Explicit Caching Policy for `get-liquidity`
- **Repo**: `promptbox`
- **Priority**: **P1**
- **Status**: TODO
- **Why**: Highly dynamic; prevent stale quotes.
- **Scope**:
  - Add `Cache-Control: no-store`.
  - Body includes `apiVersion: 'v1'` and `asOf` timestamp.
- **Acceptance**:
  - HEAD/GET shows `Cache-Control: no-store`.
  - Response includes `asOf`.
- **Estimate**: 0.5h
- **Risk**: None
- **Optional (P2)**: Allow `max-age=5, stale-while-revalidate=15` only when returning `blockNumber` or sufficiently fresh `asOf`.

**Testing**:
```bash
# Verify headers
curl -I https://cjzazuymrhmxkhuflzvq.supabase.co/functions/v1/get-liquidity?agentId=test-123 \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Expected headers:
# Cache-Control: no-store
# Content-Type: application/json

# Verify body includes asOf
curl https://cjzazuymrhmxkhuflzvq.supabase.co/functions/v1/get-liquidity?agentId=test-123 \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Expected: {"ok":true,"apiVersion":"v1","data":{...},"asOf":"2025-11-04T12:34:56Z"}
```

**Edge Cases**:
- Browser ignoring `no-store` → Document behavior
- CDN caching despite header → Verify CDN config

**Rollback**:
- **If**: Performance degrades due to no caching
- **Action**: Change to `Cache-Control: max-age=5, must-revalidate`
- **Time**: <2 min
- **Impact**: Slight latency reduction, minimal staleness risk

---

### 4) Standardize Error Envelopes (Selective)
- **Repo**: `promptbox`
- **Priority**: **P2**
- **Status**: PARKED
- **Why**: Better DX/observability, but lower ROI than shim; avoid core-path churn.
- **Scope**:
  - Standard:
    ```json
    {
      "ok": false,
      "apiVersion": "v1",
      "error": "Human-readable message",
      "code": "MACHINE_READABLE_CODE",
      "details": {}
    }
    ```
  - Apply first to non-critical endpoints: `resolve-token`, `list-tokens`, `get-token-metadata`.
- **Acceptance**: Documented codes; consistent logs.
- **Estimate**: 2–4h (incremental)
- **Risk**: Low

**Error Code Taxonomy** (to document):
- `VALIDATION_ERROR` - Invalid input parameters
- `NOT_FOUND` - Resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Unexpected server error
- `BUSINESS_RULE_VIOLATION` - Valid input but business logic prevents action

**Testing**:
- Each endpoint should have test cases for all applicable error codes
- Log aggregation should group by `code` for monitoring

---

### 5) Telemetry & Observability Enhancements
- **Repo**: `promptbox`
- **Priority**: **P2**
- **Status**: TODO
- **Why**: Faster incident response at scale.
- **Scope**:
  - Structured JSON logs: `requestId`, `route`, `latencyMs`, `status`, `code`.
  - Simple per-route counters (success/error) to Supabase logs or external sink.
- **Acceptance**: Queryable p50/p95 by route; daily error counts by `code`.
- **Estimate**: 2–3h

**Log Format**:
```json
{
  "requestId": "req_abc123",
  "route": "/execute-trade-shim",
  "method": "POST",
  "status": 200,
  "latencyMs": 145,
  "code": "SUCCESS",
  "userId": "user-456",
  "timestamp": "2025-11-04T12:34:56Z"
}
```

**Metrics to Track**:
- Request count per endpoint per hour
- p50, p95, p99 latency per endpoint
- Error rate by `code`
- Rate limit hit count

---

### 6) Pagination + ETag for `list-tokens`
- **Repo**: `promptbox`
- **Priority**: **P2**
- **Status**: TODO
- **Why**: Scale-friendly payloads and browser caching.
- **Scope**:
  - Query params: `limit`, `cursor`.
  - Response: `nextCursor`, `apiVersion`, `ETag` (hash of payload).
  - Honor `If-None-Match` for **304**.
- **Acceptance**: Page-through + 304 path verified.
- **Estimate**: 2–3h

**Testing**:
```bash
# First page
curl https://cjzazuymrhmxkhuflzvq.supabase.co/functions/v1/list-tokens?limit=50 \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -D headers.txt

# Expected: ETag header, nextCursor in response

# Second page
NEXT_CURSOR=$(jq -r '.data.nextCursor' < response.json)
curl "https://cjzazuymrhmxkhuflzvq.supabase.co/functions/v1/list-tokens?limit=50&cursor=$NEXT_CURSOR" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# 304 Not Modified
ETAG=$(grep -i etag headers.txt | cut -d' ' -f2)
curl https://cjzazuymrhmxkhuflzvq.supabase.co/functions/v1/list-tokens?limit=50 \
  -H "If-None-Match: $ETAG" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Expected: 304 status, empty body
```

---

## 🟢 MFE (trade.promptbox.com)

> Day 6 integration is complete; these are QoL follow-ups.

### A) Switch to Shim Endpoint (when live)
- **Repo**: `mfe`
- **Priority**: **P1**
- **Status**: TODO
- **Scope**: Use `/execute-trade-shim` in `src/lib/promptboxApi.ts` and consuming components.
- **Acceptance**: Uniform error toasts/messages.
- **Estimate**: 0.5h

**Testing**:
- Successful trade → Toast shows success message
- Validation error → Toast shows `error` from envelope
- Rate limit → Toast shows "Too many requests" with retry time
- Network error → Toast shows generic error

**Rollback**:
- **If**: New endpoint breaks trading
- **Action**: Revert to `/execute-bonding-curve-trade-v4` in code
- **Time**: <5 min
- **Impact**: Loss of standardized errors, back to previous behavior

---

### B) Surface Rate-Limit Feedback
- **Repo**: `mfe`
- **Priority**: **P2**
- **Status**: TODO
- **Scope**: On 429, read `X-RateLimit-Remaining`/`X-RateLimit-Reset` → toast: "Too many requests. Try again in N seconds."
- **Estimate**: 0.5h

**Testing**:
- Trigger rate limit on backend
- Verify toast shows countdown timer
- Verify retry button appears after reset time

---

### C) Health Badge Polish
- **Repo**: `mfe`
- **Priority**: **P2**
- **Status**: TODO
- **Scope**: Tooltip includes `{ mode, apiVersion, ts }` from `/healthz`.
- **Estimate**: 0.25h

---

## 🔐 Security / Ops (Cross-Cutting)

### General Security Requirements
- **P1 (Promptbox)**: Mask secrets; no stack traces to clients
  - ✅ Environment variables never logged
  - ✅ Stack traces only in server logs with `requestId`
  - ✅ User data sanitized before logging
  
- **P2 (Promptbox)**: Simple WAF-style filters (UA blocks / geo throttles if abused)
  - Block known scraper UAs
  - Consider geo-blocking if specific regions show abuse patterns
  
- **P2 (Promptbox)**: Circuit-breaker for upstream RPC flaps → return 503 after N failures in window
  - Monitor RPC provider health
  - Fail-fast to prevent cascade failures
  - Return `{"ok":false,"code":"SERVICE_UNAVAILABLE"}` with retry-after header

### Input Validation
- All endpoints must validate:
  - ✅ Required fields present
  - ✅ Field types match schema
  - ✅ String length limits enforced
  - ✅ Special characters sanitized
  - ✅ No SQL injection vectors

---

## 🔄 Rollback Procedures

### Quick Reference

| Item | Trigger | Action | Time | Impact |
|------|---------|--------|------|--------|
| Error Envelope Shim | Response format breaks clients | Remove from config.toml | <5 min | None (old endpoint still works) |
| Rate Limiting | False positives | Increase threshold 100→500/min | <2 min | Temporary load spike |
| get-liquidity Caching | Performance issues | Change to `max-age=5` | <2 min | Minimal staleness |
| MFE Shim Switch | Trading breaks | Revert to old endpoint | <5 min | Loss of error standardization |

### General Rollback Process
1. Identify issue via monitoring/alerts
2. Check Supabase Edge Function logs for errors
3. Execute rollback action (config change or code revert)
4. Deploy via Supabase CLI or dashboard
5. Verify rollback successful
6. Post-mortem within 24h

---

## 📊 Post-Deployment Monitoring

### Error Envelope Shim
- [ ] Watch for spike in 500 errors (alert if >5/min)
- [ ] Monitor avg response time (<200ms baseline, alert if >500ms)
- [ ] Track `code` distribution in logs (expect 80%+ SUCCESS)
- [ ] Verify `requestId` appears in all logs

### Rate Limiting
- [ ] Count 429s per hour (expect <10 initially, alert if >100/hr)
- [ ] Identify top blocked IPs/patterns
- [ ] p95 latency unchanged (<50ms overhead)
- [ ] No false positives reported by users

### get-liquidity Caching
- [ ] Verify `Cache-Control: no-store` in all responses
- [ ] Monitor request rate (may increase slightly)
- [ ] Track freshness via `asOf` timestamps
- [ ] p95 latency <300ms

### General Metrics
- **Golden Signals**:
  - Latency: p50 <100ms, p95 <300ms, p99 <1s
  - Traffic: Track requests/min per endpoint
  - Errors: <1% error rate
  - Saturation: Database connection pool <80%

- **Custom Metrics**:
  - Rate limit hits per endpoint
  - Error code distribution
  - Cache hit/miss rates (future)

---

## 🔢 API Version History

| Endpoint | Current Version | Changes in Backlog | Breaking? | Target Version | Notes |
|----------|----------------|-------------------|-----------|----------------|-------|
| /execute-trade-shim | - (new) | Initial release | N/A | v1 | New endpoint, not breaking |
| /execute-bonding-curve-trade-v4 | v4 | None | No | v4 | Unchanged, legacy |
| /list-tokens | v1 | Add pagination (`cursor`, `limit`) | No (optional params) | v1 | Backward compatible |
| /get-liquidity | v1 | Change cache headers, add `asOf` | No | v1 | Additive change |
| /get-token-metadata | v1 | None (already has rate limiting) | No | v1 | Stable |
| /resolve-token | v1 | Potential error envelope update | No | v1 | Additive |
| /get-ohlc | v1 | None (already has caching) | No | v1 | Stable |

### Version Naming Convention
- `v1`, `v2` for major breaking changes
- `apiVersion` field in response for client feature detection
- Deprecation policy: 90 days notice for breaking changes

---

## 📌 Links / References
- [Day 6 Completion Status](./DAY_6_COMPLETION_STATUS.md)
- [Trade Promptbox Integration Plan](./TRADE_PROMPTBOX_INTEGRATION_PLAN.md)
- [MFE Integration Guide](./MFE_INTEGRATION_GUIDE.md)
- [API Integration Documentation](./API_INTEGRATION.md)
- Supabase Dashboard (Promptbox): https://supabase.com/dashboard/project/cjzazuymrhmxkhuflzvq
- Supabase Dashboard (MFE): https://supabase.com/dashboard/project/aqihmckqkscexzhqztec

---

## ✅ Ready-To-Implement Checklist

### P0 (This Week)
- [ ] Create `execute-trade-shim` + structured logs
  - [ ] Write function code
  - [ ] Add to config.toml
  - [ ] Test all error paths
  - [ ] Deploy to production
  - [ ] Monitor for 24h

### P1 (Next Week)
- [ ] Add rate limiting to `list-tokens`
  - [ ] Apply rateLimit helper
  - [ ] Test threshold triggers
  - [ ] Deploy with monitoring
- [ ] Set `Cache-Control: no-store` on `get-liquidity`
  - [ ] Update headers
  - [ ] Add `asOf` to response
  - [ ] Test and deploy
- [ ] MFE: switch to shim endpoint once live
  - [ ] Update API client
  - [ ] Update error handling
  - [ ] Deploy to MFE

### P2 (Future Sprints)
- [ ] Document error code taxonomy
- [ ] Add structured logging fields to all endpoints
- [ ] Plan pagination + ETag for `list-tokens`
- [ ] Implement telemetry dashboard
- [ ] MFE: Rate-limit feedback UI
- [ ] MFE: Health badge polish

---

## Ownership (suggested)
- **Backend (Promptbox)**: Core API team
  - Lead: [TBD]
  - Reviewers: Security, DevOps
- **MFE**: Frontend team
  - Lead: [TBD]
  - Reviewers: UX, Backend
- **QA**: Shared (cURL scripts + Postman collection updates)
  - Create test suite for each P0/P1 item
  - Automated smoke tests post-deployment
- **DevOps**: Monitoring setup
  - Configure alerts for new metrics
  - Update runbooks

---

## Changelog
- **2025-11-04**: Initial backlog drafted from Day 6 wrap-up (error shim, rate limit, liquidity cache policy, optional MFE polish)
- **2025-11-04**: Enhanced with dependencies matrix, testing requirements, rollback procedures, monitoring checklist, security notes, API version tracking, and post-deployment verification steps
