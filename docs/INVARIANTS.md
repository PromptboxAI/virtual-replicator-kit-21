# Bonding Curve V5 - System Invariants

## Overview
This document defines the critical invariants that MUST hold true at all times in the Bonding Curve V5 system. These invariants are tested in our test suite and enforced by the smart contracts.

## Critical Invariants

### 1. Reserve Safety
**Invariant:** `promptReserves >= 0` at all times

**Why:** The bonding curve must never have negative reserves. This would indicate either:
- Double-spending
- Accounting errors
- Reentrancy attacks

**Enforcement:**
- Solidity: `require(promptOut <= state.promptReserves)` before any transfer
- Testing: Randomized buy/sell sequences verify reserve never goes negative

### 2. Supply Bounds
**Invariant:** `0 <= tokensSold <= GRADUATION_SUPPLY (1M tokens)`

**Why:** 
- No tokens can exist before any are sold
- Cannot exceed the graduation supply (enforced by bonding curve)
- After graduation, supply is fixed

**Enforcement:**
- Solidity: `require(state.tokensSold + tokensOut <= GRADUATION_SUPPLY)` in `buy()`
- Solidity: `require(tokensIn <= state.tokensSold)` in `sell()`

### 3. Reserve Consistency (Sell)
**Invariant:** On sell, `reserve decrements by promptGross (BEFORE fees)`

**Why:** Reserve represents total PROMPT value backing tokens. When tokens are burned, the full backing value must be removed from reserves, even though seller receives `promptGross - sellFee`.

**Example:**
```
Before: reserve = 1000 PROMPT
Sell: tokensIn = 100, promptGross = 50 PROMPT, sellFee = 2.5 PROMPT
After: reserve = 950 PROMPT (decremented by 50, not 47.5)
Seller receives: 47.5 PROMPT
Fee recipients receive: 2.5 PROMPT (split among creator/platform/LP)
```

**Enforcement:**
- Solidity: `state.promptReserves -= promptGross;` (line 272)
- Testing: Verify reserve change equals gross amount, not net

### 4. Graduation One-Way
**Invariant:** Once `phase = Graduated`, agent can never return to `Active`

**Why:**
- Prevents manipulation of graduation state
- Ensures LP pool creation is irreversible
- Users expect graduated agents to be on DEX permanently

**Enforcement:**
- Solidity: No function can set `phase = Active` after graduation
- Solidity: All buy/sell functions `require(state.phase == AgentPhase.Active)`

### 5. Slippage Protection
**Invariant:** 
- Buy: `tokensOut >= minTokensOut` OR revert
- Sell: `promptOut >= minPromptOut` OR revert

**Why:** Protects users from:
- Front-running
- MEV attacks
- Stale price quotes

**Enforcement:**
- Solidity: `require(tokensOut >= minTokensOut, "Slippage exceeded")` in `buy()`
- Solidity: `require(promptOut >= minPromptOut, "Slippage exceeded")` in `sell()`

### 6. Math Precision (WAD Parity)
**Invariant:** TypeScript calculation ⇄ Solidity calculation differ by ≤ 1 wei

**Why:**
- Frontend must show accurate previews
- Users expect transaction results to match previews
- Prevents arbitrage due to calculation differences

**Enforcement:**
- Testing: Parity test suite with 1000+ randomized scenarios
- Both use proper quadratic solution (not approximations)

### 7. No Partial Fills
**Invariant:** If `buy()` would exceed `GRADUATION_SUPPLY`, transaction reverts (no partial fill)

**Why:**
- Prevents users from receiving fewer tokens than expected
- Simplifies accounting
- Prevents graduation threshold gaming

**Enforcement:**
- Solidity: `require(state.tokensSold + tokensOut <= GRADUATION_SUPPLY)`

### 8. Reentrancy Protection
**Invariant:** All state updates MUST complete before external calls

**Why:**
- Prevents reentrancy attacks
- Ensures consistent state across contract interactions

**Enforcement:**
- Solidity: `nonReentrant` modifier on `buy()` and `sell()`
- Pattern: Check-Effects-Interactions (state updates before transfers)

### 9. Fee Distribution Completeness
**Invariant:** `creatorFeeBps + platformFeeBps + lpFeeBps = BASIS_POINTS (10000)`

**Why:**
- All fees must be distributed
- No fees left unaccounted
- Prevents loss of funds

**Enforcement:**
- Solidity: `require(_creatorFeeBps + _platformFeeBps + _lpFeeBps == BASIS_POINTS)` in `setFeeDistribution()`

### 10. Phase Consistency
**Invariant:** 
- If `phase = Active`, then `promptReserves < graduationThresholdPrompt`
- If `phase = Graduated`, then `promptReserves >= graduationThresholdPrompt`

**Why:**
- Phase must reflect actual reserve state
- Prevents trading when agent should be graduated

**Enforcement:**
- Solidity: `_canGraduate()` checks threshold
- Solidity: `_graduate()` only called when threshold met
- Automatic graduation check after each buy

## Testing Requirements

### Unit Tests
- [x] Reserve never negative (1000 random buy/sell sequences)
- [x] Supply within bounds (test edge cases: 0, max, max+1)
- [x] Sell reserve decrement by gross (10 scenarios)
- [x] Phase transition one-way (attempt to revert after graduation)
- [x] Slippage protection (test with various slippage tolerances)
- [x] Math parity TS ↔ Solidity (1000 randomized inputs)
- [x] No partial fills (test buy exceeding max supply)
- [x] Reentrancy protection (use ReentrancyGuard test harness)
- [x] Fee distribution completeness (test all fee setters)

### Integration Tests
- [x] Full lifecycle: create → buy → sell → graduate
- [x] Multiple agents active simultaneously
- [x] Graduation with partial supply sold
- [x] Fee configuration changes mid-lifecycle

### Invariant Violation Scenarios (Must Revert)
1. ❌ Buy after graduation → REVERT
2. ❌ Sell after graduation → REVERT
3. ❌ Buy exceeding max supply → REVERT
4. ❌ Sell more than tokensSold → REVERT
5. ❌ Sell with insufficient reserves → REVERT
6. ❌ Set fee distribution not summing to 10000 → REVERT

## Audit Checklist
- [ ] Static analysis (Slither/Mythril) clean
- [ ] All invariants tested with >95% coverage
- [ ] Parity tests pass for 6d (USDC) and 18d (PROMPT) decimals
- [ ] Gas benchmarks: buy <200k, sell <150k, graduate <300k
- [ ] Emergency pause drill completed on testnet
- [ ] Multisig ownership verified
- [ ] Fee recipient addresses verified

## Maintenance
This document MUST be updated whenever:
- New invariants are discovered
- Contract logic changes
- Critical bugs are found and fixed

**Last Updated:** 2025-11-19  
**Version:** V5.0.0
