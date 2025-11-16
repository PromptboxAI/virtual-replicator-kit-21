# Graduation Guide

## Overview

This guide explains the graduation process for agent tokens on Promptbox - the transition from bonding curve trading to decentralized exchange (DEX) trading.

## What is Graduation?

Graduation is a milestone event when an agent token has raised sufficient funds (PROMPT) to transition from the bonding curve pricing model to professional DEX trading on Uniswap V3.

### Key Benefits

**For Traders**:
- Higher liquidity
- Lower price impact
- Professional trading features (limit orders, advanced charts)
- Access to DEX aggregators

**For Creators**:
- Graduation fee rewards
- Ongoing LP fee share
- Enhanced credibility
- Wider market access

**For the Ecosystem**:
- Sustainable liquidity
- Price stability
- Long-term viability
- Professional trading infrastructure

## Graduation Threshold

### Default Threshold: 50,000 PROMPT

This threshold represents the minimum funds raised required for graduation. It ensures:
- Sufficient liquidity for DEX pool
- Sustainable trading environment
- Creator/platform fee coverage
- Long-term pool viability

### Tracking Progress

Monitor graduation progress on any agent page:

```
Graduation Progress Bar:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 70%
35,000 / 50,000 PROMPT raised
```

**Status Indicators**:
- **< 40%**: Early stage
- **40-70%**: Growing momentum
- **70-90%**: Nearing graduation
- **90-99%**: Imminent graduation
- **100%**: Graduated or graduating

### Progress Milestones

**25% (12,500 PROMPT)**:
- Initial traction
- Community building
- Early adopters rewarded

**50% (25,000 PROMPT)**:
- Significant momentum
- Increased visibility
- Growing holder base

**75% (37,500 PROMPT)**:
- Approaching graduation
- Heightened interest
- Price acceleration common

**95% (47,500 PROMPT)**:
- Graduation imminent
- High volatility expected
- Final accumulation phase

## The Graduation Process

### Step-by-Step Timeline

**Total Time**: 2-5 minutes

#### Step 1: Threshold Reached (Immediate)

```
Condition: promptRaised >= 50,000 PROMPT
Trigger: Automatic or manual
Action: Graduation initiated
```

**What Happens**:
- Trading paused on bonding curve
- Graduation status set to "in_progress"
- Frontend displays graduation message
- Event logged to blockchain

#### Step 2: V2 Contract Deployment (~30 seconds)

**New Contract Features**:
- Full ERC20 compliance
- Same name, symbol, total supply
- Enhanced security
- DEX compatibility
- Standard interfaces

**Deployment**:
```solidity
// Deploy AgentTokenV2
contract = deployContract({
  name: agent.name,
  symbol: agent.symbol,
  totalSupply: agent.totalSupply,
  creator: agent.creator
});
```

#### Step 3: Liquidity Pool Creation (~30 seconds)

**Uniswap V3 Pool**:
- Pair: AGENT/PROMPT
- Fee tier: 0.3% (standard)
- Initial price: Matches final bonding curve price
- Full range liquidity

**Pool Parameters**:
```
Token0: AGENT
Token1: PROMPT
Fee: 3000 (0.3%)
TickSpacing: 60
InitialPrice: bondingCurvePrice
```

#### Step 4: Liquidity Addition (~1 minute)

**Liquidity Sources**:

1. **Remaining Tokens**:
   ```
   Total Supply: 1,000,000,000
   Sold on Curve: 300,000,000
   Remaining: 700,000,000
   To Pool: 700,000,000
   ```

2. **Raised PROMPT**:
   ```
   Raised: 50,000 PROMPT
   Graduation Fee: 1,000 PROMPT (2%)
   To Pool: 49,000 PROMPT
   ```

3. **Pool Depth**:
   ```
   AGENT: 700,000,000 tokens
   PROMPT: 49,000 PROMPT
   Total Value: ~$150,000 USD (example)
   ```

**LP Token Lock**:
- Duration: 1 year
- Purpose: Prevent rug pulls
- Benefits: Long-term stability

#### Step 5: State Updates (~30 seconds)

**Database Updates**:
```sql
UPDATE agents SET
  token_graduated = true,
  graduation_event_id = 'event-uuid',
  migration_completed_at = NOW(),
  liquidity_pool_address = '0x...'
WHERE id = 'agent-uuid';
```

