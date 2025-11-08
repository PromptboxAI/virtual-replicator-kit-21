# BondingCurveV5 — Specification v2 (Canonical)

**Status:** Draft for Review  
**Date:** 2025-11-08  
**Purpose:** Define the fully on-chain, PROMPT-native bonding curve architecture for agent token launches

---

## 1. Core Requirements

### 1.1 Architecture Principles

- ✅ **All core mechanics on-chain** — No database as source of truth for pricing, reserves, or graduation state
- ✅ **Two-way trading** — Both buy and sell operations supported during `Curve` phase
- ✅ **PROMPT-native** — All pricing, thresholds, and reserves denominated in PROMPT tokens (18 decimals)
- ✅ **Reserve-based graduation** — Graduation triggered by actual PROMPT reserves, not cumulative volume
- ✅ **Post-graduation behavior:**
  - Curve trading disabled for that agent
  - **Mainnet:** DEX-only trading via Uniswap V3 LP
  - **Testnet:** Simulated LP via events (no real DEX dependency)
- ✅ **Anti-rug protection** — Only curve-minted tokens can be sold back to curve

### 1.2 Key Departures from Current V4

| Aspect | Current V4 | V5 Spec | Rationale |
|--------|-----------|---------|-----------|
| **Source of Truth** | Hybrid (DB + contracts) | 100% on-chain | Trustless, auditable, no DB sync issues |
| **Price Denomination** | USD-based with FX conversion | PROMPT-native | No oracle dependency for core mechanics |
| **Graduation Trigger** | Fixed 42K PROMPT (DB mode) or dynamic USD (contract mode) | Fixed PROMPT reserve threshold per agent | Simple, predictable, no USD oracle risk |
| **Trading After Graduation** | Unclear/disabled | DEX-only (mainnet) / Simulated (testnet) | Clear state transition, mirrors pump.fun/Virtuals |
| **Sell Support** | Disabled by default | Enabled on curve (two-way market) | Functional market even without graduation |
| **Multi-Agent Model** | One contract per agent (V2 contracts) | Single BondingCurveV5 managing all agents | Gas efficient, simpler management |

### 1.3 Non-Goals (Out of Scope for V5)

- ❌ USD-denominated graduation thresholds (future optional mode)
- ❌ Migration of 35 existing testnet agents (mark as legacy)
- ❌ CEX/Coingecko integration for core functionality
- ❌ Complex AMM math (V5 uses linear bonding curve)

---

## 2. Contracts

### 2.1 AgentToken (per agent)

**Type:** ERC20 compliant token  
**Minter:** `BondingCurveV5` contract only

```solidity
contract AgentToken is ERC20 {
    address public immutable minter; // BondingCurveV5
    
    constructor(string memory name, string memory symbol, address _minter) 
        ERC20(name, symbol) 
    {
        minter = _minter;
    }
    
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "AgentToken: not minter");
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external {
        require(msg.sender == minter, "AgentToken: not minter");
        _burn(from, amount);
    }
}
```

**Security Constraints:**
- No arbitrary minting after initialization except via `BondingCurveV5`
- Optional: Locked team allocation (if required) must be enforced at deployment via separate vesting contract
- Burning only callable by `BondingCurveV5` during sell operations

---

### 2.2 AgentFactoryV5

**Purpose:** Deploy new agent tokens and register them with the bonding curve

**Responsibilities:**
1. Deploy `AgentToken` contract
2. Register agent configuration in `BondingCurveV5`
3. Emit creation event for indexers

**Function Signature:**
```solidity
function createAgent(
    string memory name,
    string memory symbol,
    uint256 p0,              // Starting price in PROMPT (18 decimals)
    uint256 k,               // Slope in PROMPT per token (18 decimals)
    uint256 maxSupply,       // Maximum tokens that can be minted via curve
    uint256 graduationThresholdPrompt, // PROMPT reserve needed to graduate
    uint16 feeBuyBps,        // Buy fee in basis points (e.g. 100 = 1%)
    uint16 feeSellBps        // Sell fee in basis points
) external returns (address agentToken);
```

