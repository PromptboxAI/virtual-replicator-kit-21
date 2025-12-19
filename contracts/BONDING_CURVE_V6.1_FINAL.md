# Bonding Curve V6.1 - Final Implementation Guide
## Virtuals.io-Style Database Mode with Variable LP Allocation

---

## Executive Summary

Bonding Curve V6.1 implements a **Virtuals.io-style two-token mechanism** with database mode pre-graduation and healthy LP allocation at graduation.

### Core Innovation: Variable LP Allocation

**Formula:** `LP = 880M - 1.05X` where `X = database shares held at graduation`

This ensures:
- ✅ **Fixed 42K PROMPT to LP** - LP health guaranteed regardless of trading volume
- ✅ **Minimum 565M tokens to LP** - Even with max trading (300M shares), LP gets 56.5% of supply
- ✅ **5% holder rewards** - Bonus on holdings incentivizes early adoption
- ✅ **Healthy liquidity** - LP always has sufficient depth for post-graduation trading

### Token Distribution at Graduation (1B Total)

**Fixed Allocations (12%):**
- **Vault:** 20M tokens (2%) - Immediate
- **Team:** 100M tokens (10%) - Vesting: 50% @ 3 months, 50% @ 6 months

**Variable Allocations (88%):**
- **Database holders:** X tokens (1:1 conversion from shares, capped at ~300M)
- **Holder rewards:** 0.05X tokens (5% bonus, 1-month linear vest)
- **LP:** 880M - 1.05X tokens (remainder: 56.5%-88% of supply)

### Allocation Scenarios

| Trading Activity | Shares (X) | Holders | Rewards (5%) | LP Tokens | LP % | LP PROMPT |
|------------------|------------|---------|--------------|-----------|------|-----------|
| None | 0 | 0 | 0 | 880M | 88.0% | 42K |
| Light | 100M | 100M | 5M | 775M | 77.5% | 42K |
| Medium | 200M | 200M | 10M | 670M | 67.0% | 42K |
| Heavy (cap) | 300M | 300M | 15M | 565M | 56.5% | 42K |

### Key Features

**Pre-Graduation:**
- Database mode trading (PostgreSQL, not on-chain)
- No gas fees for users
- Linear pricing: 0.00004 → 0.0001 PROMPT
- Instant trades with Privy wallet authentication
- 5% trading fees (40% creator, 40% vault, 20% LP treasury)

**At Graduation (42K PROMPT raised):**
- Mint all 1B tokens in one transaction
- 1:1 conversion of database shares to real ERC-20 tokens
- 5% holder rewards with 1-month vest
- 10% team allocation with cliff vesting (3mo/6mo)
- Create Uniswap V2 LP with 42K PROMPT + remainder tokens
- Lock 95% LP tokens for 3 years, 5% to vault

