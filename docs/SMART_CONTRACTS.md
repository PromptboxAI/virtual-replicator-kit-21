# Smart Contracts Documentation

## Overview

Promptbox uses a suite of smart contracts to manage agent token creation, trading, graduation, and revenue distribution on Base blockchain.

## Contract Architecture

### Core Contracts

1. **AgentTokenFactoryV2** - Token deployment and management
2. **AgentTokenV2** - Individual agent token implementation
3. **PlatformVault** - Revenue collection and distribution
4. **LPTokenLock** - Liquidity provider token timelock

## AgentTokenFactoryV2

Factory contract for deploying new agent tokens.

**Contract Address**: `0x...` (Base Mainnet)

### Key Functions

#### createAgentToken

Deploy a new agent token with bonding curve parameters.

```solidity
function createAgentToken(
    string memory name,
    string memory symbol,
    uint256 p0,
    uint256 p1,
    uint256 totalSupply,
    address creator
) external returns (address tokenAddress)
```

**Parameters**:
- `name`: Token name (e.g., "Trading Bot Alpha")
- `symbol`: Token symbol (e.g., "TBA")
- `p0`: Initial price coefficient
- `p1`: Growth rate coefficient
- `totalSupply`: Total token supply (typically 1 billion)
- `creator`: Creator wallet address

**Events**:
```solidity
event AgentTokenCreated(
    address indexed tokenAddress,
    address indexed creator,
    string name,
    string symbol,
    uint256 p0,
    uint256 p1
);
```

#### getAgentTokens

Get all deployed agent tokens.

```solidity
function getAgentTokens() external view returns (address[] memory)
```

#### isValidAgentToken

Check if address is a valid agent token.

```solidity
function isValidAgentToken(address token) external view returns (bool)
```

---

## AgentTokenV2

Individual agent token contract with bonding curve trading.

### Key Functions

#### buy

Purchase agent tokens using PROMPT.

```solidity
function buy(uint256 promptAmount) external returns (uint256 tokensReceived)
```

**Requirements**:
- Caller must approve PROMPT spending
- Agent must not be graduated
- Amount must be within trade limits

**Events**:
```solidity
event TokensPurchased(
    address indexed buyer,
    uint256 promptAmount,
    uint256 tokensReceived,
    uint256 newPrice
);
```

#### sell

Sell agent tokens for PROMPT.

```solidity
function sell(uint256 tokenAmount) external returns (uint256 promptReceived)
```

**Requirements**:
- Caller must own sufficient tokens
- Agent must not be graduated
- Amount must be within trade limits

**Events**:
```solidity
event TokensSold(
    address indexed seller,
    uint256 tokenAmount,
    uint256 promptReceived,
    uint256 newPrice
);
```

#### getCurrentPrice

Get current token price based on supply sold.

```solidity
function getCurrentPrice() external view returns (uint256)
```

**Formula**:
```
price = p0 + (p1 * tokensSold^2)
```

#### calculateBuyReturn

Calculate tokens received for PROMPT amount.

```solidity
function calculateBuyReturn(uint256 promptAmount) 
    external 
    view 
    returns (uint256 tokenAmount, uint256 priceImpact)
```

#### calculateSellReturn

Calculate PROMPT received for token amount.

```solidity
function calculateSellReturn(uint256 tokenAmount) 
    external 
    view 
    returns (uint256 promptAmount, uint256 priceImpact)
```

#### graduate

Trigger graduation when threshold reached.

```solidity
function graduate() external
```

**Requirements**:
- Caller must be factory or authorized
- Prompt raised must exceed threshold
- Agent not already graduated

**Events**:
```solidity
event AgentGraduated(
    address indexed tokenAddress,
    uint256 promptRaised,
    uint256 timestamp
);
```

### State Variables

```solidity
string public name;
string public symbol;
uint256 public totalSupply;
uint256 public p0;              // Initial price
uint256 public p1;              // Growth rate
uint256 public tokensSold;      // Tokens in circulation
uint256 public promptRaised;    // Total PROMPT raised
bool public graduated;          // Graduation status
address public creator;         // Creator address
address public liquidityPool;   // Uniswap V3 pool (post-graduation)
```

---

## PlatformVault

Revenue collection and distribution contract.

**Contract Address**: `0x...` (Base Mainnet)

### Key Functions

#### depositRevenue

Deposit platform revenue from trades or graduation.

```solidity
function depositRevenue(
    address agentToken,
    uint256 amount,
    RevenueType revenueType
) external
```

**Revenue Types**:
- `TRADING_FEE` - 0.5% of trade volume
- `GRADUATION_FEE` - 2% of raised funds
- `PLATFORM_ALLOCATION` - Creator prebuy fees

#### distributeRevenue

Distribute accumulated revenue to stakeholders.

```solidity
function distributeRevenue(address agentToken) external
```

**Distribution**:
- 50% to creator
- 30% to liquidity providers
- 20% to platform treasury

**Events**:
```solidity
event RevenueDistributed(
    address indexed agentToken,
    uint256 creatorAmount,
    uint256 lpAmount,
    uint256 treasuryAmount
);
```

#### claimRewards

Claim accumulated rewards for an agent.

```solidity
function claimRewards(address agentToken) external
```

#### getPendingRewards

Get unclaimed rewards for caller.

```solidity
function getPendingRewards(address user, address agentToken) 
    external 
    view 
    returns (uint256)
```

---

## LPTokenLock

Timelock contract for liquidity provider tokens.

### Key Functions

#### lockTokens

Lock LP tokens for specified duration.

```solidity
function lockTokens(
    address lpToken,
    uint256 amount,
    uint256 unlockTime
) external
```

**Requirements**:
- `unlockTime` must be in future
- Caller must approve LP token spending

