# Smart Contract Artifacts

⚠️ **DO NOT REGENERATE THESE FILES** ⚠️

## PromptTestToken.json

This file contains the **frozen ABI and bytecode** for the PROMPT test token contract.

### Why Frozen?

- Prevents corruption from runtime compilation
- Ensures consistent deployment across all environments
- Version control tracks changes to contract interface
- Edge functions import from this static file

### When to Update

**Only update if the Solidity source changes:**

1. Modify `PromptTestToken.sol`
2. Compile using Solidity compiler (solc v0.8.20+)
3. Extract ABI and bytecode
4. Replace `PromptTestToken.json` contents
5. Commit to git with detailed message
6. Test all edge functions that use the ABI

### Used By

- `supabase/functions/deploy-prompt-token-v2/index.ts`
- `supabase/functions/build-trade-tx/index.ts`
- Any function that interacts with PROMPT token contracts

### Contract Details

- **Name:** PromptTestToken
- **Symbol:** PROMPT
- **Type:** Standard ERC20
- **Initial Supply:** 1 billion tokens (1e9 * 1e18)
- **Network:** Base Sepolia (testnet)