**Post-Graduation:**
- All trading on Uniswap V2
- No platform fees (pure DEX)
- Holders claim rewards from RewardDistributor
- Team claims vested tokens from TeamVesting
- Fully decentralized

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Constants & Addresses](#constants--addresses)
3. [Smart Contracts](#smart-contracts)
4. [Database Schema](#database-schema)
5. [Backend API Logic](#backend-api-logic)
6. [Frontend Integration](#frontend-integration)
7. [Deployment](#deployment)
8. [Testing Checklist](#testing-checklist)

---

## Architecture Overview

### System Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     AGENT CREATION                               │
│  User pays 100 PROMPT → AgentFactoryV6 deploys token            │
│  NO tokens minted yet (database mode)                           │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                  PRE-GRADUATION TRADING                          │
│  Database mode: 0 → 42K PROMPT raised                           │
│                                                                  │
│  • All trades in PostgreSQL (agent_database_positions)          │
│  • Linear pricing: price = 0.00004 + 0.00006 * (X/300M)        │
│  • No gas fees, instant execution                               │
│  • Max ~300M shares tradeable                                   │
│  • 5% fees collected in PROMPT (40/40/20 split)                │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    GRADUATION (42K PROMPT)                       │
│  Backend calls GraduationManagerV6.executeGraduation()          │
│                                                                  │
│  1. Mint all 1B tokens:                                         │
│     • Database holders: X tokens (1:1)                          │
│     • Holder rewards: 0.05X (to RewardDistributor)             │
│     • Team: 100M (to TeamVesting)                               │
│     • Vault: 20M                                                │
│     • LP: 880M - 1.05X                                          │
│                                                                  │
│  2. Create Uniswap V2 LP:                                       │
│     • Add (880M - 1.05X) tokens + 42K PROMPT                    │
│     • Lock 95% LP tokens for 3 years                            │
│     • Send 5% LP tokens to vault                                │
│                                                                  │
│  3. Set rewards & vesting:                                      │
│     • RewardDistributor: 1-month vest starts                    │
│     • TeamVesting: Cliffs at 3mo/6mo                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    POST-GRADUATION                               │
│  • All trading on Uniswap V2                                    │
│  • Holders claim rewards (vesting over 1 month)                 │
│  • Team claims at 3mo (50%) and 6mo (50%)                       │
│  • LP locked for 3 years                                        │
└──────────────────────────────────────────────────────────────────┘
```

### Database Mode: Why It Works

**Pre-Graduation (Virtuals.io Model):**
- Users trade "shares" tracked in PostgreSQL
- Shares represent % ownership of future token allocation
- Price increases linearly to determine share allocation
- No actual ERC-20 tokens exist yet

**At Graduation (Mint & Distribute):**
- ALL 1B tokens minted in single transaction
- Shares convert 1:1 to real ERC-20 tokens
- LP receives **fixed 42K PROMPT** + remaining tokens
- Formula `LP = 880M - 1.05X` guarantees healthy liquidity

**Why This Solves LP Health:**
- Trading volume doesn't affect PROMPT in LP (always 42K)
- More trading = more holder tokens BUT less LP tokens
- LP always has minimum 565M tokens (56.5% supply)
- Perfect balance: rewards early adopters without hurting liquidity

---

## Constants & Addresses

### Global Constants

```solidity
// ============ Token Supply & Distribution (Virtuals-style) ============

uint256 public constant TOTAL_SUPPLY = 1_000_000_000e18;           // 1B tokens

// Fixed Allocations (12% total)
uint256 public constant VAULT_ALLOCATION = 20_000_000e18;          // 2% (20M)
uint256 public constant TEAM_ALLOCATION = 100_000_000e18;          // 10% (100M)
uint256 public constant FIXED_ALLOCATIONS = 120_000_000e18;        // 12% fixed

// Variable Allocations (88% total)
// Formula: LP = 880M - 1.05X (where X = database shares held at graduation)
uint256 public constant VARIABLE_POOL = 880_000_000e18;            // 88% (880M)
uint256 public constant MIN_LP_TOKENS = 565_000_000e18;            // 56.5% (if X = 300M)
uint256 public constant MAX_LP_TOKENS = 880_000_000e18;            // 88% (if X = 0)

// Holder Reward Multiplier (5% bonus)
uint256 public constant HOLDER_REWARD_MULTIPLIER = 105;            // 1.05
uint256 public constant HOLDER_REWARD_DIVISOR = 100;

// Database Trading Cap (pre-graduation)
uint256 public constant DATABASE_TRADEABLE_CAP = 300_000_000e18;   // Max ~300M shares

// ============ Graduation Threshold ============

uint256 public constant GRADUATION_THRESHOLD_PROMPT = 42_000e18;   // 42K PROMPT (fixed!)

// ============ Pricing (Database Mode) ============

uint256 public constant DEFAULT_P0 = 0.00004e18;                   // Starting price
uint256 public constant DEFAULT_P1 = 0.0001e18;                    // Price at cap
// Linear formula: price = p0 + (p1 - p0) * (shares_sold / DATABASE_TRADEABLE_CAP)

// ============ Fees (Database Mode) ============

uint256 public constant BUY_FEE_BPS = 500;                         // 5%
uint256 public constant SELL_FEE_BPS = 500;                        // 5%
uint256 public constant CREATOR_FEE_BPS = 4000;                    // 40% of fee
uint256 public constant VAULT_FEE_BPS = 4000;                      // 40% of fee
uint256 public constant LP_TREASURY_FEE_BPS = 2000;                // 20% of fee
uint256 public constant BASIS_POINTS = 10000;

// ============ Creation Fee ============

uint256 public constant CREATION_FEE = 100e18;                     // 100 PROMPT to vault

// ============ Vesting Durations ============

uint256 public constant HOLDER_REWARD_VEST_DURATION = 30 days;     // 1 month linear
uint256 public constant TEAM_VEST_CLIFF_1 = 90 days;               // 50% at 3 months
uint256 public constant TEAM_VEST_CLIFF_2 = 180 days;              // 50% at 6 months

// ============ LP Locking ============

uint256 public constant LOCK_DURATION = 3 * 365 days;              // 3 years
uint256 public constant LP_LOCK_BPS = 9500;                        // 95% locked
uint256 public constant LP_VAULT_BPS = 500;                        // 5% to vault
```

### TypeScript Constants

```typescript
export const BONDING_CURVE_V6_1_CONSTANTS = {
  // Token Distribution
  TOTAL_SUPPLY: 1_000_000_000,
  VAULT_ALLOCATION: 20_000_000,        // 2%
  TEAM_ALLOCATION: 100_000_000,        // 10%
  VARIABLE_POOL: 880_000_000,          // 88%

  // LP Range
  MIN_LP_TOKENS: 565_000_000,          // 56.5% (max trading)
  MAX_LP_TOKENS: 880_000_000,          // 88% (no trading)

  // Database Trading
  DATABASE_TRADEABLE_CAP: 300_000_000,

  // Graduation
  GRADUATION_THRESHOLD_PROMPT: 42_000,
  TARGET_FDV_AT_GRADUATION: 74_000,    // ~$74K with 55% LP allocation

  // Pricing
  DEFAULT_P0: 0.00004,
  DEFAULT_P1: 0.0001,

  // Fees
  TRADING_FEE_BPS: 500,                // 5%
  CREATOR_FEE_BPS: 4000,               // 40%
  VAULT_FEE_BPS: 4000,                 // 40%
  LP_TREASURY_FEE_BPS: 2000,           // 20%

  // Creation
  CREATION_FEE: 100,

  // Vesting
  HOLDER_REWARD_VEST_DAYS: 30,        // 1 month
  TEAM_CLIFF_1_DAYS: 90,               // 3 months
  TEAM_CLIFF_2_DAYS: 180,              // 6 months

  // LP Locking
  LP_LOCK_YEARS: 3,
  LP_LOCK_BPS: 9500,                   // 95%
} as const;
```

### Network Addresses

**Base Sepolia (Testnet):**
```typescript
export const BASE_SEPOLIA_ADDRESSES = {
  promptToken: '0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673',
  vault: '0xbafe4e2c27f1c0bb8e562262dd54e3f1bb959140',
  uniswapV2Factory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
  uniswapV2Router: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
  // Deployed contract addresses (add after deployment):
  // agentFactory: '0x...',
  // graduationManager: '0x...',
  // rewardDistributor: '0x...',
  // teamVesting: '0x...',
  // lpLocker: '0x...',
};
```

**Base Mainnet:**
```typescript
export const BASE_MAINNET_ADDRESSES = {
  promptToken: '0x...', // Real $PROMPT token
  vault: '0x...', // Production vault (Gnosis Safe 3/5)
  uniswapV2Factory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
  uniswapV2Router: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
};
```

---

## Smart Contracts

### Contract 1: AgentTokenV6.sol

**Purpose:** ERC-20 token that mints ALL supply at graduation using Virtuals-style variable allocation.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentTokenV6
 * @notice Database mode ERC-20 - all tokens minted at graduation
 * @dev Uses Virtuals-style model: LP = 880M - 1.05X (where X = database shares)
 */
contract AgentTokenV6 is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000e18;  // 1B
    uint256 public constant VAULT_ALLOCATION = 20_000_000e18;  // 2%
    uint256 public constant TEAM_ALLOCATION = 100_000_000e18;  // 10%
    uint256 public constant VARIABLE_POOL = 880_000_000e18;    // 88%
    uint256 public constant MIN_LP_TOKENS = 565_000_000e18;    // 56.5%

    address public immutable graduationManager;
    bool public hasGraduated;

    event Graduated(
        uint256 timestamp,
        uint256 holdersTotal,
        uint256 rewardsTotal,
        uint256 lpTotal
    );

    constructor(
        string memory name,
        string memory symbol,
        address _graduationManager,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        require(_graduationManager != address(0), "Invalid manager");
        graduationManager = _graduationManager;
    }

    /**
     * @notice Mint all tokens at graduation (one-time only)
     * @dev Only callable by GraduationManager
     *
     * Allocation model (Virtuals-style):
     * - Holders: X tokens (1:1 conversion from database shares)
     * - Rewards: 0.05X tokens (5% bonus, distributed proportionally)
     * - Team: 100M tokens (10%, fixed)
     * - Vault: 20M tokens (2%, fixed)
     * - LP: 880M - 1.05X tokens (remainder, ensures healthy liquidity)
     *
     * @param holders Array of database holder addresses
     * @param holderAmounts Array of 1:1 token amounts (X)
     * @param rewardDistributor Address of RewardDistributor contract
     * @param totalRewards Total rewards to mint (0.05X)
     * @param teamVesting Address of TeamVesting contract
     * @param vault Address of vault
     * @param lpRecipient Address to receive LP tokens (GraduationManager)
     */
    function mintAtGraduation(
        address[] calldata holders,
        uint256[] calldata holderAmounts,
        address rewardDistributor,
        uint256 totalRewards,
        address teamVesting,
        address vault,
        address lpRecipient
    ) external onlyOwner {
        require(msg.sender == graduationManager, "Only graduation manager");
        require(!hasGraduated, "Already graduated");
        require(holders.length == holderAmounts.length, "Length mismatch");

        hasGraduated = true;

        // 1. Mint 1:1 conversions to database holders
        uint256 totalHolderTokens = 0;
        for (uint256 i = 0; i < holders.length; i++) {
            if (holderAmounts[i] > 0) {
                _mint(holders[i], holderAmounts[i]);
                totalHolderTokens += holderAmounts[i];
            }
        }

        // 2. Mint 5% rewards to RewardDistributor
        _mint(rewardDistributor, totalRewards);

        // 3. Mint 10% to TeamVesting
        _mint(teamVesting, TEAM_ALLOCATION);

        // 4. Mint 2% to Vault
        _mint(vault, VAULT_ALLOCATION);

        // 5. Mint remainder to LP (880M - 1.05X)
        uint256 lpTokens = VARIABLE_POOL - totalHolderTokens - totalRewards;
        require(lpTokens >= MIN_LP_TOKENS, "LP below minimum");
        _mint(lpRecipient, lpTokens);

        // Verify total supply
        require(totalSupply() == TOTAL_SUPPLY, "Supply mismatch");

        emit Graduated(block.timestamp, totalHolderTokens, totalRewards, lpTokens);
    }
}
```

**Key Features:**
- ✅ NO tokens minted at creation (database mode)
- ✅ ALL 1B tokens minted at graduation in one transaction
- ✅ **Virtuals-style allocation**: LP = 880M - 1.05X ensures healthy liquidity
- ✅ Safety check: LP minimum 565M tokens (56.5%)
- ✅ Only GraduationManager can mint
- ✅ One-time only (hasGraduated check)

---

### Contract 2: AgentFactoryV6.sol

**Purpose:** Deploy agent tokens and charge 100 PROMPT creation fee.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentTokenV6.sol";

/**
 * @title AgentFactoryV6
 * @notice Factory for deploying agent tokens (database mode)
 * @dev Simplified for database mode - no tokens minted at creation
 */
contract AgentFactoryV6 {
    using SafeERC20 for IERC20;

    IERC20 public immutable promptToken;
    address public immutable vault;
    address public immutable graduationManager;

    uint256 public constant CREATION_FEE = 100e18; // 100 PROMPT

    event AgentCreated(
        address indexed agentToken,
        address indexed creator,
        string name,
        string symbol,
        uint256 timestamp
    );

    constructor(
        address _promptToken,
        address _vault,
        address _graduationManager
    ) {
        require(_promptToken != address(0), "Invalid PROMPT");
        require(_vault != address(0), "Invalid vault");
        require(_graduationManager != address(0), "Invalid manager");

        promptToken = IERC20(_promptToken);
        vault = _vault;
        graduationManager = _graduationManager;
    }

    /**
     * @notice Create new agent token
     * @dev Database mode - no tokens minted until graduation
     * @param name Token name
     * @param symbol Token symbol
     * @return agentToken Address of deployed token
     */
    function createAgent(
        string memory name,
        string memory symbol
    ) external returns (address agentToken) {
        // 1. Charge 100 PROMPT creation fee
        promptToken.safeTransferFrom(msg.sender, vault, CREATION_FEE);

        // 2. Deploy token (no tokens minted yet)
        AgentTokenV6 token = new AgentTokenV6(
            name,
            symbol,
            graduationManager,
            address(this)
        );
        agentToken = address(token);

        // 3. Transfer ownership to graduation manager
        token.transferOwnership(graduationManager);

        emit AgentCreated(agentToken, msg.sender, name, symbol, block.timestamp);

        return agentToken;
    }
}
```

**Key Features:**
- ✅ Charges 100 PROMPT fee to vault
- ✅ Deploys AgentTokenV6 (NO tokens minted)
- ✅ Transfers ownership to GraduationManager
- ✅ Simple and gas-efficient

---

### Contract 3: RewardDistributor.sol

**Purpose:** Distribute 5% holder rewards with 1-month linear vesting.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RewardDistributor
 * @notice Distributes 5% holder rewards with 1-month linear vesting
 * @dev Claim-based model - users claim their own vested rewards
 */
contract RewardDistributor is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant VEST_DURATION = 30 days; // 1 month

    struct RewardInfo {
        uint256 totalAmount;     // Total reward allocated
        uint256 claimed;         // Amount already claimed
        uint256 startTime;       // Vesting start time (graduation)
    }

    // agentToken => holder => RewardInfo
    mapping(address => mapping(address => RewardInfo)) public rewards;

    // agentToken => graduation timestamp
    mapping(address => uint256) public graduationTimes;

    event RewardsSet(
        address indexed agentToken,
        address indexed holder,
        uint256 amount,
        uint256 startTime
    );

    event RewardsClaimed(
        address indexed agentToken,
        address indexed holder,
        uint256 amount
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Set rewards for multiple holders (called by GraduationManager)
     * @param agentToken The agent token address
     * @param holders Array of holder addresses
     * @param amounts Array of reward amounts (must match holders length)
     */
    function setRewards(
        address agentToken,
        address[] calldata holders,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(holders.length == amounts.length, "Length mismatch");
        require(graduationTimes[agentToken] == 0, "Already set");

        uint256 startTime = block.timestamp;
        graduationTimes[agentToken] = startTime;

        for (uint256 i = 0; i < holders.length; i++) {
            rewards[agentToken][holders[i]] = RewardInfo({
                totalAmount: amounts[i],
                claimed: 0,
                startTime: startTime
            });

            emit RewardsSet(agentToken, holders[i], amounts[i], startTime);
        }
    }

    /**
     * @notice Calculate vested amount for a holder
     * @param holder Holder address
     * @param agentToken Agent token address
     * @return vested Amount currently vested and claimable
     */
    function calculateVestedAmount(
        address holder,
        address agentToken
    ) public view returns (uint256 vested) {
        RewardInfo memory info = rewards[agentToken][holder];

        if (info.totalAmount == 0) return 0;

        uint256 elapsed = block.timestamp - info.startTime;

        if (elapsed >= VEST_DURATION) {
            // Fully vested
            vested = info.totalAmount - info.claimed;
        } else {
            // Partial vesting (linear)
            uint256 totalVested = (info.totalAmount * elapsed) / VEST_DURATION;
            vested = totalVested - info.claimed;
        }

        return vested;
    }

    /**
     * @notice Claim vested rewards
     * @param agentToken Agent token address
     */
    function claimRewards(address agentToken) external {
        uint256 claimable = calculateVestedAmount(msg.sender, agentToken);
        require(claimable > 0, "No rewards claimable");

        RewardInfo storage info = rewards[agentToken][msg.sender];
        info.claimed += claimable;

        IERC20(agentToken).safeTransfer(msg.sender, claimable);

        emit RewardsClaimed(agentToken, msg.sender, claimable);
    }

    /**
     * @notice Get reward info for a holder
     */
    function getRewardInfo(
        address holder,
        address agentToken
    ) external view returns (
        uint256 totalAmount,
        uint256 claimed,
        uint256 claimable,
        uint256 startTime,
        uint256 timeRemaining
    ) {
        RewardInfo memory info = rewards[agentToken][holder];
        claimable = calculateVestedAmount(holder, agentToken);

        uint256 elapsed = block.timestamp - info.startTime;
        timeRemaining = elapsed >= VEST_DURATION ? 0 : VEST_DURATION - elapsed;

        return (
            info.totalAmount,
            info.claimed,
            claimable,
            info.startTime,
            timeRemaining
        );
    }
}
```

**Key Features:**
- ✅ 1-month linear vesting (not cliff)
- ✅ Claim-based model (users pay their own gas)
- ✅ Set once per agent at graduation
- ✅ Query vested amount at any time
- ✅ Partial claims allowed

---

### Contract 4: TeamVesting.sol

**Purpose:** Vest 10% team allocation with cliff vesting (50% @ 3mo, 50% @ 6mo).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TeamVesting
 * @notice Vests 10% team allocation with cliff vesting
 * @dev 50% unlocks at 3 months, 50% at 6 months
 */
contract TeamVesting is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant CLIFF_1 = 90 days;  // 3 months
    uint256 public constant CLIFF_2 = 180 days; // 6 months

    struct VestingSchedule {
        uint256 totalAmount;     // Total team allocation (100M tokens)
        uint256 claimed;         // Amount already claimed
        uint256 startTime;       // Vesting start time (graduation)
        address beneficiary;     // Team wallet/creator
    }

    // agentToken => VestingSchedule
    mapping(address => VestingSchedule) public schedules;

    event VestingSet(
        address indexed agentToken,
        address indexed beneficiary,
        uint256 amount,
        uint256 startTime
    );

    event TokensClaimed(
        address indexed agentToken,
        address indexed beneficiary,
        uint256 amount
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Set vesting schedule (called by GraduationManager at graduation)
     * @param agentToken Agent token address
     * @param beneficiary Team wallet (usually creator)
     * @param amount Total team allocation (100M tokens)
     */
    function setVesting(
        address agentToken,
        address beneficiary,
        uint256 amount
    ) external onlyOwner {
        require(schedules[agentToken].totalAmount == 0, "Already set");
        require(beneficiary != address(0), "Invalid beneficiary");

        schedules[agentToken] = VestingSchedule({
            totalAmount: amount,
            claimed: 0,
            startTime: block.timestamp,
            beneficiary: beneficiary
        });

        emit VestingSet(agentToken, beneficiary, amount, block.timestamp);
    }

    /**
     * @notice Calculate claimable amount (cliff vesting)
     */
    function calculateClaimable(address agentToken) public view returns (uint256) {
        VestingSchedule memory schedule = schedules[agentToken];

        if (schedule.totalAmount == 0) return 0;

        uint256 elapsed = block.timestamp - schedule.startTime;
        uint256 totalVested = 0;

        if (elapsed >= CLIFF_2) {
            // Both cliffs passed - 100% vested
            totalVested = schedule.totalAmount;
        } else if (elapsed >= CLIFF_1) {
            // First cliff passed - 50% vested
            totalVested = schedule.totalAmount / 2;
        }
        // else: No cliffs passed yet - 0% vested

        return totalVested - schedule.claimed;
    }

    /**
     * @notice Claim vested tokens
     * @param agentToken Agent token address
     */
    function claim(address agentToken) external {
        VestingSchedule storage schedule = schedules[agentToken];
        require(msg.sender == schedule.beneficiary, "Not beneficiary");

        uint256 claimable = calculateClaimable(agentToken);
        require(claimable > 0, "No tokens claimable");

        schedule.claimed += claimable;

        IERC20(agentToken).safeTransfer(msg.sender, claimable);

        emit TokensClaimed(agentToken, msg.sender, claimable);
    }

    /**
     * @notice Get vesting info
     */
    function getVestingInfo(address agentToken) external view returns (
        uint256 totalAmount,
        uint256 claimed,
        uint256 claimable,
        uint256 cliff1Time,
        uint256 cliff2Time,
        address beneficiary
    ) {
        VestingSchedule memory schedule = schedules[agentToken];
        claimable = calculateClaimable(agentToken);

        return (
            schedule.totalAmount,
            schedule.claimed,
            claimable,
            schedule.startTime + CLIFF_1,
            schedule.startTime + CLIFF_2,
            schedule.beneficiary
        );
    }
}
```

**Key Features:**
- ✅ Cliff vesting (not linear) - 50% @ 3mo, 50% @ 6mo
- ✅ Single beneficiary (creator/team wallet)
- ✅ Set once at graduation
- ✅ Query next unlock time

---

### Contract 5: LPLocker.sol

**Purpose:** Time-lock LP tokens for 3 years.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LPLocker
 * @notice Time-locks LP tokens for a specified duration
 */
contract LPLocker {
    using SafeERC20 for IERC20;

    struct Lock {
        address lpToken;
        uint256 amount;
        uint256 unlockTime;
        address beneficiary;
        bool withdrawn;
    }

    mapping(uint256 => Lock) public locks;
    uint256 public nextLockId;

    event Locked(
        uint256 indexed lockId,
        address indexed lpToken,
        uint256 amount,
        uint256 unlockTime,
        address indexed beneficiary
    );

    event Withdrawn(
        uint256 indexed lockId,
        address indexed beneficiary,
        uint256 amount
    );

    /**
     * @notice Lock LP tokens for a duration
     */
    function lock(
        address lpToken,
        uint256 amount,
        uint256 unlockTime,
        address beneficiary
    ) external returns (uint256 lockId) {
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be > 0");

        // Transfer LP tokens from caller
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), amount);

        // Create lock
        lockId = nextLockId++;
        locks[lockId] = Lock({
            lpToken: lpToken,
            amount: amount,
            unlockTime: unlockTime,
            beneficiary: beneficiary,
            withdrawn: false
        });

        emit Locked(lockId, lpToken, amount, unlockTime, beneficiary);
        return lockId;
    }

    /**
     * @notice Withdraw locked tokens after unlock time
     */
    function withdraw(uint256 lockId) external {
        Lock storage lockInfo = locks[lockId];

        require(!lockInfo.withdrawn, "Already withdrawn");
        require(block.timestamp >= lockInfo.unlockTime, "Still locked");
        require(msg.sender == lockInfo.beneficiary, "Not beneficiary");

        uint256 amount = lockInfo.amount;
        lockInfo.withdrawn = true;

        IERC20(lockInfo.lpToken).safeTransfer(lockInfo.beneficiary, amount);

        emit Withdrawn(lockId, lockInfo.beneficiary, amount);
    }

    /**
     * @notice Get lock information
     */
    function getLockInfo(uint256 lockId) external view returns (
        address lpToken,
        uint256 amount,
        uint256 unlockTime,
        address beneficiary,
        bool withdrawn,
        uint256 timeRemaining
    ) {
        Lock memory lockInfo = locks[lockId];
        uint256 remaining = lockInfo.unlockTime > block.timestamp
            ? lockInfo.unlockTime - block.timestamp
            : 0;

        return (
            lockInfo.lpToken,
            lockInfo.amount,
            lockInfo.unlockTime,
            lockInfo.beneficiary,
            lockInfo.withdrawn,
            remaining
        );
    }
}
```

**Key Features:**
- ✅ Can lock any ERC-20 (LP tokens)
- ✅ Cannot withdraw before unlock time
- ✅ Only beneficiary can withdraw
- ✅ Query lock status

---

### Contract 6: GraduationManagerV6.sol

**Purpose:** Execute graduation - mint tokens, create LP, lock 95% for 3 years.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentTokenV6.sol";
import "./RewardDistributor.sol";
import "./TeamVesting.sol";
import "./LPLocker.sol";

interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Router02 {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}

/**
 * @title GraduationManagerV6
 * @notice Handles graduation with Virtuals-style variable LP allocation
 * @dev Formula: LP = 880M - 1.05X (where X = database shares held)
 */
contract GraduationManagerV6 is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable promptToken;
    address public immutable vault;
    IUniswapV2Factory public immutable uniswapFactory;
    IUniswapV2Router02 public immutable uniswapRouter;
    RewardDistributor public immutable rewardDistributor;
    TeamVesting public immutable teamVesting;
    LPLocker public immutable lpLocker;

    uint256 public constant LOCK_DURATION = 3 * 365 days;  // 3 years
    uint256 public constant LP_LOCK_BPS = 9500;            // 95%
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant TEAM_ALLOCATION = 100_000_000e18; // 100M
    uint256 public constant GRADUATION_THRESHOLD = 42_000e18;  // 42K PROMPT

    struct GraduationInfo {
        address lpPair;
        uint256 totalLpTokens;
        uint256 lpLocked;
        uint256 lpToVault;
        uint256 lockId;
        uint256 timestamp;
    }

    mapping(address => GraduationInfo) public graduations;

    event GraduationExecuted(
        address indexed agentToken,
        address lpPair,
        uint256 holdersTotal,
        uint256 rewardsTotal,
        uint256 lpTokens,
        uint256 lpLocked,
        uint256 lockId
    );

    constructor(
        address _promptToken,
        address _vault,
        address _uniswapFactory,
        address _uniswapRouter,
        address _rewardDistributor,
        address _teamVesting,
        address _lpLocker,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_promptToken != address(0), "Invalid PROMPT");
        require(_vault != address(0), "Invalid vault");
        require(_uniswapFactory != address(0), "Invalid factory");
        require(_uniswapRouter != address(0), "Invalid router");
        require(_rewardDistributor != address(0), "Invalid distributor");
        require(_teamVesting != address(0), "Invalid vesting");
        require(_lpLocker != address(0), "Invalid locker");

        promptToken = IERC20(_promptToken);
        vault = _vault;
        uniswapFactory = IUniswapV2Factory(_uniswapFactory);
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        rewardDistributor = RewardDistributor(_rewardDistributor);
        teamVesting = TeamVesting(_teamVesting);
        lpLocker = LPLocker(_lpLocker);
    }

    /**
     * @notice Execute graduation with Virtuals-style allocation
     * @dev Mints all tokens, creates LP, locks 95% for 3 years
     *
     * @param agentToken The agent token address
     * @param holders Array of database holder addresses
     * @param holderAmounts Array of 1:1 token amounts (X)
     * @param rewardRecipients Array of reward recipient addresses
     * @param rewardAmounts Array of reward amounts (5% of holdings)
     * @param creator Creator address (team vesting beneficiary)
     */
    function executeGraduation(
        address agentToken,
        address[] calldata holders,
        uint256[] calldata holderAmounts,
        address[] calldata rewardRecipients,
        uint256[] calldata rewardAmounts,
        address creator
    ) external onlyOwner returns (uint256 lockId) {
        require(graduations[agentToken].lpPair == address(0), "Already graduated");
        require(holders.length == holderAmounts.length, "Holder length mismatch");
        require(rewardRecipients.length == rewardAmounts.length, "Reward length mismatch");

        // 1. Calculate totals
        uint256 totalRewards = 0;
        for (uint256 i = 0; i < rewardAmounts.length; i++) {
            totalRewards += rewardAmounts[i];
        }

        // 2. Mint all tokens via AgentTokenV6
        AgentTokenV6(agentToken).mintAtGraduation(
            holders,
            holderAmounts,
            address(rewardDistributor),
            totalRewards,
            address(teamVesting),
            vault,
            address(this) // LP recipient
        );

        // 3. Set rewards in RewardDistributor
        rewardDistributor.setRewards(agentToken, rewardRecipients, rewardAmounts);

        // 4. Set team vesting
        teamVesting.setVesting(agentToken, creator, TEAM_ALLOCATION);

        // 5. Pull 42K PROMPT from vault
        promptToken.safeTransferFrom(vault, address(this), GRADUATION_THRESHOLD);

        // 6. Create or get Uniswap V2 pair
        address pair = uniswapFactory.getPair(agentToken, address(promptToken));
        if (pair == address(0)) {
            pair = uniswapFactory.createPair(agentToken, address(promptToken));
        }

        // 7. Approve router
        uint256 lpTokenBalance = IERC20(agentToken).balanceOf(address(this));
        IERC20(agentToken).safeApprove(address(uniswapRouter), lpTokenBalance);
        promptToken.safeApprove(address(uniswapRouter), GRADUATION_THRESHOLD);

        // 8. Add liquidity
        (,, uint256 totalLpTokens) = uniswapRouter.addLiquidity(
            agentToken,
            address(promptToken),
            lpTokenBalance,
            GRADUATION_THRESHOLD,
            lpTokenBalance,
            GRADUATION_THRESHOLD,
            address(this),
            block.timestamp + 300
        );

        require(totalLpTokens > 0, "No LP tokens received");

        // 9. Calculate 95/5 split
        uint256 lpToLock = (totalLpTokens * LP_LOCK_BPS) / BASIS_POINTS;
        uint256 lpToVault = totalLpTokens - lpToLock;

        // 10. Approve locker
        IERC20(pair).safeApprove(address(lpLocker), lpToLock);

        // 11. Lock 95% for 3 years (vault is beneficiary)
        lockId = lpLocker.lock(
            pair,
            lpToLock,
            block.timestamp + LOCK_DURATION,
            vault
        );

        // 12. Send 5% to vault immediately
        IERC20(pair).safeTransfer(vault, lpToVault);

        // 13. Store graduation info
        graduations[agentToken] = GraduationInfo({
            lpPair: pair,
            totalLpTokens: totalLpTokens,
            lpLocked: lpToLock,
            lpToVault: lpToVault,
            lockId: lockId,
            timestamp: block.timestamp
        });

        uint256 totalHolderTokens = 0;
        for (uint256 i = 0; i < holderAmounts.length; i++) {
            totalHolderTokens += holderAmounts[i];
        }

        emit GraduationExecuted(
            agentToken,
            pair,
            totalHolderTokens,
            totalRewards,
            lpTokenBalance,
            lpToLock,
            lockId
        );

        return lockId;
    }
}
```

**Key Features:**
- ✅ Mints all 1B tokens using Virtuals-style formula
- ✅ Creates Uniswap V2 LP with 42K PROMPT + remainder tokens
- ✅ Locks 95% LP for 3 years, 5% to vault
- ✅ Sets holder rewards (RewardDistributor)
- ✅ Sets team vesting (TeamVesting)
- ✅ One-time only per agent
- ✅ Only callable by backend (owner)

---

## Database Schema

### Required Tables

```sql
-- ============================================
-- Bonding Curve V6.1 Database Schema
-- ============================================

-- Track database positions pre-graduation
CREATE TABLE IF NOT EXISTS agent_database_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  holder_address TEXT NOT NULL,
  token_balance NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, holder_address)
);

-- Store holder rewards (5% allocation)
CREATE TABLE IF NOT EXISTS agent_holder_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  holder_address TEXT NOT NULL,
  total_reward_amount NUMERIC NOT NULL,
  claimed_amount NUMERIC DEFAULT 0,
  start_time TIMESTAMP NOT NULL,
  vest_end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, holder_address)
);

-- Store team vesting info (10% allocation)
CREATE TABLE IF NOT EXISTS agent_team_vesting (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  beneficiary_address TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  claimed_amount NUMERIC DEFAULT 0,
  start_time TIMESTAMP NOT NULL,
  cliff_1_time TIMESTAMP NOT NULL,  -- 3 months
  cliff_2_time TIMESTAMP NOT NULL,  -- 6 months
  created_at TIMESTAMP DEFAULT NOW()
);

-- Store LP info after graduation
CREATE TABLE IF NOT EXISTS agent_lp_info (
  agent_id UUID PRIMARY KEY REFERENCES agents(id),
  lp_pair_address TEXT NOT NULL,
  total_lp_tokens NUMERIC NOT NULL,
  lp_locked NUMERIC NOT NULL,
  lp_to_vault NUMERIC NOT NULL,
  lock_id INTEGER NOT NULL,
  unlock_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add columns to existing agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS token_contract_address TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS bonding_curve_phase TEXT DEFAULT 'active';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS prompt_raised NUMERIC DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS shares_sold NUMERIC DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_database_positions_agent ON agent_database_positions(agent_id);
CREATE INDEX IF NOT EXISTS idx_database_positions_holder ON agent_database_positions(holder_address);
CREATE INDEX IF NOT EXISTS idx_holder_rewards_agent ON agent_holder_rewards(agent_id);
CREATE INDEX IF NOT EXISTS idx_holder_rewards_holder ON agent_holder_rewards(holder_address);
CREATE INDEX IF NOT EXISTS idx_agents_token_address ON agents(token_contract_address);
CREATE INDEX IF NOT EXISTS idx_agents_phase ON agents(bonding_curve_phase);
```

### Migration Script

**File: `supabase/migrations/001_bonding_curve_v6_1.sql`**

```sql
-- ============================================
-- Bonding Curve V6.1 Database Migration
-- ============================================

-- 1. Add new columns to agents table
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS token_contract_address TEXT,
  ADD COLUMN IF NOT EXISTS bonding_curve_phase TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS prompt_raised NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_sold NUMERIC DEFAULT 0;

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_token_address ON agents(token_contract_address);
CREATE INDEX IF NOT EXISTS idx_agents_phase ON agents(bonding_curve_phase);

-- 3. Create database positions table (pre-graduation trading)
CREATE TABLE IF NOT EXISTS agent_database_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  holder_address TEXT NOT NULL,
  token_balance NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, holder_address)
);