**Event Emission**:
```solidity
event AgentGraduated(
  address tokenAddress,
  address poolAddress,
  uint256 promptRaised,
  uint256 timestamp
);
```

#### Step 6: Trading Resumes (~immediate)

**DEX Trading Active**:
- Bonding curve disabled
- Uniswap V3 routing enabled
- Professional features available
- Price discovery begins

## During Graduation

### What You Can't Do

- Place new trades
- Cancel pending orders
- Modify positions
- Interact with bonding curve

### What You Can Do

- View graduation progress
- Monitor on BaseScan
- Prepare for post-graduation
- Join community discussion

### User Experience

**Frontend Display**:
```
🎓 Agent is Graduating!

This agent has reached its funding goal and is 
transitioning to DEX trading on Uniswap V3.

Status: Creating liquidity pool (2/5)
Estimated time: 3 minutes

Your tokens will work seamlessly with the new 
contract. No action required.

[View on BaseScan] [Learn More]
```

## After Graduation

### Immediate Changes

**Price Discovery**:
- Initial price matches bonding curve
- Market determines new price
- Volatility common in first 24h
- Stabilization typically within week

**Trading Features**:
- Limit orders
- Stop losses
- Advanced charting
- DEX aggregator access
- Lower slippage (usually)

**Liquidity**:
- Significantly higher
- Professional market makers
- Reduced price impact
- Sustainable long-term

### Token Compatibility

**Your Tokens Automatically Work**:
- No migration required
- Same token address (or automatic bridge)
- Full ERC20 functionality
- Compatible with all wallets

**Verify**:
```
Old Contract: 0x... (bonding curve)
New Contract: 0x... (ERC20 V2)
Pool Address: 0x... (Uniswap V3)
```

### Trading on DEX

**Uniswap V3**:
1. Visit app.uniswap.org
2. Connect wallet
3. Search for agent token
4. Trade AGENT/PROMPT pair

**DEX Aggregators**:
- 1inch
- Matcha
- CowSwap
- ParaSwap

**Promptbox Interface**:
- Automatically routes to DEX
- Maintains familiar interface
- Shows DEX pricing
- Historical charts retained

## Post-Graduation Strategy

### For Holders

**Short-term (0-7 days)**:
- Expect volatility
- Price discovery phase
- Monitor support/resistance
- Consider taking partial profits

**Long-term (7+ days)**:
- Hold for project development
- Stake or provide liquidity
- Participate in governance (if available)
- Dollar-cost average buys

### For Traders

**Day Trading**:
- Use DEX limit orders
- Set stop losses
- Monitor volume closely
- Quick profit-taking

**Swing Trading**:
- Identify trends
- Trade support/resistance
- Use technical indicators
- Longer time horizons

### For Liquidity Providers

**Providing Liquidity**:

1. **Navigate to Pool**:
   - Uniswap V3 interface
   - Find AGENT/PROMPT pool

2. **Add Liquidity**:
   ```
   AGENT Amount: 1,000,000
   PROMPT Amount: Calculate based on ratio
   Range: Full range or concentrated
   ```

3. **Receive LP Tokens**:
   - Represent your pool share
   - Earn trading fees (0.3%)
   - Can be staked for additional rewards

**Risks**:
- Impermanent loss
- Price volatility
- Smart contract risk

**Rewards**:
- Trading fee share
- Platform vault distribution
- Potential token rewards

## Graduation Rewards

### Platform Vault Distribution

**Graduation Fee** (2% of raised funds):
```
Raised: 50,000 PROMPT
Fee: 1,000 PROMPT

Distribution:
- Creator: 500 PROMPT (50%)
- LPs: 300 PROMPT (30%)
- Treasury: 200 PROMPT (20%)
```

### Creator Rewards

**Immediate**:
- 50% of graduation fee
- LP tokens (locked 1 year)
- Enhanced profile visibility

**Ongoing**:
- LP fee share (as LP)
- Trading fee share (via vault)
- Community rewards

### LP Rewards

**Requirements**:
- Provide liquidity to pool
- Maintain position
- Meet minimum thresholds

**Benefits**:
- Trading fee share (0.3%)
- Vault distribution share
- Potential bonus rewards

## Monitoring Graduation

### Real-time Updates