**Events:**
```solidity
event AgentCreated(
    address indexed agentToken,
    address indexed creator,
    uint256 graduationThresholdPrompt,
    uint256 p0,
    uint256 k,
    uint256 maxSupply,
    uint16 feeBuyBps,
    uint16 feeSellBps,
    uint256 timestamp
);
```

**Access Control:**
- ⚠️ **DECISION NEEDED:** Should `createAgent` be permissionless or require platform approval?
  - **Recommendation:** Permissionless on mainnet, admin-only on testnet (to prevent spam)
- Creation fee: TBD (e.g. 100 PROMPT or 0.01 ETH to prevent spam)

---

### 2.3 BondingCurveV5 (Multi-Agent)

**Purpose:** Central contract managing all bonding curve trading and graduation

#### 2.3.1 State Structure

```solidity
enum AgentPhase { Curve, Graduated }

struct AgentConfig {
    uint256 p0;                      // Starting price (18d PROMPT)
    uint256 k;                       // Slope (18d)
    uint256 maxSupply;               // Max tokens mintable on curve
    uint256 graduationThresholdPrompt; // PROMPT reserve to graduate
    uint16 feeBuyBps;                // Buy fee (basis points)
    uint16 feeSellBps;               // Sell fee (basis points)
    bool exists;                     // Registration check
}

struct AgentState {
    uint256 supplySold;              // s = tokens sold via curve
    uint256 promptReserve;           // PROMPT locked in this agent's curve
    AgentPhase phase;                // Curve or Graduated
    address agentToken;              // ERC20 token address
}

mapping(address => AgentConfig) public agentConfig;
mapping(address => AgentState) public agentState;
```

#### 2.3.2 Pricing Formula (Linear Bonding Curve)

**Price function:**
```
p(s) = p0 + k·s
```
Where:
- `s` = tokens sold so far (`supplySold`)
- `p0` = starting price in PROMPT (18 decimals)
- `k` = slope (price increase per token, 18 decimals)

**Cost to buy `dx` tokens from state `s`:**
```
cost = ∫[s, s+dx] p(x) dx
     = p0·dx + k·s·dx + (k/2)·dx²
```

**Refund from selling `dx` tokens at state `s`:**
```
refund = ∫[s-dx, s] p(x) dx
       = p0·dx + k·s·dx - (k/2)·dx²
```

#### 2.3.3 Buy Operation

**Function:**
```solidity
function buy(
    address agentToken,
    uint256 promptAmountIn,
    uint256 minTokensOut
) external nonReentrant;
```

**Logic:**
1. Require `phase == Curve`
2. Transfer `promptAmountIn` from user to contract
3. Calculate buy fee: `fee = promptAmountIn * feeBuyBps / 10000`
4. Net cost: `costNet = promptAmountIn - fee`
5. Solve quadratic for `dx`:
   ```
   If k == 0:
       dx = costNet / p0
   Else:
       A = k / 2
       B = p0 + k * s
       C = -costNet
       discriminant = B² - 4·A·C
       dx = (-B + sqrt(discriminant)) / (2·A)
   ```
6. Require `s + dx <= maxSupply`
7. Mint `dx` tokens to user via `AgentToken(agentToken).mint(msg.sender, dx)`
8. Update state:
   ```
   supplySold += dx
   promptReserve += costNet
   ```
9. Distribute fee (70% agent creator / 30% platform treasury)
10. Emit `TradeExecuted` event
11. Optionally check if `canGraduate()` and auto-trigger graduation

**Slippage Protection:**
- `minTokensOut` prevents sandwich attacks
- Recommended default: `minTokensOut = expected * 0.98` (2% slippage tolerance)

#### 2.3.4 Sell Operation

