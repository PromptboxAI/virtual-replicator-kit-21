# Bonding Curve V5 Implementation

## Overview

This directory contains the Bonding Curve V5 smart contracts and integration code. V5 represents a complete architectural shift to a fully on-chain, PROMPT-native token launch system.

## Smart Contracts

### 1. AgentTokenV5.sol
- Simple ERC20 token with restricted minting
- Only the BondingCurveV5 contract can mint/burn tokens
- Max supply: 1 billion tokens
- No direct minting by users

### 2. BondingCurveV5.sol
- Central contract managing all agent tokens
- Linear bonding curve: `price = P0 + (P1 - P0) * (supply / GRADUATION_SUPPLY)`
- Two-way trading (buy and sell)
- 5% buy fee split: 2% creator, 2% platform, 1% LP
- 0% sell fee
- Reserve-based graduation at configurable PROMPT threshold

### 3. AgentFactoryV5.sol
- Factory for deploying new agent tokens
- Creates AgentTokenV5 and registers with BondingCurveV5 in one transaction
- Transfers ownership to creator after deployment

## Key Features

### PROMPT-Native
- All pricing in PROMPT tokens (no USD oracle needed for core logic)
- Reserves held in PROMPT
- Graduation based on PROMPT reserves

### Linear Bonding Curve
```
price(supply) = P0 + (P1 - P0) * (supply / GRADUATION_SUPPLY)

Buy: tokens ≈ (2 * promptIn) / (priceStart + priceEnd)
Sell: promptOut = tokens * (priceStart + priceEnd) / 2
```

### Graduation Logic
- Graduates when PROMPT reserves ≥ graduationThresholdPrompt
- Default threshold: 42,000 PROMPT
- Graduation supply: 1,000,000 tokens

### Fee Structure
**Buy (5% total):**
- 2% to creator (40% of fee)
- 2% to platform vault (40% of fee)
- 1% to LP fund (20% of fee)

**Sell (0%):**
- No fees on sells

## Frontend Integration

### Library: `src/lib/bondingCurveV5.ts`
Provides pure TypeScript functions for:
- Price calculations
- Buy/sell return calculations
- Fee distribution
- Graduation checks
- Market cap calculations

### Hook: `src/hooks/useBondingCurveV5.tsx`
React hook for contract interactions:
- `buyTokens(promptAmount, slippageBps)` - Buy agent tokens
- `sellTokens(tokenAmount, slippageBps)` - Sell agent tokens
- `approvePrompt(amount)` - Approve PROMPT for trading
- Real-time state updates from blockchain

## Deployment Checklist

### 1. Deploy Core Contracts
```bash
# Deploy BondingCurveV5
forge create BondingCurveV5 \
  --constructor-args <PROMPT_TOKEN> <PLATFORM_VAULT> <TREASURY> <OWNER>

# Deploy AgentFactoryV5
forge create AgentFactoryV5 \
  --constructor-args <BONDING_CURVE_V5>
```

### 2. Update Contract Addresses
Update addresses in:
- `src/hooks/useBondingCurveV5.tsx`
- `src/lib/contracts.ts` (add V5 addresses)

### 3. Database Updates
Add V5-specific fields to agents table:
- `bonding_curve_version: 'v5'`
- `agent_id_bytes32: string` (keccak256 hash)
- `v5_config: jsonb` (p0, p1, graduationThreshold)

### 4. Edge Functions
Create V5 deployment functions:
- `deploy-agent-v5/index.ts` - Deploy via AgentFactoryV5
- `execute-trade-v5/index.ts` - Execute V5 trades
- `sync-v5-state/index.ts` - Sync on-chain state to DB

## Testing

### Smart Contract Tests
```bash
forge test --match-contract BondingCurveV5Test
```

### Frontend Tests
```typescript
import { calculateBuyReturn, calculateSellReturn } from '@/lib/bondingCurveV5';

// Test buy calculation
const result = calculateBuyReturn(config, state, 100);
expect(result.tokensOut).toBeGreaterThan(0);

// Test sell calculation
const sellResult = calculateSellReturn(config, state, 1000);
expect(sellResult.promptOut).toBeGreaterThan(0);
```

## Migration Strategy

### For New Agents
- All new agents use V5 by default
- Set `creation_mode: 'smart_contract'` and `bonding_curve_version: 'v5'`

### For Existing Agents
- Mark V3/V4 agents as `legacy: true`
- Display migration banner
- Optional: Provide migration tool (snapshot + redeploy)

## Next Steps

1. **Deploy Contracts** - Deploy to Base Sepolia testnet
2. **Update Frontend** - Update trading interfaces to support V5
3. **Create Edge Functions** - Build V5 deployment and trading functions
4. **Testing** - Comprehensive testing on testnet
5. **Security Audit** - Audit smart contracts before mainnet
6. **Mainnet Deployment** - Deploy to Base mainnet

## Constants Reference

```typescript
GRADUATION_SUPPLY = 1,000,000 tokens
BUY_FEE = 5% (500 bps)
SELL_FEE = 0% (0 bps)
DEFAULT_P0 = 0.00004 PROMPT
DEFAULT_P1 = 0.0001 PROMPT
DEFAULT_GRADUATION_THRESHOLD = 42,000 PROMPT
MAX_SUPPLY = 1,000,000,000 tokens
```

## Resources

- **V5 Spec**: `BONDING_CURVE_V5_SPEC.md`
- **Smart Contracts**: `contracts/` directory
- **Frontend Library**: `src/lib/bondingCurveV5.ts`
- **React Hook**: `src/hooks/useBondingCurveV5.tsx`