**Subscribe to Events**:
```typescript
// Graduation events
supabase
  .channel('graduation')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'agent_graduation',
      filter: `agent_id=eq.${agentId}`
    },
    (payload) => {
      console.log('Graduation update:', payload);
    }
  )
  .subscribe();
```

### Status Checks

**API Endpoint**:
```
GET /get-token-metadata/:agentId
```

**Response**:
```json
{
  "graduation": {
    "graduated": true,
    "graduatedAt": "2024-01-15T12:30:00Z",
    "promptRaised": 50000,
    "liquidityPoolAddress": "0x...",
    "status": "completed"
  }
}
```

## Graduation Analytics

### Pre vs Post Metrics

**Typical Changes**:

| Metric | Pre-Graduation | Post-Graduation |
|--------|----------------|-----------------|
| Daily Volume | $10k-50k | $100k-500k |
| Holders | 200-500 | 500-2000 |
| Liquidity | Limited | $150k+ |
| Price Impact | 3-10% | 0.5-2% |
| Volatility | High | Moderate |

### Success Indicators

**Healthy Graduation**:
- Price within ±20% of bonding curve
- Volume increases 3-10x
- Holder count increases
- Liquidity depth stable
- Active trading maintained

**Warning Signs**:
- Price crash > 50%
- Volume dries up
- Liquidity removed
- Holder exodus
- Trading stagnates

## Troubleshooting

### Common Issues

**Graduation Delayed**:
- Network congestion
- Gas price too low
- Contract deployment issues
- Solution: Wait or contact support

**Price Discrepancy**:
- Bonding curve vs DEX difference
- Arbitrage opportunities
- Solution: Price converges over time

**Can't Trade**:
- Graduation in progress
- Wrong contract address
- Need to refresh interface
- Solution: Wait for completion

**Tokens Missing**:
- Not actually missing (check new contract)
- Wallet needs token import
- Solution: Add token to wallet

### Getting Help

**During Graduation**:
- Monitor Discord announcements
- Check agent's social media
- View BaseScan for transactions
- Contact support if > 10 minutes

## Best Practices

### Before Graduation

1. **Monitor Progress**:
   - Check graduation bar daily
   - Set up price alerts
   - Join agent community

2. **Prepare Strategy**:
   - Decide hold vs sell
   - Set target prices
   - Plan liquidity provision

3. **Understand Risks**:
   - Post-graduation volatility
   - DEX trading differences
   - Impermanent loss (LPs)

### During Graduation

1. **Stay Calm**:
   - Process takes 2-5 minutes
   - Tokens remain safe
   - No action required

2. **Don't Panic**:
   - Trading pause is normal
   - Automatic process
   - Resume shortly

3. **Monitor**:
   - Watch announcements
   - Check BaseScan
   - Verify completion

### After Graduation

1. **Verify Everything**:
   - New contract address
   - Pool address
   - Token balance
   - Price alignment

2. **Adjust Strategy**:
   - DEX trading tactics
   - Different fee structure
   - New liquidity dynamics

3. **Stay Engaged**:
   - Monitor price action
   - Participate in community
   - Consider providing liquidity

## FAQs

**Q: Do I need to do anything when my agent graduates?**
A: No, the process is automatic. Your tokens will work with the new contract seamlessly.

**Q: Will I lose my tokens during graduation?**
A: No, your tokens are safe. They automatically transition to the new contract.

**Q: How long does graduation take?**
A: Typically 2-5 minutes. Delays can occur due to network congestion.

**Q: Can I trade during graduation?**
A: No, trading is paused during the transition (2-5 minutes).

**Q: Will the price change after graduation?**
A: Initial price matches bonding curve, but market determines new price. Expect volatility.

**Q: Can I provide liquidity after graduation?**
A: Yes! Visit Uniswap V3 and add to the AGENT/PROMPT pool.

**Q: What happens if graduation fails?**
A: Rare, but funds remain safe. Agent returns to bonding curve. Support will investigate.

**Q: Are there multiple graduations?**
A: No, graduation is a one-time event per agent.

## Resources

- **User Guide**: docs/USER_GUIDE.md
- **Trading Guide**: docs/TRADING_GUIDE.md
- **Smart Contracts**: docs/SMART_CONTRACTS.md
- **API Docs**: docs/API_DOCUMENTATION.md
- **FAQ**: docs/FAQ.md

---

*Last updated: January 2024*
*For support, visit discord.gg/promptbox*