**Function:**
```solidity
function sell(
    address agentToken,
    uint256 tokenAmountIn,
    uint256 minPromptOut
) external nonReentrant;
```

**Logic:**
1. Require `phase == Curve`
2. Require `tokenAmountIn > 0 && tokenAmountIn <= supplySold`
3. Burn `tokenAmountIn` from user via `AgentToken(agentToken).burn(msg.sender, tokenAmountIn)`
4. Calculate refund before fee:
   ```
   refundGross = p0·dx + k·s·dx - (k/2)·dx²
   ```
5. Calculate sell fee: `fee = refundGross * feeSellBps / 10000`
6. Net refund: `refundNet = refundGross - fee`
7. Require `promptReserve >= refundNet` (ensure liquidity)
8. Transfer `refundNet` PROMPT to user
9. Update state:
   ```
   supplySold -= tokenAmountIn
   promptReserve -= refundNet
   ```
10. Distribute fee (70% agent creator / 30% platform treasury)
11. Emit `TradeExecuted` event

**Anti-Rug Mechanism (CRITICAL):**

⚠️ **DECISION NEEDED:** Choose one implementation:

**Option A: Pure Curve Minting (Recommended)**
- Only `BondingCurveV5` can mint tokens (already enforced in `AgentToken`)
- No team/treasury pre-mint allowed
- **Pros:** Simplest, most secure
- **Cons:** No team allocation

**Option B: Sell Tracking**
```solidity
mapping(address => mapping(address => uint256)) public curveMinted; // agent => user => amount

// In buy():
curveMinted[agentToken][msg.sender] += dx;

// In sell():
require(tokenAmountIn <= curveMinted[agentToken][msg.sender], "Cannot sell non-curve tokens");
curveMinted[agentToken][msg.sender] -= tokenAmountIn;
```
- Allows team allocation, but only curve-minted tokens can be sold
- **Pros:** Supports vesting/team tokens
- **Cons:** More complex, higher gas

**Option C: Blocklist**
```solidity
mapping(address => bool) public blockedFromSelling;

// In sell():
require(!blockedFromSelling[msg.sender], "Address blocked from selling");
```
- **Pros:** Flexible
- **Cons:** Centralized, requires admin management

**Recommendation:** Start with **Option A** for V5 (simplest, most trustless). Add Option B in V6 if team allocations are needed.

#### 2.3.5 Events

```solidity
event TradeExecuted(
    address indexed agentToken,
    address indexed trader,
    bool isBuy,
    uint256 promptAmount,    // Gross amount (before fees)
    uint256 tokenAmount,
    uint256 pricePrompt,     // Instantaneous price at time of trade
    uint256 timestamp
);

event Graduated(
    address indexed agentToken,
    uint256 totalPromptReserve,
    address lpAddress,       // DEX pool address (or address(0) on testnet)
    uint256 timestamp
);

event AgentRegistered(
    address indexed agentToken,
    uint256 p0,
    uint256 k,
    uint256 graduationThresholdPrompt
);
```

---

## 3. Graduation Logic

### 3.1 Trigger Condition

```solidity
function canGraduate(address agentToken) public view returns (bool) {
    AgentState memory state = agentState[agentToken];
    AgentConfig memory config = agentConfig[agentToken];
    
    return (
        state.phase == AgentPhase.Curve &&
        state.promptReserve >= config.graduationThresholdPrompt
    );
}
```

**Key Point:** Graduation is based on **current PROMPT reserves**, not cumulative volume.

**Why reserves, not volume?**
- Prevents wash trading to fake graduation
- Ensures real liquidity exists for DEX pool
- Aligns with user expectation: "X PROMPT raised" = X PROMPT locked

### 3.2 Graduation Process

**Function:**
```solidity
function graduate(address agentToken) external nonReentrant;
```