CREATE INDEX IF NOT EXISTS idx_database_positions_agent ON agent_database_positions(agent_id);
CREATE INDEX IF NOT EXISTS idx_database_positions_holder ON agent_database_positions(holder_address);

-- 4. Create holder rewards table
CREATE TABLE IF NOT EXISTS agent_holder_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  holder_address TEXT NOT NULL,
  total_reward_amount NUMERIC NOT NULL,
  claimed_amount NUMERIC DEFAULT 0,
  start_time TIMESTAMP NOT NULL,
  vest_end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, holder_address)
);

CREATE INDEX IF NOT EXISTS idx_holder_rewards_agent ON agent_holder_rewards(agent_id);
CREATE INDEX IF NOT EXISTS idx_holder_rewards_holder ON agent_holder_rewards(holder_address);

-- 5. Create team vesting table
CREATE TABLE IF NOT EXISTS agent_team_vesting (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  beneficiary_address TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  claimed_amount NUMERIC DEFAULT 0,
  start_time TIMESTAMP NOT NULL,
  cliff_1_time TIMESTAMP NOT NULL,
  cliff_2_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create LP info table
CREATE TABLE IF NOT EXISTS agent_lp_info (
  agent_id UUID PRIMARY KEY REFERENCES agents(id),
  lp_pair_address TEXT NOT NULL,
  total_lp_tokens NUMERIC NOT NULL,
  lp_locked NUMERIC NOT NULL,
  lp_to_vault NUMERIC NOT NULL,
  lock_id INTEGER NOT NULL,
  unlock_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE agent_database_positions IS 'Tracks database positions pre-graduation (shares, not real tokens)';
COMMENT ON TABLE agent_holder_rewards IS 'Stores 5% holder rewards with 1-month vesting';
COMMENT ON TABLE agent_team_vesting IS 'Stores 10% team allocation with cliff vesting';
COMMENT ON TABLE agent_lp_info IS 'Stores LP creation details after agent graduation';
```

**Run migration:**
```bash
supabase db push
```

---

## Backend API Logic

### Database Trading (Pre-Graduation)

All trading happens in the backend until 42K PROMPT is raised. Here's the core logic:

#### Linear Pricing Function

```typescript
import { BONDING_CURVE_V6_1_CONSTANTS as CONST } from './constants';

/**
 * Calculate current price based on shares sold
 * Formula: price = p0 + (p1 - p0) * (shares_sold / cap)
 */
export function calculateCurrentPrice(sharesSold: number): number {
  const { DEFAULT_P0, DEFAULT_P1, DATABASE_TRADEABLE_CAP } = CONST;
  const priceRange = DEFAULT_P1 - DEFAULT_P0;
  return DEFAULT_P0 + (priceRange * sharesSold) / DATABASE_TRADEABLE_CAP;
}

/**
 * Calculate shares out for PROMPT in (after fees)
 * Uses quadratic formula for linear curve
 */
export function calculateBuyReturn(
  sharesSold: number,
  promptIn: number
): {
  sharesOut: number;
  fee: number;
  promptAfterFee: number;
  priceAtStart: number;
  priceAtEnd: number;
  averagePrice: number;
} {
  const { DEFAULT_P0, DEFAULT_P1, DATABASE_TRADEABLE_CAP, TRADING_FEE_BPS } = CONST;

  // 1. Calculate fee
  const fee = (promptIn * TRADING_FEE_BPS) / 10000;
  const promptAfterFee = promptIn - fee;

  // 2. Calculate shares out using quadratic formula
  const currentPrice = calculateCurrentPrice(sharesSold);
  const priceRange = DEFAULT_P1 - DEFAULT_P0;

  const discriminant =
    currentPrice * currentPrice +
    (2 * priceRange * promptAfterFee) / DATABASE_TRADEABLE_CAP;

  const sqrtDiscriminant = Math.sqrt(discriminant);
  let sharesOut = ((sqrtDiscriminant - currentPrice) * DATABASE_TRADEABLE_CAP) / priceRange;

  // 3. Enforce cap
  sharesOut = Math.min(sharesOut, DATABASE_TRADEABLE_CAP - sharesSold);

  const priceAtEnd = calculateCurrentPrice(sharesSold + sharesOut);
  const averagePrice = (currentPrice + priceAtEnd) / 2;

  return {
    sharesOut,
    fee,
    promptAfterFee,
    priceAtStart: currentPrice,
    priceAtEnd,
    averagePrice,
  };
}

/**
 * Calculate PROMPT out for shares in (before fees)
 */
export function calculateSellReturn(
  sharesSold: number,
  sharesIn: number
): {
  promptGross: number;
  promptNet: number;
  fee: number;
  priceAtStart: number;
  priceAtEnd: number;
  averagePrice: number;
} {
  const { TRADING_FEE_BPS } = CONST;

  const priceAtStart = calculateCurrentPrice(sharesSold);
  const priceAtEnd = calculateCurrentPrice(sharesSold - sharesIn);

  const promptGross = (sharesIn * (priceAtStart + priceAtEnd)) / 2;
  const fee = (promptGross * TRADING_FEE_BPS) / 10000;
  const promptNet = promptGross - fee;

  const averagePrice = (priceAtStart + priceAtEnd) / 2;

  return {
    promptGross,
    promptNet,
    fee,
    priceAtStart,
    priceAtEnd,
    averagePrice,
  };
}
```

#### Buy Endpoint

```typescript
/**
 * POST /api/bonding-curve/buy
 * Database mode buy (pre-graduation)
 */
export async function handleBuy(req: Request) {
  const { agentId, promptIn, minSharesOut, userWallet } = await req.json();

  // 1. Get agent state
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (agent.bonding_curve_phase !== 'active') {
    return Response.json({ error: 'Agent graduated' }, { status: 400 });
  }

  // 2. Calculate shares out
  const { sharesOut, fee, promptAfterFee, priceAtEnd } = calculateBuyReturn(
    agent.shares_sold,
    promptIn
  );

  if (sharesOut < minSharesOut) {
    return Response.json({ error: 'Slippage exceeded' }, { status: 400 });
  }

  // 3. Distribute fees (40% creator, 40% vault, 20% LP treasury)
  const creatorFee = (fee * CONST.CREATOR_FEE_BPS) / 10000;
  const vaultFee = (fee * CONST.VAULT_FEE_BPS) / 10000;
  const lpFee = (fee * CONST.LP_TREASURY_FEE_BPS) / 10000;

  // 4. Update agent state
  const newPromptRaised = agent.prompt_raised + promptAfterFee;
  const newSharesSold = agent.shares_sold + sharesOut;

  await supabase
    .from('agents')
    .update({
      prompt_raised: newPromptRaised,
      shares_sold: newSharesSold,
    })
    .eq('id', agentId);

  // 5. Update holder position
  await supabase
    .from('agent_database_positions')
    .upsert({
      agent_id: agentId,
      holder_address: userWallet.toLowerCase(),
      token_balance: await getOrCreatePosition(agentId, userWallet) + sharesOut,
    });

  // 6. Record trade
  await supabase.from('agent_token_buy_trades').insert({
    agent_id: agentId,
    user_wallet: userWallet,
    prompt_amount: promptIn,
    token_amount: sharesOut,
    price: priceAtEnd,
  });

  // 7. Check if graduated
  if (newPromptRaised >= CONST.GRADUATION_THRESHOLD_PROMPT) {
    await triggerGraduation(agentId);
  }

  return Response.json({
    success: true,
    sharesOut,
    fee,
    newPrice: priceAtEnd,
    graduated: newPromptRaised >= CONST.GRADUATION_THRESHOLD_PROMPT,
  });
}
```

#### Sell Endpoint

```typescript
/**
 * POST /api/bonding-curve/sell
 * Database mode sell (pre-graduation)
 */
export async function handleSell(req: Request) {
  const { agentId, sharesIn, minPromptOut, userWallet } = await req.json();

  // 1. Get agent state
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (agent.bonding_curve_phase !== 'active') {
    return Response.json({ error: 'Agent graduated' }, { status: 400 });
  }

  // 2. Check user balance
  const { data: position } = await supabase
    .from('agent_database_positions')
    .select('token_balance')
    .eq('agent_id', agentId)
    .eq('holder_address', userWallet.toLowerCase())
    .single();

  if (!position || position.token_balance < sharesIn) {
    return Response.json({ error: 'Insufficient balance' }, { status: 400 });
  }

  // 3. Calculate PROMPT out
  const { promptNet, fee, priceAtEnd } = calculateSellReturn(agent.shares_sold, sharesIn);

  if (promptNet < minPromptOut) {
    return Response.json({ error: 'Slippage exceeded' }, { status: 400 });
  }

  // 4. Distribute fees
  const creatorFee = (fee * CONST.CREATOR_FEE_BPS) / 10000;
  const vaultFee = (fee * CONST.VAULT_FEE_BPS) / 10000;
  const lpFee = (fee * CONST.LP_TREASURY_FEE_BPS) / 10000;

  // 5. Update agent state
  const newPromptRaised = agent.prompt_raised - (promptNet + fee);
  const newSharesSold = agent.shares_sold - sharesIn;

  await supabase
    .from('agents')
    .update({
      prompt_raised: newPromptRaised,
      shares_sold: newSharesSold,
    })
    .eq('id', agentId);

  // 6. Update holder position
  await supabase
    .from('agent_database_positions')
    .update({
      token_balance: position.token_balance - sharesIn,
    })
    .eq('agent_id', agentId)
    .eq('holder_address', userWallet.toLowerCase());

  // 7. Record trade
  await supabase.from('agent_token_sell_trades').insert({
    agent_id: agentId,
    user_wallet: userWallet,
    prompt_amount: promptNet,
    token_amount: sharesIn,
    price: priceAtEnd,
  });

  return Response.json({
    success: true,
    promptOut: promptNet,
    fee,
    newPrice: priceAtEnd,
  });
}
```

#### Graduation Trigger

```typescript
/**
 * Trigger graduation when 42K PROMPT reached
 */
export async function triggerGraduation(agentId: string) {
  // 1. Mark as graduated in database
  await supabase
    .from('agents')
    .update({ bonding_curve_phase: 'graduated' })
    .eq('id', agentId);

  // 2. Get all holders
  const { data: positions } = await supabase
    .from('agent_database_positions')
    .select('*')
    .eq('agent_id', agentId)
    .gt('token_balance', 0);

  // 3. Calculate holder rewards (5% of individual holdings)
  const holdersWithRewards = positions.map((p) => ({
    address: p.holder_address,
    amount: p.token_balance,
    reward: p.token_balance * 0.05,
  }));

  // 4. Get agent details
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  // 5. Call GraduationManager contract
  const holders = holdersWithRewards.map((h) => h.address);
  const holderAmounts = holdersWithRewards.map((h) => parseEther(h.amount.toString()));
  const rewardRecipients = holdersWithRewards.map((h) => h.address);
  const rewardAmounts = holdersWithRewards.map((h) => parseEther(h.reward.toString()));

  const tx = await graduationManager.executeGraduation(
    agent.token_contract_address,
    holders,
    holderAmounts,
    rewardRecipients,
    rewardAmounts,
    agent.creator_wallet_address
  );

  await tx.wait();

  // 6. Store reward info in database
  for (const holder of holdersWithRewards) {
    await supabase.from('agent_holder_rewards').insert({
      agent_id: agentId,
      holder_address: holder.address,
      total_reward_amount: holder.reward,
      start_time: new Date(),
      vest_end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  }

  console.log(`[Graduation] Agent ${agentId} graduated successfully`);
}
```

---

## Frontend Integration

### TypeScript Library

**File: `src/lib/bondingCurveV6_1.ts`**

```typescript
import { BONDING_CURVE_V6_1_CONSTANTS as CONST } from './constants';

/**
 * Calculate market data for display
 */
export function calculateMarketData(
  promptRaised: number,
  sharesSold: number
): {
  currentPrice: number;
  marketCap: number;
  progressPercent: number;
  fdvAtGraduation: number;
} {
  const currentPrice = calculateCurrentPrice(sharesSold);
  const marketCap = sharesSold * currentPrice;
  const progressPercent = (promptRaised / CONST.GRADUATION_THRESHOLD_PROMPT) * 100;
  const fdvAtGraduation = CONST.TARGET_FDV_AT_GRADUATION;

  return {
    currentPrice,
    marketCap,
    progressPercent,
    fdvAtGraduation,
  };
}

/**
 * Calculate LP allocation for given shares sold
 */
export function calculateLPAllocation(sharesSold: number): {
  lpTokens: number;
  lpPercent: number;
  lpPrompt: number;
} {
  const lpTokens = CONST.VARIABLE_POOL - sharesSold * 1.05;
  const lpPercent = (lpTokens / CONST.TOTAL_SUPPLY) * 100;
  const lpPrompt = CONST.GRADUATION_THRESHOLD_PROMPT;

  return {
    lpTokens,
    lpPercent,
    lpPrompt,
  };
}

// Re-export pricing functions
export { calculateCurrentPrice, calculateBuyReturn, calculateSellReturn } from './pricing';
```

### React Hook: useRewardClaim.tsx

```typescript
import { useContractWrite, useContractRead } from 'wagmi';
import { Address, parseEther } from 'viem';

const REWARD_DISTRIBUTOR_ABI = [
  {
    name: 'getRewardInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'holder', type: 'address' },
      { name: 'agentToken', type: 'address' },
    ],
    outputs: [
      { name: 'totalAmount', type: 'uint256' },
      { name: 'claimed', type: 'uint256' },
      { name: 'claimable', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'timeRemaining', type: 'uint256' },
    ],
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentToken', type: 'address' }],
  },
] as const;

export function useRewardClaim(agentTokenAddress: Address, userAddress: Address) {
  // Read reward info
  const { data: rewardInfo } = useContractRead({
    address: CONTRACTS.rewardDistributor,
    abi: REWARD_DISTRIBUTOR_ABI,
    functionName: 'getRewardInfo',
    args: [userAddress, agentTokenAddress],
  });

  // Claim function
  const { write: executeClaim, isLoading: isClaiming } = useContractWrite({
    address: CONTRACTS.rewardDistributor,
    abi: REWARD_DISTRIBUTOR_ABI,
    functionName: 'claimRewards',
    args: [agentTokenAddress],
  });

  if (!rewardInfo) {
    return {
      totalAmount: 0,
      claimed: 0,
      claimable: 0,
      vestedPercent: 0,
      timeRemaining: 0,
      claim: undefined,
      isClaiming: false,
    };
  }

  const [totalAmount, claimed, claimable, startTime, timeRemaining] = rewardInfo;

  const vestedPercent = totalAmount > 0 ? (Number(claimed + claimable) / Number(totalAmount)) * 100 : 0;

  return {
    totalAmount: Number(formatEther(totalAmount)),
    claimed: Number(formatEther(claimed)),
    claimable: Number(formatEther(claimable)),
    vestedPercent,
    timeRemaining: Number(timeRemaining),
    claim: executeClaim,
    isClaiming,
  };
}
```

### React Hook: useTeamVesting.tsx

```typescript
import { useContractWrite, useContractRead } from 'wagmi';
import { Address } from 'viem';

const TEAM_VESTING_ABI = [
  {
    name: 'getVestingInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentToken', type: 'address' }],
    outputs: [
      { name: 'totalAmount', type: 'uint256' },
      { name: 'claimed', type: 'uint256' },
      { name: 'claimable', type: 'uint256' },
      { name: 'cliff1Time', type: 'uint256' },
      { name: 'cliff2Time', type: 'uint256' },
      { name: 'beneficiary', type: 'address' },
    ],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentToken', type: 'address' }],
  },
] as const;

export function useTeamVesting(agentTokenAddress: Address, userAddress: Address) {
  // Read vesting info
  const { data: vestingInfo } = useContractRead({
    address: CONTRACTS.teamVesting,
    abi: TEAM_VESTING_ABI,
    functionName: 'getVestingInfo',
    args: [agentTokenAddress],
  });

  // Claim function
  const { write: executeClaim, isLoading: isClaiming } = useContractWrite({
    address: CONTRACTS.teamVesting,
    abi: TEAM_VESTING_ABI,
    functionName: 'claim',
    args: [agentTokenAddress],
  });

  if (!vestingInfo) {
    return {
      totalAmount: 0,
      claimed: 0,
      claimable: 0,
      cliff1Time: 0,
      cliff2Time: 0,
      isBeneficiary: false,
      claim: undefined,
      isClaiming: false,
    };
  }

  const [totalAmount, claimed, claimable, cliff1Time, cliff2Time, beneficiary] = vestingInfo;

  return {
    totalAmount: Number(formatEther(totalAmount)),
    claimed: Number(formatEther(claimed)),
    claimable: Number(formatEther(claimable)),
    cliff1Time: Number(cliff1Time),
    cliff2Time: Number(cliff2Time),
    isBeneficiary: beneficiary.toLowerCase() === userAddress.toLowerCase(),
    claim: executeClaim,
    isClaiming,
  };
}
```

### UI Component: ClaimRewardsCard.tsx

```tsx
import { useRewardClaim } from '../hooks/useRewardClaim';
import { formatNumber, formatTime } from '../lib/format';

export function ClaimRewardsCard({
  agentTokenAddress,
  userAddress,
}: {
  agentTokenAddress: string;
  userAddress: string;
}) {
  const { totalAmount, claimed, claimable, vestedPercent, timeRemaining, claim, isClaiming } =
    useRewardClaim(agentTokenAddress as `0x${string}`, userAddress as `0x${string}`);

  if (totalAmount === 0) {
    return null; // No rewards for this user
  }

  return (
    <div className="card">
      <h3>🎁 Your Holder Rewards (5% Bonus)</h3>

      <div className="stats">
        <div>
          <label>Total Allocated:</label>
          <value>{formatNumber(totalAmount)} tokens</value>
        </div>
        <div>
          <label>Already Claimed:</label>
          <value>{formatNumber(claimed)} tokens</value>
        </div>
        <div>
          <label>Available Now:</label>
          <value className="highlight">{formatNumber(claimable)} tokens</value>
        </div>
      </div>

      <div className="progress">
        <div className="progress-bar" style={{ width: `${vestedPercent}%` }} />
        <span>{vestedPercent.toFixed(1)}% vested</span>
      </div>

      {timeRemaining > 0 && (
        <p className="info">Fully vested in {formatTime(timeRemaining)}</p>
      )}

      <button
        onClick={() => claim?.()}
        disabled={claimable === 0 || isClaiming}
        className="btn-primary"
      >
        {isClaiming ? 'Claiming...' : `Claim ${formatNumber(claimable)} Tokens`}
      </button>

      <p className="footnote">
        Rewards vest linearly over 1 month from graduation. You can claim at any time.
      </p>
    </div>
  );
}
```

---

## Deployment

### Testnet Deployment Script

**File: `script/DeployV6_1_Testnet.s.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/AgentFactoryV6.sol";
import "../contracts/RewardDistributor.sol";
import "../contracts/TeamVesting.sol";
import "../contracts/LPLocker.sol";
import "../contracts/GraduationManagerV6.sol";

contract DeployV6_1_Testnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Base Sepolia addresses
        address promptToken = 0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673;
        address vault = 0xbafe4e2c27f1c0bb8e562262dd54e3f1bb959140;
        address uniswapFactory = 0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6;
        address uniswapRouter = 0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24;

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy RewardDistributor
        RewardDistributor rewardDistributor = new RewardDistributor(msg.sender);
        console.log("RewardDistributor:", address(rewardDistributor));

        // 2. Deploy TeamVesting
        TeamVesting teamVesting = new TeamVesting(msg.sender);
        console.log("TeamVesting:", address(teamVesting));

        // 3. Deploy LPLocker
        LPLocker lpLocker = new LPLocker();
        console.log("LPLocker:", address(lpLocker));

        // 4. Deploy GraduationManager
        GraduationManagerV6 graduationManager = new GraduationManagerV6(
            promptToken,
            vault,
            uniswapFactory,
            uniswapRouter,
            address(rewardDistributor),
            address(teamVesting),
            address(lpLocker),
            msg.sender
        );
        console.log("GraduationManagerV6:", address(graduationManager));

        // 5. Transfer ownership of RewardDistributor and TeamVesting to GraduationManager
        rewardDistributor.transferOwnership(address(graduationManager));
        teamVesting.transferOwnership(address(graduationManager));

        // 6. Deploy AgentFactory
        AgentFactoryV6 factory = new AgentFactoryV6(
            promptToken,
            vault,
            address(graduationManager)
        );
        console.log("AgentFactoryV6:", address(factory));

        // 7. Transfer GraduationManager ownership to backend wallet
        // (Keep deployer as owner for testnet, transfer on mainnet)

        vm.stopBroadcast();

        console.log("\n=== Base Sepolia Deployment Complete ===");
        console.log("Update frontend config with these addresses:");
        console.log("- AgentFactoryV6:", address(factory));
        console.log("- GraduationManagerV6:", address(graduationManager));
        console.log("- RewardDistributor:", address(rewardDistributor));
        console.log("- TeamVesting:", address(teamVesting));
        console.log("- LPLocker:", address(lpLocker));
    }
}
```

**Deploy:**
```bash
forge script script/DeployV6_1_Testnet.s.sol --rpc-url base-sepolia --broadcast --verify
```

### Mainnet Deployment

Same script, but use mainnet addresses and transfer GraduationManager ownership to backend wallet.

---

## Testing Checklist

### Phase 1: Smart Contracts (Foundry Tests)

```bash
forge test -vvv
```

- [ ] `testVirtualsStyleAllocation()` - LP = 880M - 1.05X works correctly
- [ ] `testMinimumLPTokens()` - LP never goes below 565M (56.5%)
- [ ] `testDatabaseModeNoPreMint()` - AgentToken has 0 supply before graduation
- [ ] `testGraduationMinting()` - All 1B tokens minted correctly at graduation
- [ ] `testHolderRewards5Percent()` - 5% rewards calculated and distributed correctly
- [ ] `testTeamVestingCliffs()` - 50% @ 3mo, 50% @ 6mo works
- [ ] `testRewardVesting1Month()` - Linear vesting over 30 days
- [ ] `testLPLocking3Years()` - 95% locked for 3 years, 5% to vault
- [ ] `testCreationFee100PROMPT()` - Factory charges 100 PROMPT
- [ ] `test42KPROMPTToLP()` - LP always receives exactly 42K PROMPT

### Phase 2: Database Logic

- [ ] Database trading buy/sell functions
- [ ] Linear pricing calculation matches contract
- [ ] Fee distribution (40/40/20)
- [ ] Position tracking in `agent_database_positions`
- [ ] Graduation trigger at 42K PROMPT
- [ ] Holder reward calculation (5% of holdings)

### Phase 3: Integration Testing (Testnet)

- [ ] Deploy all contracts to Base Sepolia
- [ ] Verify contracts on Basescan
- [ ] Run database migrations
- [ ] Create test agent via factory
- [ ] Execute database trades (buy/sell)
- [ ] Reach 42K PROMPT
- [ ] Trigger graduation
- [ ] Verify token minting (1B total)
- [ ] Verify LP creation (42K PROMPT + tokens)
- [ ] Verify LP locking (95% for 3 years)
- [ ] Verify holder rewards set
- [ ] Verify team vesting set
- [ ] Claim holder rewards
- [ ] Claim team tokens (after cliffs)

### Phase 4: Frontend Testing

- [ ] Database mode trading UI works
- [ ] Progress bar shows correct % to 42K
- [ ] Market cap displays correctly
- [ ] Graduation shows "Trade on Uniswap" message
- [ ] Claim rewards UI works
- [ ] Team vesting UI shows cliffs correctly
- [ ] Transaction confirmations work

### Phase 5: Mainnet Launch

- [ ] All testnet tests pass
- [ ] Testnet running for 1-2 weeks without issues
- [ ] Multiple test agents graduated successfully
- [ ] Deploy to Base mainnet
- [ ] Verify all contracts
- [ ] Update frontend to mainnet
- [ ] Create first mainnet agent (internal test)
- [ ] Test full flow on mainnet
- [ ] Open to public

---

## Conclusion

Bonding Curve V6.1 implements a **Virtuals.io-style two-token mechanism** with:

✅ **Database mode pre-graduation** - No gas, instant trades, better UX
✅ **Variable LP allocation** - Formula `LP = 880M - 1.05X` ensures healthy liquidity
✅ **Fixed 42K PROMPT to LP** - LP health guaranteed regardless of trading volume
✅ **5% holder rewards** - Incentivizes early adoption with 1-month vest
✅ **10% team allocation** - Cliff vesting prevents dumps (50% @ 3mo, 50% @ 6mo)
✅ **3-year LP lock** - 95% locked ensures long-term stability
✅ **Fully decentralized post-graduation** - All trading on Uniswap V2

This model balances:
- **User experience** (database mode, no gas)
- **Platform revenue** (100% fees pre-grad)
- **LP health** (minimum 565M tokens + 42K PROMPT)
- **Early adopter rewards** (5% bonus)
- **Long-term stability** (3-year lock, team vesting)

**Ready for implementation!** 🚀
