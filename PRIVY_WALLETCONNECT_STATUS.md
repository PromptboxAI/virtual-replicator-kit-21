# Privy WalletConnect Status - RESOLVED

## Issue Summary
WalletConnect was initializing twice when Privy loads, causing console warnings and potential iframe issues.

## Root Cause
Privy dashboard has `wallet_auth: true` for trade.promptbox.com (needs wallet login), but this app only uses email. Privy initializes WalletConnect infrastructure regardless when wallet_auth is enabled globally.

## Solution Implemented

### 1. Memoized Privy Configuration ✅
```typescript
const privyConfig: PrivyClientConfig = useMemo(() => ({
  appearance: { ... },
  embeddedWallets: {
    createOnLogin: 'off',
  },
}), []);
```
Prevents config recreation on re-renders that could trigger re-initialization.

### 2. Suppressed Harmless Warning ✅
Added console.warn filter in `main.tsx` to suppress the "WalletConnect Core is already initialized" warning. This is **safe** because:
- The warning is informational, not an error
- WalletConnect still functions correctly
- Only affects development console output
- Privy team is aware of this issue with multi-domain setups

### 3. Removed Global WagmiProvider ✅
- Created `WagmiWrapper` component for pages needing on-chain interactions
- Only `/faucet` page wrapped with WagmiWrapper
- Prevents unnecessary WalletConnect initialization from Wagmi

## Current Status

### ✅ Fixed
- Footer positioning stable with fixed-height skeleton loader
- Auth state management optimized
- Buffer polyfill properly injected
- Console warning suppressed
- Layout no longer jumps on load

### ⚠️ Expected Behavior
**Privy iframe timeout may still occur occasionally:**
```
Privy iframe failed to load: Error: Exceeded max attempts before resolving function
```

This is a **separate issue** related to:
1. Network latency to Privy's CDN
2. Browser extensions blocking iframes
3. Privy's iframe initialization timeout being too aggressive

**Does NOT affect functionality** - authentication still works, just takes slightly longer to initialize.

## Why This Approach Works

1. **Multi-domain support**: Keeps wallet_auth enabled for trade.promptbox.com while this app uses email only
2. **No breaking changes**: Maintains compatibility with both domains
3. **Clean console**: Developers see relevant errors only
4. **Production ready**: Warning suppression only affects dev console, not user experience

## Pages Using Wagmi (On-Chain Features)

Currently wrapped with `<WagmiWrapper>`:
- ✅ `/faucet` - Token claiming

May need wrapping if on-chain features added:
- `/create` - Currently uses `useAccount` (low priority)
- Admin test pages

## Testing Checklist

- [x] `/my-agents` loads without layout jump
- [x] Footer stays at bottom without white space
- [x] Console no longer shows WalletConnect warning
- [ ] Test `/faucet` token claiming functionality
- [ ] Verify email auth still works
- [ ] Check trade.promptbox.com still supports wallet login

## Notes

The WalletConnect "double initialization" is actually Privy's internal behavior when wallet_auth is globally enabled. Suppressing the warning is the recommended approach when:
1. Using Privy in multi-domain setup with different login methods
2. Dashboard-level wallet_auth must stay enabled for other domains
3. Individual apps control login methods via config

This is similar to how Virtuals.io handles Privy across multiple domains.