**Steps:**
1. Require `canGraduate(agentToken) == true`
2. Set `phase = Graduated`
3. Calculate LP parameters:
   ```solidity
   uint256 promptForLP = promptReserve; // All curve reserves go to LP
   uint256 tokensForLP = maxSupply - supplySold; // Remaining unsold supply
   ```
4. Call appropriate integrator:
   - **Mainnet:** `DexIntegrator.createPool(agentToken, promptForLP, tokensForLP)`
   - **Testnet:** `DexIntegratorStub.simulatePool(agentToken, promptForLP, tokensForLP)`
5. Zero out `promptReserve` (transferred to LP or kept in contract for testnet)
6. Emit `Graduated` event

**Who can call `graduate()`?**
- ⚠️ **DECISION NEEDED:**
  - **Option A:** Anyone (permissionless) — incentivize with small reward (e.g. 10 PROMPT bounty)
  - **Option B:** Only agent creator or platform admin
  - **Recommendation:** Option A for decentralization, Option B for testnet control

### 3.3 Post-Graduation State

**Behavior after `phase == Graduated`:**
- ✅ `buy()` reverts with `"Agent graduated"`
- ✅ `sell()` reverts with `"Agent graduated"`
- ✅ Frontend disables bonding curve UI
- ✅ Frontend shows:
  - **Mainnet:** "Trade on DEX" button (link to Uniswap pool)
  - **Testnet:** "Graduated (Testnet Simulation)" badge

---

## 4. DEX Integration

### 4.1 DexIntegrator (Mainnet)

**Purpose:** Create Uniswap V3 pool and add liquidity on graduation

```solidity
interface IDexIntegrator {
    function createPool(
        address agentToken,
        uint256 promptAmount,
        uint256 tokenAmount
    ) external returns (address poolAddress);
}
```

**Implementation Details:**
- Create pool: `AgentToken / PROMPT`
- Fee tier: 1% (or configurable)
- Initial price: Set by ratio `promptAmount / tokenAmount`
- Liquidity locked via `LPTokenLock` contract (existing)
- Return pool address for `Graduated` event

### 4.2 DexIntegratorStub (Testnet)

**Purpose:** Simulate graduation without real DEX dependency

```solidity
contract DexIntegratorStub {
    event TestnetPoolSimulated(
        address indexed agentToken,
        uint256 promptAmount,
        uint256 tokenAmount,
        uint256 timestamp
    );
    
    function createPool(
        address agentToken,
        uint256 promptAmount,
        uint256 tokenAmount
    ) external returns (address) {
        emit TestnetPoolSimulated(agentToken, promptAmount, tokenAmount, block.timestamp);
        return address(0); // No real pool on testnet
    }
}
```

**Testnet Behavior:**
- PROMPT stays in `BondingCurveV5` contract (or transferred to treasury)
- No real LP tokens minted
- Frontend shows simulation badge

---

## 5. Oracles & USD (View-Only)

### 5.1 Design Principle

**USD is for display only. It does NOT affect bonding curve logic.**

### 5.2 IPromptUsdOracle

```solidity
interface IPromptUsdOracle {
    function latestAnswer() external view returns (int256); // e.g. 1e8 = $1.00
    function decimals() external view returns (uint8);      // Should return 8
}
```

### 5.3 MockPromptUsdOracle (Testnet)

```solidity
contract MockPromptUsdOracle is IPromptUsdOracle {
    int256 public price;
    uint8 public constant decimals = 8;
    address public owner;
    
    constructor(int256 _initialPrice) {
        price = _initialPrice; // e.g. 10_000_000 = $0.10
        owner = msg.sender;
    }
    
    function latestAnswer() external view override returns (int256) {
        return price;
    }
    
    function setPrice(int256 _newPrice) external {
        require(msg.sender == owner, "Not owner");
        price = _newPrice;
    }
}
```

**Testnet Default:** Set to `$0.10` for stable demos

### 5.4 BondingCurveViewV5 (Read-Only Helper)