#### unlockTokens

Withdraw locked tokens after unlock time.

```solidity
function unlockTokens(uint256 lockId) external
```

**Requirements**:
- Lock must exist
- Current time >= unlock time
- Caller must be lock owner

#### getLockedBalance

Get locked token balance for user.

```solidity
function getLockedBalance(address user, address lpToken) 
    external 
    view 
    returns (uint256)
```

---

## Bonding Curve Math

### Price Formula

The bonding curve uses a quadratic formula:

```
price(x) = p0 + p1 * x^2
```

Where:
- `p0` = Initial price (base price)
- `p1` = Growth coefficient
- `x` = Tokens sold

### Buy Calculation

To calculate tokens received for PROMPT amount:

```
tokens = ∫[current_supply to new_supply] price(x) dx
```

Simplified:
```solidity
function calculateBuy(uint256 promptIn) returns (uint256 tokensOut) {
    uint256 x0 = tokensSold;
    uint256 x1 = x0 + tokensOut; // solve iteratively
    
    uint256 cost = (p0 * (x1 - x0)) + 
                   (p1 * (x1^3 - x0^3) / 3);
    
    require(cost <= promptIn, "Insufficient PROMPT");
    return tokensOut;
}
```

### Sell Calculation

To calculate PROMPT received for token amount:

```
prompt = ∫[new_supply to current_supply] price(x) dx
```

### Fee Calculation

```solidity
uint256 constant FEE_BPS = 50; // 0.5%
uint256 fee = (amount * FEE_BPS) / 10000;
uint256 amountAfterFee = amount - fee;
```

---

## Graduation Process

### Conditions

Graduation triggers when:
1. `promptRaised >= graduationThreshold` (default: 50,000 PROMPT)
2. `graduated == false`
3. Caller is authorized (factory or admin)

### Steps

1. **Deploy V2 Contract**
   - New ERC20 contract on Base
   - Same name, symbol, total supply
   - Full ERC20 compatibility

2. **Create Liquidity Pool**
   - Deploy Uniswap V3 pool
   - Pair: AGENT/PROMPT
   - Initial price matches bonding curve

3. **Add Liquidity**
   - Transfer remaining tokens
   - Add PROMPT from raised funds
   - Lock LP tokens for 1 year

4. **Update State**
   - Set `graduated = true`
   - Record `liquidityPool` address
   - Emit `AgentGraduated` event

5. **Redirect Trading**
   - Frontend switches to DEX
   - Bonding curve disabled
   - All trades through Uniswap

---

## Security Considerations

### Access Control

- Only factory can create tokens
- Only authorized addresses can trigger graduation
- Only creators can claim rewards
- Only lock owners can unlock LP tokens

### Reentrancy Protection

All state-changing functions use reentrancy guards:

```solidity
modifier nonReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}
```

### Integer Overflow Protection

Solidity 0.8+ provides built-in overflow protection. All arithmetic operations are safe.

### Price Manipulation

- Slippage protection on all trades
- Maximum trade amount limits
- Front-running mitigation via mempool protection

---

## Contract Deployment

### Constructor Parameters

**AgentTokenFactoryV2**:
```solidity
constructor(
    address promptToken,
    address platformVault,
    uint256 defaultGraduationThreshold
)
```

**PlatformVault**:
```solidity
constructor(
    address treasury,
    uint256 creatorBps,
    uint256 lpBps,
    uint256 treasuryBps
)
```

### Deployment Script

```typescript
// Deploy Factory
const factory = await ethers.deployContract("AgentTokenFactoryV2", [
  PROMPT_TOKEN_ADDRESS,
  PLATFORM_VAULT_ADDRESS,
  ethers.parseEther("50000") // 50k PROMPT threshold
]);

// Deploy Vault
const vault = await ethers.deployContract("PlatformVault", [
  TREASURY_ADDRESS,
  5000, // 50% to creator
  3000, // 30% to LP
  2000  // 20% to treasury
]);
```

---

## Events Reference

### AgentTokenFactoryV2

```solidity
event AgentTokenCreated(
    address indexed tokenAddress,
    address indexed creator,
    string name,
    string symbol,
    uint256 p0,
    uint256 p1
);

event GraduationThresholdUpdated(uint256 newThreshold);
```

### AgentTokenV2

```solidity
event TokensPurchased(
    address indexed buyer,
    uint256 promptAmount,
    uint256 tokensReceived,
    uint256 newPrice
);

event TokensSold(
    address indexed seller,
    uint256 tokenAmount,
    uint256 promptReceived,
    uint256 newPrice
);

event AgentGraduated(
    address indexed tokenAddress,
    uint256 promptRaised,
    uint256 timestamp
);
```

### PlatformVault

```solidity
event RevenueDeposited(
    address indexed agentToken,
    uint256 amount,
    RevenueType revenueType
);

event RevenueDistributed(
    address indexed agentToken,
    uint256 creatorAmount,
    uint256 lpAmount,
    uint256 treasuryAmount
);

event RewardsClaimed(
    address indexed user,
    address indexed agentToken,
    uint256 amount
);
```

---

## Testing

### Foundry Tests

```bash
forge test --match-contract AgentTokenV2Test
forge test --match-contract PlatformVaultTest
```

### Coverage

```bash
forge coverage
```

### Gas Reports

```bash
forge test --gas-report
```

---

## Verified Contracts

All contracts are verified on BaseScan:

- Factory: https://basescan.org/address/0x...
- Vault: https://basescan.org/address/0x...
- Example Token: https://basescan.org/address/0x...

---

## Support

For smart contract questions:
- GitHub: github.com/promptbox/contracts
- Discord: #developers channel
- Email: contracts@promptbox.io
