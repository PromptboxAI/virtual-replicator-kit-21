# Privy WalletConnect Double Initialization Fix

## Issue
Privy is initializing WalletConnect twice, causing console errors and iframe load failures.

## Root Cause
Privy dashboard has `wallet_auth: true` enabled, which automatically initializes WalletConnect/Web3Modal even when not explicitly configured in code. This happens twice due to React development mode behavior.

## Current Status

### ✅ Fixed
- Removed WagmiProvider from root App component
- Created WagmiWrapper for pages that need on-chain interactions
- Added buffer polyfill for Web3 libraries
- Fixed auth loading states with stable layout

### ⚠️ Still Occurring
**WalletConnect double initialization:**
```
WalletConnect Core is already initialized. 
Init() was called 2 times.
```

**Privy iframe timeout:**
```
Privy iframe failed to load: Error: Exceeded max attempts before resolving function
```

## Solution Options

### Option 1: Disable Wallet Auth in Privy Dashboard (RECOMMENDED)
1. Go to Privy Dashboard: https://dashboard.privy.io/
2. Select app: `cmcv2r72202fqld0lnr5kgq3k`
3. Navigate to Settings → Login Methods
4. **Disable \"Wallet\" login method** if not actively used
5. This will set `wallet_auth: false` and prevent WalletConnect initialization

### Option 2: Configure Privy to Skip WalletConnect
Update `src/App.tsx` Privy config:
```typescript
<PrivyProvider
  appId="cmcv2r72202fqld0lnr5kgq3k"
  config={{
    // ... existing config
    loginMethods: ['email'], // Already set - ensures only email
    embeddedWallets: {
      createOnLogin: 'off',
    },
    // Add this to prevent WalletConnect initialization:
    walletConnectCloudProjectId: undefined, // Explicitly disable
  }}
>
```

### Option 3: Suppress in Development (NOT RECOMMENDED)
The error is informational in development but won't affect production behavior.

## Pages Requiring Wagmi (On-Chain Interactions)

Currently wrapped with `<WagmiWrapper>`:
- `/faucet` - Token claiming functionality

Pages that MAY need wrapping if using on-chain features:
- `/create` - Uses `useAccount` from wagmi
- `/test-lab`, `/contract-test` - Admin testing pages

## Recommended Action

**Disable wallet authentication in Privy Dashboard** since:
1. App uses external wallets directly via user's browser extension
2. Don't need Privy's wallet connection layer
3. Eliminates WalletConnect conflicts
4. Reduces bundle size
5. Fixes iframe timeout issues

After disabling, both errors should disappear and `/my-agents` footer spacing should stabilize.