**Purpose:** Provide frontend with all metrics in one call

```solidity
struct AgentMetrics {
    // PROMPT-native (source of truth)
    uint256 pricePrompt;             // Current price in PROMPT
    uint256 promptReserve;           // Locked PROMPT
    uint256 graduationThresholdPrompt;
    uint256 supplySold;
    uint256 maxSupply;
    AgentPhase phase;
    bool canGraduate;
    
    // USD-derived (view-only)
    uint256 priceUsd;                // pricePrompt * promptUsdRate (scaled)
    uint256 reserveUsd;              // promptReserve * promptUsdRate
    uint256 graduationThresholdUsd;
    uint256 marketCapUsd;            // maxSupply * priceUsd
}

function getMetrics(address agentToken) external view returns (AgentMetrics memory);
```

**Implementation:**
```solidity
function getMetrics(address agentToken) external view returns (AgentMetrics memory) {
    AgentConfig memory config = curve.agentConfig(agentToken);
    AgentState memory state = curve.agentState(agentToken);
    
    // Calculate current price
    uint256 pricePrompt = config.p0 + (config.k * state.supplySold);
    
    // Get USD rate from oracle
    int256 promptUsdRate = oracle.latestAnswer(); // e.g. 10_000_000 = $0.10
    require(promptUsdRate > 0, "Invalid oracle price");
    
    // Convert to USD (8 decimals from oracle, 18 from PROMPT)
    uint256 priceUsd = (pricePrompt * uint256(promptUsdRate)) / 1e18;
    uint256 reserveUsd = (state.promptReserve * uint256(promptUsdRate)) / 1e18;
    uint256 graduationThresholdUsd = (config.graduationThresholdPrompt * uint256(promptUsdRate)) / 1e18;
    uint256 marketCapUsd = (config.maxSupply * priceUsd) / 1e18;
    
    return AgentMetrics({
        pricePrompt: pricePrompt,
        promptReserve: state.promptReserve,
        graduationThresholdPrompt: config.graduationThresholdPrompt,
        supplySold: state.supplySold,
        maxSupply: config.maxSupply,
        phase: state.phase,
        canGraduate: curve.canGraduate(agentToken),
        priceUsd: priceUsd,
        reserveUsd: reserveUsd,
        graduationThresholdUsd: graduationThresholdUsd,
        marketCapUsd: marketCapUsd
    });
}
```

---

## 6. Testnet vs Mainnet

### 6.1 Same Contracts, Different Integrations

| Component | Base Sepolia (Testnet) | Base Mainnet |
|-----------|------------------------|--------------|
| **BondingCurveV5** | ✅ Same contract | ✅ Same contract |
| **AgentFactoryV5** | ✅ Same contract | ✅ Same contract |
| **PROMPT Token** | TestPROMPT (faucet) | Real PROMPT (CEX-listed) |
| **Price Oracle** | MockPromptUsdOracle ($0.10 fixed) | Chainlink/Pyth/TWAP |
| **DEX Integrator** | DexIntegratorStub (events only) | Real Uniswap V3 |
| **Graduation UX** | "Graduated (Testnet Simulation)" | "Trade on DEX" link |

### 6.2 Testnet Banner (Required)

**UI Requirement:** Show this banner on all testnet pages:

> "You are viewing Base Sepolia testnet. USD values use a mock oracle ($0.10 per PROMPT) for demonstration. Bonding curve mechanics are identical to mainnet. Graduated agents simulate DEX behavior via events."

### 6.3 Agent Status Badges

**During Curve Phase:**
- Badge: `On Bonding Curve` (green)
- Show: Buy/Sell buttons, price chart, progress to graduation

**After Graduation:**
- **Testnet Badge:** `Graduated (Testnet Simulation)` (blue)
  - Disable buy/sell
  - Show message: "This agent reached graduation threshold. On mainnet, it would trade on Uniswap."
- **Mainnet Badge:** `Graduated` (gold)
  - Disable buy/sell
  - Show "Trade on DEX" button linking to Uniswap pool

---

## 7. Frontend Integration

### 7.1 Data Sources

**Primary (Source of Truth):**
- `BondingCurveViewV5.getMetrics(agentToken)` for all display data
- `TradeExecuted` events for historical trades
- `Graduated` events for graduation status

**Deprecated (Remove in V5):**
- All `agents` table reads for price/reserves
- All `execute-bonding-curve-trade-v4` function calls
- All `bondingCurveV4.ts` utility functions

### 7.2 Chart Implementation

**TradingView / Lightweight Charts Datafeed:**

**Source:** `TradeExecuted` events via RPC/indexer

**OHLCV Construction:**
```typescript
interface TradeEvent {
  agentToken: string;
  trader: string;
  isBuy: boolean;
  promptAmount: bigint;
  tokenAmount: bigint;
  pricePrompt: bigint;  // Instantaneous price
  timestamp: number;
}

// Convert pricePrompt to USD using oracle
const priceUsd = (pricePrompt * promptUsdRate) / 1e18;

// Build candles (1min, 5min, 1hour, etc.)
// Use first trade in period for Open, last for Close
// Track min/max for High/Low
// Sum tokenAmount for Volume
```

**No CEX dependency** — All data from on-chain events

### 7.3 Key Hooks to Update

**`useAgentPrice`:**
```typescript
// OLD: Reads from database or V4 calculations
// NEW: Calls BondingCurveViewV5.getMetrics()

export function useAgentPrice(agentId: string) {
  const { data: metrics } = useReadContract({
    address: BONDING_CURVE_VIEW_V5,
    abi: bondingCurveViewV5Abi,
    functionName: 'getMetrics',
    args: [agentTokenAddress],
  });
  
  return {
    priceUsd: metrics?.priceUsd,
    pricePrompt: metrics?.pricePrompt,
    // ...
  };
}
```

**`useAgentTokens` (Trading Interface):**
```typescript
// OLD: Calls supabase.functions.invoke('execute-bonding-curve-trade-v4')
// NEW: Calls BondingCurveV5.buy() or .sell() directly via wagmi

const { writeContract } = useWriteContract();

const executeBuy = async (promptAmount: bigint) => {
  await writeContract({
    address: BONDING_CURVE_V5,
    abi: bondingCurveV5Abi,
    functionName: 'buy',
    args: [agentTokenAddress, promptAmount, minTokensOut],
  });
};
```

### 7.4 Migration Path for Existing Agents

**35 Testnet Agents on V4/hybrid:**

**Recommended Approach:** Mark as legacy, no migration

1. Add `legacy: true` flag to `agents` table
2. Show banner on legacy agent pages:
   > "This agent uses the legacy bonding curve (V4). New agents use the updated V5 protocol. Trading is disabled for legacy agents."
3. Disable buy/sell for legacy agents
4. Encourage creators to deploy V5 versions

**DO NOT attempt to migrate:**
- Too complex (holder snapshots, token swaps)
- Testnet data has no real value
- Clean break is clearer for TGE

---

## 8. Security Considerations

### 8.1 Critical Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Reentrancy attacks** | Use `nonReentrant` modifier on all state-changing functions |
| **Integer overflow** | Use Solidity 0.8+ (built-in overflow checks) |
| **Quadratic formula precision loss** | Use fixed-point math library (e.g. PRBMath) |
| **Front-running** | Enforce `minTokensOut` / `minPromptOut` slippage protection |
| **Rug pulls (sell curve-minted)** | Implement Option A (pure curve minting) or Option B (sell tracking) |
| **Oracle manipulation** | Oracle only used for views, not core logic |
| **Graduation front-running** | Permissionless `graduate()` with bounty reward |
| **Locked graduation** | Allow anyone to trigger if threshold met |

### 8.2 Audit Requirements

**Before Mainnet:**
- [ ] External audit by reputable firm (Certik, OpenZeppelin, Trail of Bits)
- [ ] Bug bounty program ($10K+ pool)
- [ ] >1000 testnet transactions across 10+ agents
- [ ] Gas optimization review (<200K gas per trade)
- [ ] Emergency pause mechanism (admin multisig)

### 8.3 Admin Controls

**Required Admin Functions:**
- `pause()` / `unpause()` — Emergency circuit breaker
- `updateTreasury(address)` — Change fee recipient
- `updateOracle(address)` — Update USD oracle (view-only)

**Forbidden Admin Powers:**
- ❌ Cannot change curve parameters after agent creation
- ❌ Cannot withdraw agent reserves (locked until graduation)
- ❌ Cannot block graduation if threshold met

---

## 9. Implementation Order

### Phase 1: Contract Development (Week 1-2)

**Deliverables:**
1. [ ] `BondingCurveV5.sol` with buy/sell/graduate
2. [ ] `AgentFactoryV5.sol` with registration
3. [ ] `AgentToken.sol` with mint/burn restrictions
4. [ ] `DexIntegratorStub.sol` for testnet
5. [ ] `MockPromptUsdOracle.sol` with owner controls
6. [ ] `BondingCurveViewV5.sol` for frontend metrics
7. [ ] Unit tests (>90% coverage)
8. [ ] Deployment scripts for Base Sepolia

**Success Criteria:**
- All contracts compile without warnings
- Buy/sell math matches spec exactly
- Can create 5 test agents and trade successfully
- Graduation triggers correctly at threshold

### Phase 2: Frontend Integration (Week 2-3)

**Deliverables:**
1. [ ] Generate TypeScript ABIs
2. [ ] Update `src/lib/contracts.ts` with V5 addresses
3. [ ] Replace `useAgentPrice` with `BondingCurveViewV5` reads
4. [ ] Replace trading functions with direct contract calls
5. [ ] Build chart datafeed from `TradeExecuted` events
6. [ ] Add testnet banner and graduation badges
7. [ ] Disable legacy V4 agent trading

**Success Criteria:**
- Agent cards show live on-chain data (<1s latency)
- Buy/sell transactions complete within 2 blocks
- Charts render OHLCV from events
- No database reads for price/reserves

### Phase 3: Testing & Validation (Week 3-4)

**Test Scenarios:**
1. [ ] Create agent, buy tokens, verify price increase
2. [ ] Sell tokens, verify price decrease and reserve reduction
3. [ ] Reach graduation threshold, trigger graduation
4. [ ] Verify buy/sell disabled after graduation
5. [ ] Test slippage protection (front-run protection)
6. [ ] Test anti-rug: attempt to sell non-curve-minted tokens
7. [ ] Stress test: 100 trades in rapid succession
8. [ ] Gas profiling: <200K per trade

### Phase 4: Mainnet Preparation (Week 5-8)

**Deliverables:**
1. [ ] External security audit
2. [ ] Implement `DexIntegrator.sol` (real Uniswap V3)
3. [ ] Integrate real oracle (Chainlink/Pyth)
4. [ ] Deploy to Base mainnet
5. [ ] Launch bug bounty program
6. [ ] Prepare emergency response plan

---

## 10. Open Questions & Decisions Needed

### 10.1 Critical Decisions (Block Implementation)

1. **Anti-Rug Mechanism:** Option A (pure curve minting) vs Option B (sell tracking)?
   - **Recommendation:** Option A for V5 simplicity
   - **Impact:** No team allocations in V5

2. **Graduation Trigger:** Permissionless vs admin-only?
   - **Recommendation:** Permissionless on mainnet (with 10 PROMPT bounty), admin-only on testnet
   - **Impact:** Gas cost for graduation caller

3. **Agent Creation:** Permissionless vs admin-approved?
   - **Recommendation:** Admin-only on testnet, permissionless on mainnet (with creation fee)
   - **Impact:** Spam prevention

### 10.2 Non-Blocking Questions (Can Decide During Implementation)

4. **Fee Distribution:** Currently 70% agent / 30% platform — confirm or adjust?
5. **Slippage Defaults:** Recommend 2% for buy/sell or make configurable?
6. **Graduation Bounty:** 10 PROMPT reward for calling `graduate()` or none?
7. **Emergency Pause:** Full pause vs per-agent pause?

---

## 11. Success Metrics

### 11.1 Technical Metrics

- [ ] Gas per buy: <150K
- [ ] Gas per sell: <120K
- [ ] Price calculation error: <0.01%
- [ ] Event indexing latency: <5s
- [ ] Chart data accuracy: 100% match with events

### 11.2 Product Metrics

- [ ] >100 agents created on testnet
- [ ] >10,000 total trades
- [ ] >10 agents graduated
- [ ] Zero critical bugs in 4 weeks
- [ ] User feedback: "Clear" graduation UX

---

## Appendix A: Math Proofs

### A.1 Buy Quadratic Formula Derivation

Given linear price function: `p(s) = p0 + k·s`

Cost to buy `dx` tokens from state `s`:
```
cost = ∫[s to s+dx] (p0 + k·x) dx
     = [p0·x + (k/2)·x²] evaluated from s to s+dx
     = p0·(s+dx) + (k/2)·(s+dx)² - p0·s - (k/2)·s²
     = p0·dx + k·s·dx + (k/2)·dx²
```

Setting `cost = costNet` (after fees):
```
(k/2)·dx² + (p0 + k·s)·dx - costNet = 0
```

Quadratic formula:
```
dx = [-(p0 + k·s) + sqrt((p0 + k·s)² + 2·k·costNet)] / k
```

### A.2 Sell Formula Derivation

Refund from selling `dx` tokens at state `s`:
```
refund = ∫[s-dx to s] (p0 + k·x) dx
       = p0·dx + k·s·dx - (k/2)·dx²
```

This is geometrically the area under the curve from `s-dx` to `s`.

---

## Appendix B: Example Parameters

### B.1 Typical Agent Configuration

```solidity
{
    name: "AlphaBot",
    symbol: "ALPHA",
    p0: 0.0001 * 1e18,           // Start at 0.0001 PROMPT per token
    k: 0.00000001 * 1e18,        // Price increases 0.00000001 PROMPT per token sold
    maxSupply: 1_000_000 * 1e18, // 1M tokens max
    graduationThresholdPrompt: 42_000 * 1e18, // Graduate at 42K PROMPT
    feeBuyBps: 100,              // 1% buy fee
    feeSellBps: 100              // 1% sell fee
}
```

**At 500K tokens sold:**
- Price: 0.0001 + (0.00000001 * 500000) = 0.0051 PROMPT per token
- Reserve: ~1,275 PROMPT (needs 42K to graduate)
- Progress: 3% to graduation

**At graduation (42K PROMPT reserve):**
- Approx 920K tokens sold (depends on exact curve)
- Final price: ~0.0093 PROMPT per token
- Remaining for LP: 80K tokens + 42K PROMPT

---

## Appendix C: Contract Addresses (TBD)

**Base Sepolia:**
```
PROMPT_TOKEN: 0x... (TestPROMPT)
BONDING_CURVE_V5: 0x...
AGENT_FACTORY_V5: 0x...
DEX_INTEGRATOR_STUB: 0x...
MOCK_PROMPT_USD_ORACLE: 0x...
BONDING_CURVE_VIEW_V5: 0x...
```

**Base Mainnet:**
```
TBD after deployment
```

---

**End of Specification**

**Next Steps:**
1. Review and approve this spec
2. Flag any deviations or concerns
3. Proceed to Phase 1 implementation upon approval
